import type { MachineCategory, NozzleType } from './types';

/**
 * 散布方法。機種カテゴリ × ノズル種別 × 想定圧力 × 対象作物 を結びつけ、
 * 「作物 → 散布方法 → 機種/ノズル」の逆算の起点にする。
 */
export interface SprayMethod {
  id: string;
  name: string;
  description: string;
  machineCategories: MachineCategory[];
  nozzleTypes: NozzleType[];
  typicalPressureMPa: [number, number];
  cropIds: string[];
}

export const SPRAY_METHODS: SprayMethod[] = [
  {
    id: 'boom-broadcast',
    name: 'ブーム散布',
    description: 'トラクタ装着ブームで畑面・水田を一斉散布',
    machineCategories: ['boom', 'riding'],
    nozzleTypes: ['flat-fan'],
    typicalPressureMPa: [0.2, 0.5],
    cropIds: ['rice', 'wheat', 'soybean', 'vegetable'],
  },
  {
    id: 'orchard-airblast',
    name: '送風散布（SS）',
    description: 'スピードスプレーヤで樹体へ送風噴霧',
    machineCategories: ['speed'],
    nozzleTypes: ['hollow-cone', 'full-cone'],
    typicalPressureMPa: [1.0, 3.0],
    cropIds: ['fruit'],
  },
  {
    id: 'hose-lance',
    name: 'ホース散布（動噴＋噴口）',
    description: '動噴にホースと噴口を接続して手散布',
    machineCategories: ['power-rc', 'power-set'],
    nozzleTypes: ['full-cone', 'other'],
    typicalPressureMPa: [1.0, 3.0],
    cropIds: ['fruit', 'vegetable', 'rice'],
  },
  {
    id: 'low-volume',
    name: '少量散布',
    description: '少量散布ノズルで散布量を抑える',
    machineCategories: ['boom', 'power-rc', 'power-set'],
    nozzleTypes: ['flat-fan', 'other'],
    typicalPressureMPa: [0.2, 0.5],
    cropIds: ['vegetable', 'soybean'],
  },
];
