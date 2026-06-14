import type { DataSource } from './types';

/**
 * 適合マトリクス（機種 × 作物 × 散布方法 × 推奨ノズル/圧力）。
 *
 * 慣行ベースの目安のため provenance:'estimated'（要確認）。一次情報を確認でき次第、
 * 推奨ノズル・圧力を具体化／verified 化していく。recommendedNozzleIds が空の行は
 * 「対応ノズルは要確認」を意味する。
 */
export interface CompatibilityRow {
  machineId: string;
  cropId: string;
  sprayMethodId: string;
  recommendedNozzleIds: string[];
  pressureMPa: [number, number];
  note?: string;
  source: DataSource;
}

const est: DataSource = { provenance: 'estimated', verified: false, updatedAt: '2026-06-14' };

export const COMPATIBILITY: CompatibilityRow[] = [
  {
    machineId: 'kioritz-bsm512r',
    cropId: 'rice',
    sprayMethodId: 'boom-broadcast',
    recommendedNozzleIds: ['iso110-03', 'iso110-04'],
    pressureMPa: [0.2, 0.4],
    note: '水稲のブーム一斉散布の目安',
    source: est,
  },
  {
    machineId: 'kioritz-bsm512r',
    cropId: 'soybean',
    sprayMethodId: 'boom-broadcast',
    recommendedNozzleIds: ['iso110-03', 'iso110-04'],
    pressureMPa: [0.2, 0.4],
    source: est,
  },
  {
    machineId: 'kioritz-bsm513be',
    cropId: 'wheat',
    sprayMethodId: 'boom-broadcast',
    recommendedNozzleIds: ['iso110-04', 'iso110-05'],
    pressureMPa: [0.2, 0.4],
    source: est,
  },
  {
    machineId: 'kioritz-bsm513be',
    cropId: 'vegetable',
    sprayMethodId: 'boom-broadcast',
    recommendedNozzleIds: ['iso110-04', 'iso110-05', 'iso110-06'],
    pressureMPa: [0.2, 0.4],
    source: est,
  },
  {
    machineId: 'kioritz-ssv6150f',
    cropId: 'fruit',
    sprayMethodId: 'orchard-airblast',
    recommendedNozzleIds: [],
    pressureMPa: [1.0, 3.0],
    note: '果樹SS送風散布。専用ノズル（円錐）は要確認',
    source: est,
  },
  {
    machineId: 'kioritz-ssv5150f',
    cropId: 'fruit',
    sprayMethodId: 'orchard-airblast',
    recommendedNozzleIds: [],
    pressureMPa: [1.0, 3.0],
    source: est,
  },
  {
    machineId: 'kioritz-wgr617v-10',
    cropId: 'fruit',
    sprayMethodId: 'hose-lance',
    recommendedNozzleIds: [],
    pressureMPa: [1.0, 3.0],
    note: '動噴＋噴口の手散布。噴口は要確認',
    source: est,
  },
  {
    machineId: 'kioritz-wgr617v-10',
    cropId: 'vegetable',
    sprayMethodId: 'hose-lance',
    recommendedNozzleIds: [],
    pressureMPa: [0.5, 2.0],
    source: est,
  },
];
