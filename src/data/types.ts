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

/**
 * 作物カテゴリ。散布の作業形態（機械・散布量水準）がほぼ同じ品目をまとめた区分で、
 * 機種の適用範囲・散布方法の対象はこの粒度で持つ（品目を増やしても機種側の
 * 修正が要らないようにするため）。
 */
export type CropCategory = 'paddy' | 'upland' | 'vegetable' | 'facility' | 'orchard' | 'tea';

export const CROP_CATEGORY_LABELS: Record<CropCategory, string> = {
  paddy: '水稲',
  upland: '畑作',
  vegetable: '露地野菜',
  facility: '施設野菜',
  orchard: '果樹',
  tea: '茶',
};

export const CROP_CATEGORY_ORDER: CropCategory[] = [
  'paddy',
  'upland',
  'vegetable',
  'facility',
  'orchard',
  'tea',
];

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
  /** 適用作物カテゴリ（品目単位ではなくカテゴリ単位で保持）。 */
  applicableCropCategories: CropCategory[];
  /** 散布方法（sprayMethods の id）。 */
  sprayMethodIds: string[];
  compatibleNozzleTypes: NozzleType[];
  productUrl?: string;
  source: DataSource;
}
