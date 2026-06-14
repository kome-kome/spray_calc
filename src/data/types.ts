/**
 * 機器・ノズルのデータスキーマ。
 *
 * `source` に出典・検証状態を持たせ、公開情報で初期化 → 一次情報の実データで
 * 差し替えて精度を上げられる設計。やまびこ(共立)製品を対象とする。
 */

export type Provenance =
  | 'iso-standard' // ISO 規格に基づく値
  | 'maker-catalog' // メーカ公式カタログ／製品ページ
  | 'estimated'; // 推定値（未確認）／慣行ベースのマッピング

export interface DataSource {
  provenance: Provenance;
  sourceUrl?: string;
  /** 一次情報で直接確認済みなら true。false は要確認。 */
  verified: boolean;
  updatedAt: string; // YYYY-MM-DD
}

export type NozzleType = 'flat-fan' | 'hollow-cone' | 'full-cone' | 'other';

export interface Nozzle {
  id: string;
  maker: string;
  series?: string;
  model: string;
  type: NozzleType;
  isoSize?: string;
  colorName?: string;
  colorHex?: string;
  fanAngleDeg?: number;
  ratedFlowLmin: number;
  ratedPressureMPa: number;
  productUrl?: string;
  source: DataSource;
}

/** 機種カテゴリ（やまびこ散布機）。 */
export type MachineCategory = 'boom' | 'speed' | 'power-rc' | 'power-set' | 'riding';

export const MACHINE_CATEGORY_LABELS: Record<MachineCategory, string> = {
  boom: 'ブームスプレーヤ',
  speed: 'スピードスプレーヤ',
  'power-rc': 'ラジコン動噴',
  'power-set': 'セット動噴',
  riding: '乗用管理機',
};

export interface Machine {
  id: string;
  maker: string;
  model: string;
  category: MachineCategory;
  totalWidthM?: number;
  sprayHeightM?: [number, number];
  nozzleCount?: number;
  /** ノズル総吐出量[L/min]（ブーム等の公表値）。 */
  ratedTotalDischargeLmin?: number;
  /** 吸水量／ポンプ最大吐出量[L/min]（動噴・SSV）= 吐出可能な流量の上限。 */
  pumpCapacityLmin?: number;
  maxPressureMPa?: number;
  tankL?: number;
  /** 適用作物（crops の id）。 */
  applicableCropIds: string[];
  /** 散布方法（sprayMethods の id）。 */
  sprayMethodIds: string[];
  compatibleNozzleTypes: NozzleType[];
  productUrl?: string;
  source: DataSource;
}
