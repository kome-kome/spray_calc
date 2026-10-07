import type { DataSource } from './types';

/**
 * 適合マトリクス（機種 × 作物 × 散布方法 × 推奨ノズル/圧力）。
 *
 * 機種と作物の組み合わせ自体は「機種の適用カテゴリ × 作物カテゴリ」から導出できる
 * （lib/cropPlan.ts）。この表は、そこから導けない**個別の推奨ノズル・圧力**を
 * 上書きするための層で、品目が増えても行を増やさなくてよい設計にしている。
 *
 * 慣行ベースの目安のため provenance:'estimated'（要確認）。一次情報を確認でき次第、
 * 推奨ノズル・圧力を具体化／verified 化していく。recommendedNozzleIds が空の行は
 * 「対応ノズルは要確認」を意味する。
 */
export interface CompatibilityRow {
  machineId: string;
  cropId: string;
  sprayMethodId: string;
  /** 指定があればその生育ステージ限定の推奨。 */
  stageId?: string;
  recommendedNozzleIds: string[];
  pressureMPa: [number, number];
  note?: string;
  source: DataSource;
}

const est: DataSource = { provenance: 'estimated', verified: false, updatedAt: '2026-08-15' };

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
    cropId: 'rice',
    sprayMethodId: 'low-volume',
    stageId: 'rice-heading',
    recommendedNozzleIds: ['iso110-01', 'iso110-015'],
    pressureMPa: [0.3, 0.5],
    note: '穂ばらみ〜出穂期の少量散布。細かい粒径で付着量を確保する',
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
    cropId: 'cabbage',
    sprayMethodId: 'boom-broadcast',
    stageId: 'veg-heading',
    recommendedNozzleIds: ['iso110-04', 'iso110-05', 'iso110-06'],
    pressureMPa: [0.2, 0.4],
    note: '結球期は薬液量が増えるため大きめのサイズを選ぶ',
    source: est,
  },
  {
    machineId: 'kioritz-ssv6150f',
    cropId: 'apple',
    sprayMethodId: 'orchard-airblast',
    recommendedNozzleIds: [],
    pressureMPa: [1.0, 3.0],
    note: '果樹SS送風散布。専用ノズル（円錐）は要確認',
    source: est,
  },
  {
    machineId: 'kioritz-ssv5150f',
    cropId: 'citrus',
    sprayMethodId: 'orchard-airblast',
    recommendedNozzleIds: [],
    pressureMPa: [1.0, 3.0],
    source: est,
  },
  {
    machineId: 'kioritz-wgr617v-10',
    cropId: 'apple',
    sprayMethodId: 'hose-lance',
    stageId: 'orchard-dormant',
    recommendedNozzleIds: [],
    pressureMPa: [1.5, 3.0],
    note: '休眠期の多量散布。噴口は要確認',
    source: est,
  },
  {
    machineId: 'kioritz-wgr617v-10',
    cropId: 'cabbage',
    sprayMethodId: 'hose-lance',
    recommendedNozzleIds: [],
    pressureMPa: [0.5, 2.0],
    source: est,
  },
];

/** 機種×作物×散布方法（＋ステージ）に対する明示の推奨。ステージ指定行を優先。 */
export function findCompatibility(
  machineId: string,
  cropId: string,
  sprayMethodId: string,
  stageId?: string,
): CompatibilityRow | undefined {
  const rows = COMPATIBILITY.filter(
    (r) => r.machineId === machineId && r.cropId === cropId && r.sprayMethodId === sprayMethodId,
  );
  return rows.find((r) => r.stageId != null && r.stageId === stageId) ?? rows.find((r) => r.stageId == null);
}
