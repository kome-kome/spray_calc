import {
  cropVolumeSpan,
  getCrop,
  getStage,
  sprayMethodIdsForCrop,
  type CropPreset,
  type CropStage,
  type CropStageMethod,
  type VolumeRange,
} from '../data/crops';
import { getSprayMethod, type SprayMethod } from '../data/sprayMethods';
import type { Machine, NozzleType } from '../data/types';
import { dischargeFromPlan } from './sprayMath';

/**
 * 作物 × 生育ステージ × 散布方法 から、散布計画の前提条件を解決する層。
 *
 * 提案が現場と噛み合わなかった原因は「作物ごとに散布量が1値」「散布幅・走行速度が
 * 作物と無関係」「作物に使えない機種まで提案される」の3点。ここでその3点を
 *   1. ステージ×方法ごとの散布量レンジ（planVolume）
 *   2. 方法ごとの散布幅の意味と既定値（defaultWidthM / defaultSpeedKmh）
 *   3. 作物カテゴリ×散布方法での機種の絞り込み（machinesForPlan）
 * として一箇所に集約し、UI からは解決済みの前提だけを使う。
 */

export interface PlanContext {
  crop: CropPreset;
  stage: CropStage;
  method: SprayMethod;
  /** このステージ×方法での反当散布量[L/10a]の目安レンジ。 */
  volumeLper10a: VolumeRange;
  /** 作物データ側の補足（展着剤が要る等）。 */
  note?: string;
}

/** 作物・ステージ・方法の3点が揃い、かつ整合していれば前提を解決する。 */
export function resolvePlan(
  cropId: string,
  stageId: string,
  sprayMethodId: string,
): PlanContext | null {
  const crop = getCrop(cropId);
  if (!crop) return null;
  const stage = getStage(crop, stageId);
  if (!stage) return null;
  const entry: CropStageMethod | undefined = stage.methods.find(
    (m) => m.sprayMethodId === sprayMethodId,
  );
  if (!entry) return null;
  const method = getSprayMethod(sprayMethodId);
  if (!method) return null;
  return { crop, stage, method, volumeLper10a: entry.volumeLper10a, note: entry.note };
}

/** そのステージで選べる散布方法。 */
export function methodsForStage(stage: CropStage): SprayMethod[] {
  return stage.methods
    .map((m) => getSprayMethod(m.sprayMethodId))
    .filter((m): m is SprayMethod => m != null);
}

/** その作物で使われる散布方法（全ステージ）。 */
export function methodsForCropId(cropId: string): SprayMethod[] {
  const crop = getCrop(cropId);
  if (!crop) return [];
  return sprayMethodIdsForCrop(crop)
    .map((id) => getSprayMethod(id))
    .filter((m): m is SprayMethod => m != null);
}

/**
 * 散布幅の既定値[m]。方法によって「幅」の意味が違うため、参照する順序を変える。
 * - 機械基準（ブーム）: 選択中の機種の全幅 → 方法の既定
 * - 樹列基準（送風散布）: 作物の樹列間隔 → 方法の既定
 * - 手散布: 方法（噴口）の有効幅 → 作物の樹列間隔
 */
export function defaultWidthM(ctx: PlanContext, machine?: Machine): number | undefined {
  const { crop, method } = ctx;
  switch (method.widthBasis) {
    case 'machine':
      return machine?.totalWidthM ?? method.defaultWidthM;
    case 'row-spacing':
      return crop.defaultWidthM ?? method.defaultWidthM;
    case 'manual':
      return method.defaultWidthM ?? crop.defaultWidthM;
  }
}

export interface PlanDefaults {
  /** 反当散布量[L/10a]（レンジの標準値）。 */
  R: number;
  /** 散布幅[m]（不明なら undefined）。 */
  W?: number;
  /** 走行（歩行）速度[km/h]。 */
  V: number;
}

/** 入力欄の初期値。ユーザが手で入れ直すことを前提にした「もっともらしい既定」。 */
export function planDefaults(ctx: PlanContext, machine?: Machine): PlanDefaults {
  return {
    R: ctx.volumeLper10a.typical,
    W: defaultWidthM(ctx, machine),
    V: ctx.method.defaultSpeedKmh,
  };
}

export type PlanIssueField = 'R' | 'W' | 'V';

export interface PlanIssue {
  field: PlanIssueField;
  level: 'warn' | 'info';
  message: string;
}

const outOfRange = (value: number, min: number, max: number) => value < min || value > max;

/**
 * 入力値が作物・散布方法の実態から外れていないかを判定する。
 * 計算自体は成立してしまうため（例: 果樹300L/10a をブーム幅8.4mで走る）、
 * 「計算はできるが現場ではあり得ない」入力をここで拾う。
 */
export function validatePlan(
  ctx: PlanContext,
  values: { R: number | null; W: number | null; V: number | null },
  machine?: Machine,
): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const { crop, method, volumeLper10a: vol } = ctx;
  const { R, W, V } = values;

  if (R != null && R > 0 && outOfRange(R, vol.min, vol.max)) {
    issues.push({
      field: 'R',
      level: 'warn',
      message: `${crop.name}／${ctx.stage.name}／${method.name} の反当散布量は通常 ${vol.min}〜${vol.max} L/10a です（標準 ${vol.typical}）。`,
    });
  }

  if (V != null && V > 0 && outOfRange(V, method.speedKmh[0], method.speedKmh[1])) {
    issues.push({
      field: 'V',
      level: 'warn',
      message: `${method.name}の速度は通常 ${method.speedKmh[0]}〜${method.speedKmh[1]} km/h です。`,
    });
  }

  if (W != null && W > 0) {
    const def = defaultWidthM(ctx, machine);
    if (method.widthBasis === 'row-spacing' && def != null && (W > def * 1.5 || W < def * 0.5)) {
      issues.push({
        field: 'W',
        level: 'warn',
        message: `送風散布の散布幅は樹列間隔（${crop.name}の目安 ${def} m）です。機械の全幅ではありません。`,
      });
    }
    if (method.widthBasis === 'machine' && machine?.totalWidthM != null && W > machine.totalWidthM) {
      issues.push({
        field: 'W',
        level: 'warn',
        message: `${machine.model} の散布幅は ${machine.totalWidthM} m です。`,
      });
    }
    if (method.widthBasis === 'manual' && W > 6) {
      issues.push({
        field: 'W',
        level: 'info',
        message: '手散布の有効散布幅は噴口により概ね 2〜4 m です。',
      });
    }
  }

  return issues;
}

/** 散布量レンジ（下限・標準・上限）に対応する必要ノズル総吐出量[L/min]。 */
export function requiredDischargeRange(
  ctx: PlanContext,
  W: number,
  V: number,
  F = 1,
): VolumeRange | null {
  if (!(W > 0) || !(V > 0) || !(F > 0)) return null;
  const { min, typical, max } = ctx.volumeLper10a;
  return {
    min: dischargeFromPlan(min, W, V, F),
    typical: dischargeFromPlan(typical, W, V, F),
    max: dischargeFromPlan(max, W, V, F),
  };
}

/**
 * その機種の実用吐出量で目標の散布量を撒くのに必要な走行速度[km/h]。
 * 吐出量が足りない機種を「使えない」で終わらせず、現場の対処（減速・ノズル変更）に
 * 直せるようにするための逆算。
 */
export function speedForDischarge(
  usableLmin: number,
  R: number,
  W: number,
  F = 1,
): number | null {
  if (!(usableLmin > 0) || !(R > 0) || !(W > 0) || !(F > 0)) return null;
  return (60 * usableLmin) / (R * W * F);
}

/** その作物カテゴリ・散布方法に使える機種。作物と無関係な機種を提案しないための絞り込み。 */
export function machinesForPlan(ctx: PlanContext, machines: Machine[]): Machine[] {
  return machines.filter(
    (m) =>
      m.applicableCropCategories.includes(ctx.crop.category) &&
      m.sprayMethodIds.includes(ctx.method.id),
  );
}

export interface NozzleCriteria {
  nozzleTypes: NozzleType[];
  minPressureMPa: number;
  maxPressureMPa: number;
  sweetSpotMPa: number;
}

/** 散布方法からノズル種別・圧力の探索条件を決める（ブームは平板、SSは円錐など）。 */
export function nozzleCriteria(method: SprayMethod): NozzleCriteria {
  const [min, max] = method.typicalPressureMPa;
  return {
    nozzleTypes: method.nozzleTypes,
    minPressureMPa: min,
    maxPressureMPa: max,
    sweetSpotMPa: (min + max) / 2,
  };
}

export interface LiquidPlan {
  /** 総使用薬液量[L]。 */
  totalLiquidL: number;
  /** タンク1杯で散布できる面積[10a]（タンク容量が分かる場合）。 */
  areaPerTank10a?: number;
  /** 必要なタンク回数（切り上げ）。 */
  tankLoads?: number;
  /** 必要な薬剤量[mL または g]（希釈倍数指定時）。 */
  chemicalAmount?: number;
}

/**
 * 薬液量まわりの実務計算。
 * 総薬液量 = 反当散布量 × 面積 × 回数、薬剤量 = 総薬液量 × 1000 ÷ 希釈倍数。
 */
export function liquidPlan(
  R: number,
  area10a: number,
  times: number,
  opts: { tankL?: number; dilution?: number | null } = {},
): LiquidPlan | null {
  if (!(R > 0) || !(area10a > 0) || !(times > 0)) return null;
  const totalLiquidL = R * area10a * times;
  const plan: LiquidPlan = { totalLiquidL };
  if (opts.tankL != null && opts.tankL > 0) {
    plan.areaPerTank10a = opts.tankL / R;
    plan.tankLoads = Math.ceil(totalLiquidL / opts.tankL);
  }
  if (opts.dilution != null && opts.dilution > 0) {
    plan.chemicalAmount = (totalLiquidL * 1000) / opts.dilution;
  }
  return plan;
}

/** 一覧表示用の散布量レンジ文字列（例: 「80〜300 L/10a」）。 */
export function volumeSpanLabel(crop: CropPreset): string {
  const { min, max } = cropVolumeSpan(crop);
  return `${min}〜${max} L/10a`;
}
