/**
 * 機器・ノズルのデータスキーマ。
 *
 * `source` に出典・検証状態を持たせることで、まず公開情報で初期化し、
 * 後からメーカ公式の実データに差し替えて正確性を高められる設計にしている。
 */

export type Provenance =
  | 'iso-standard' // ISO 規格に基づく値
  | 'maker-catalog' // メーカ公式カタログ／製品ページ
  | 'estimated'; // 推定値（未確認）

export interface DataSource {
  provenance: Provenance;
  /** 出典 URL（製品ページ・規格ページ等）。 */
  sourceUrl?: string;
  /** 一次情報で直接確認済みなら true。false は要確認。 */
  verified: boolean;
  /** 最終更新日（ISO 8601, YYYY-MM-DD）。 */
  updatedAt: string;
}

export type NozzleType = 'flat-fan' | 'hollow-cone' | 'full-cone' | 'other';

export interface Nozzle {
  id: string;
  maker: string;
  series?: string;
  model: string;
  type: NozzleType;
  /** ISO ノズルサイズ記号（例: "02"）。 */
  isoSize?: string;
  /** ISO 色名（日本語）。 */
  colorName?: string;
  /** 表示用カラーコード。 */
  colorHex?: string;
  /** 噴霧角（度）。 */
  fanAngleDeg?: number;
  /** 定格圧力での吐出量[L/min]。 */
  ratedFlowLmin: number;
  /** 定格圧力[MPa]。 */
  ratedPressureMPa: number;
  productUrl?: string;
  source: DataSource;
}

export type SprayerType = 'boom' | 'speed' | 'other';

export interface Sprayer {
  id: string;
  maker: string;
  model: string;
  type: SprayerType;
  /** 全散布幅[m]。 */
  totalWidthM?: number;
  /** 散布高[m]（最小・最大）。 */
  sprayHeightM?: [number, number];
  nozzleCount?: number;
  /** ノズル総吐出量[L/min]。 */
  ratedTotalDischargeLmin?: number;
  /** 薬液ポンプ最大吐出量[L/min]。 */
  pumpMaxFlowLmin?: number;
  /** 薬液タンク容量[L]。 */
  tankL?: number;
  productUrl?: string;
  source: DataSource;
}
