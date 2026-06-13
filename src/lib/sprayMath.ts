/**
 * 散布計画の中核計算（単一の真実 / single source of truth）。
 *
 * 基本式:
 *   ノズル総吐出量 Q[L/min]
 *     = 反当散布量 R[L/10a] × 散布幅 W[m] × 走行速度 V[km/h] × 圃場係数 F ÷ 60
 *
 * 旧 index.html の5分岐を、この1つの順方向式＋逆算テーブルに集約している。
 * 逆算式は単位（BALANCE_FIELDS）と同じ場所に置くことで、旧コードの
 * 「反当散布量を L/min と表示」していた単位取り違えバグの再発を防ぐ。
 */

export type BalanceKey = 'R' | 'W' | 'V' | 'Q' | 'F';

export type BalanceFields = Record<BalanceKey, number | null>;

export interface BalanceFieldMeta {
  key: BalanceKey;
  label: string;
  unit: string;
  hint: string;
}

/** 画面表示順のフィールド定義（ラベルと単位の正本）。 */
export const BALANCE_FIELDS: BalanceFieldMeta[] = [
  { key: 'R', label: '反当散布量', unit: 'L/10a', hint: '10a あたりに撒く薬液量' },
  { key: 'W', label: '散布幅', unit: 'm', hint: '1行程で散布する幅' },
  { key: 'V', label: '走行速度', unit: 'km/h', hint: '散布時の走行速度' },
  { key: 'Q', label: 'ノズル総吐出量', unit: 'L/min', hint: '全ノズル合計の吐出量' },
  { key: 'F', label: '圃場係数', unit: '', hint: '通常は 1.0' },
];

/** 順方向: 4変数から Q を求める基本式。定数 60 はここだけに置く。 */
export function dischargeFromPlan(R: number, W: number, V: number, F: number): number {
  return (R * W * V * F) / 60;
}

/** 逆算テーブル: 対象キー → 残り4変数から対象値を求める関数。 */
const SOLVERS: Record<BalanceKey, (f: Record<BalanceKey, number>) => number> = {
  Q: ({ R, W, V, F }) => dischargeFromPlan(R, W, V, F),
  R: ({ W, V, F, Q }) => (60 * Q) / (W * V * F),
  W: ({ R, V, F, Q }) => (60 * Q) / (R * V * F),
  V: ({ R, W, F, Q }) => (60 * Q) / (R * W * F),
  F: ({ R, W, V, Q }) => (60 * Q) / (R * W * V),
};

const isPositiveFinite = (n: number | null): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0;

export type SolveFailure = 'too_few_blanks' | 'too_many_blanks' | 'invalid_inputs';

export type SolveResult =
  | { ok: true; key: BalanceKey; value: number }
  | { ok: false; reason: SolveFailure };

const ALL_KEYS: BalanceKey[] = ['R', 'W', 'V', 'Q', 'F'];

/**
 * ちょうど1つの空欄を、残り4つの正の値から逆算する。
 * - 空欄が0個 → too_few_blanks（1つ空ける必要がある）
 * - 空欄が2個以上 → too_many_blanks（空欄は1つだけにする）
 * - 入力済みに 0/負/非数 が混ざる → invalid_inputs
 */
export function solveBalance(fields: BalanceFields): SolveResult {
  const blanks = ALL_KEYS.filter((k) => fields[k] === null);
  const filled = ALL_KEYS.filter((k) => fields[k] !== null);

  if (filled.some((k) => !isPositiveFinite(fields[k]))) {
    return { ok: false, reason: 'invalid_inputs' };
  }
  if (blanks.length === 0) return { ok: false, reason: 'too_few_blanks' };
  if (blanks.length > 1) return { ok: false, reason: 'too_many_blanks' };

  const target = blanks[0];
  // 対象キーの値は逆算に使われないため 0 を入れておく。
  const nums: Record<BalanceKey, number> = {
    R: fields.R ?? 0,
    W: fields.W ?? 0,
    V: fields.V ?? 0,
    Q: fields.Q ?? 0,
    F: fields.F ?? 0,
  };

  const value = SOLVERS[target](nums);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: 'invalid_inputs' };
  }
  return { ok: true, key: target, value };
}

/**
 * ノズル1本あたりの吐出量[L/min]。
 * 流量は圧力の平方根に比例する（q ∝ √P）。
 */
export function nozzleFlowAtPressure(
  ratedFlowLmin: number,
  ratedPressureMPa: number,
  pressureMPa: number,
): number {
  if (ratedFlowLmin <= 0 || ratedPressureMPa <= 0 || pressureMPa <= 0) return NaN;
  return ratedFlowLmin * Math.sqrt(pressureMPa / ratedPressureMPa);
}

/**
 * 目標の1本あたり流量を得るのに必要な圧力[MPa]。
 * nozzleFlowAtPressure の逆関数: P = ratedP × (targetFlow / ratedFlow)²
 */
export function pressureForFlow(
  ratedFlowLmin: number,
  ratedPressureMPa: number,
  targetFlowLmin: number,
): number {
  if (ratedFlowLmin <= 0 || ratedPressureMPa <= 0 || targetFlowLmin <= 0) return NaN;
  const ratio = targetFlowLmin / ratedFlowLmin;
  return ratedPressureMPa * ratio * ratio;
}

/** ノズル総吐出量[L/min] = 1本あたり流量 × 本数。 */
export function totalNozzleDischarge(flowPerNozzleLmin: number, count: number): number {
  return flowPerNozzleLmin * count;
}

/** 表示用の丸め（小数第1位）。 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
