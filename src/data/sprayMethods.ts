import type { CropCategory, MachineCategory, NozzleType } from './types';

/**
 * 散布方法。機種カテゴリ × ノズル種別 × 想定圧力 × 走行速度 × 対象作物カテゴリ を
 * 結びつけ、「作物 → 生育ステージ → 散布方法 → 機種/ノズル」の逆算の起点にする。
 *
 * 散布幅の意味は方法で変わる（ブームは機械の全幅、送風散布は樹列間隔、
 * ホース散布は噴口の有効散布幅）。ここを取り違えると必要吐出量が桁で狂うため、
 * `widthBasis` として明示する。
 */

/** 散布幅が何で決まるか。 */
export type WidthBasis = 'machine' | 'row-spacing' | 'manual';

export const WIDTH_BASIS_LABELS: Record<WidthBasis, string> = {
  machine: '機械の散布幅（ブーム全幅）',
  'row-spacing': '樹列間隔・畝間（1行程が受け持つ幅）',
  manual: '噴口の有効散布幅（手散布）',
};

export interface SprayMethod {
  id: string;
  name: string;
  description: string;
  machineCategories: MachineCategory[];
  nozzleTypes: NozzleType[];
  typicalPressureMPa: [number, number];
  /** 想定走行（歩行）速度[km/h]。 */
  speedKmh: [number, number];
  /** 既定の走行速度[km/h]。 */
  defaultSpeedKmh: number;
  widthBasis: WidthBasis;
  /** 作物側に幅の既定が無いときに使う散布幅[m]（手散布など）。 */
  defaultWidthM?: number;
  /** 対象作物カテゴリ。 */
  cropCategories: CropCategory[];
}

export const SPRAY_METHODS: SprayMethod[] = [
  {
    id: 'boom-broadcast',
    name: 'ブーム散布',
    description: 'トラクタ装着／乗用のブームで畑面・水田を一斉散布',
    machineCategories: ['boom', 'riding'],
    nozzleTypes: ['flat-fan'],
    typicalPressureMPa: [0.2, 0.5],
    speedKmh: [3, 8],
    defaultSpeedKmh: 6,
    widthBasis: 'machine',
    // 機種未選択時の既定幅（共立 BSM511R/512R の全幅）。
    defaultWidthM: 8.4,
    cropCategories: ['paddy', 'upland', 'vegetable'],
  },
  {
    id: 'low-volume',
    name: '少量散布',
    description: '少量散布ノズルで散布量を抑える（同じ防除でも慣行の 1/4〜1/5 の水量）',
    machineCategories: ['boom', 'riding', 'power-rc', 'power-set'],
    nozzleTypes: ['flat-fan', 'other'],
    typicalPressureMPa: [0.3, 0.8],
    speedKmh: [3, 8],
    defaultSpeedKmh: 5,
    widthBasis: 'machine',
    defaultWidthM: 8.4,
    cropCategories: ['paddy', 'upland', 'vegetable'],
  },
  {
    id: 'orchard-airblast',
    name: '送風散布（SS）',
    description: 'スピードスプレーヤで樹列に沿って走行し、樹体へ送風噴霧',
    machineCategories: ['speed'],
    nozzleTypes: ['hollow-cone', 'full-cone'],
    typicalPressureMPa: [1.0, 3.0],
    speedKmh: [1.5, 3.0],
    defaultSpeedKmh: 2.0,
    widthBasis: 'row-spacing',
    cropCategories: ['orchard', 'tea'],
  },
  {
    id: 'hose-lance',
    name: 'ホース散布（動噴＋噴口）',
    description: '動噴にホースと噴口を接続して手散布。歩行速度で薬液量が決まる',
    machineCategories: ['power-rc', 'power-set'],
    nozzleTypes: ['full-cone', 'other'],
    typicalPressureMPa: [1.0, 3.0],
    speedKmh: [1.0, 2.5],
    defaultSpeedKmh: 1.5,
    widthBasis: 'manual',
    defaultWidthM: 3.0,
    cropCategories: ['paddy', 'upland', 'vegetable', 'facility', 'orchard', 'tea'],
  },
  {
    id: 'facility-spray',
    name: '施設内散布',
    description: 'ハウス内で動噴＋ホース（自動散布装置を含む）により散布',
    machineCategories: ['power-set', 'power-rc'],
    nozzleTypes: ['full-cone', 'other'],
    typicalPressureMPa: [1.0, 2.5],
    speedKmh: [1.0, 2.0],
    defaultSpeedKmh: 1.5,
    widthBasis: 'manual',
    defaultWidthM: 2.0,
    cropCategories: ['facility'],
  },
];

export const METHOD_BY_ID = new Map(SPRAY_METHODS.map((m) => [m.id, m]));

export function getSprayMethod(id: string): SprayMethod | undefined {
  return METHOD_BY_ID.get(id);
}
