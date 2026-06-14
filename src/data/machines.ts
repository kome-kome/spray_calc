import type { DataSource, Machine } from './types';

/**
 * やまびこ(共立)散布機データ。
 *
 * 数値は公式製品ページ＋複数の公開情報で相互確認した実スペック。公式詳細ページの
 * id があるものを verified:true、相互確認のみで一次ページ未確認のものは
 * verified:false（要確認）とし、確認でき次第更新する。
 *
 * - ブーム: ノズル総吐出量(ratedTotalDischargeLmin)を採用。
 * - SSV・動噴: 吸水量/ポンプ吐出量(pumpCapacityLmin)を採用。実用上はこの 8 割を
 *   吐出量の上限として選定する（selection.ts の usableDischargeLmin 参照）。
 */

const src = (sourceUrl: string, verified: boolean): DataSource => ({
  provenance: 'maker-catalog',
  sourceUrl,
  verified,
  updatedAt: '2026-06-14',
});

const BOOM_CROPS = ['rice', 'wheat', 'soybean', 'vegetable'];
const BOOM_METHODS = ['boom-broadcast', 'low-volume'];
const CAT = 'https://www.yamabiko-corp.co.jp/kioritz/products/category';

export const MACHINES: Machine[] = [
  // --- ブームスプレーヤ ---
  {
    id: 'kioritz-bsm511r',
    maker: '共立（やまびこ）',
    model: 'BSM511R',
    category: 'boom',
    totalWidthM: 8.4,
    nozzleCount: 28,
    ratedTotalDischargeLmin: 25,
    pumpCapacityLmin: 48,
    tankL: 500,
    applicableCropIds: BOOM_CROPS,
    sprayMethodIds: BOOM_METHODS,
    compatibleNozzleTypes: ['flat-fan'],
    productUrl: `${CAT}/detail/id=1937`,
    source: src(`${CAT}/detail/id=1937`, true),
  },
  {
    id: 'kioritz-bsm512r',
    maker: '共立（やまびこ）',
    model: 'BSM512R',
    category: 'boom',
    totalWidthM: 8.4,
    sprayHeightM: [0.4, 0.9],
    nozzleCount: 28,
    ratedTotalDischargeLmin: 25,
    pumpCapacityLmin: 48,
    tankL: 500,
    applicableCropIds: BOOM_CROPS,
    sprayMethodIds: BOOM_METHODS,
    compatibleNozzleTypes: ['flat-fan'],
    productUrl: `${CAT}/detail/id=13053`,
    source: src(`${CAT}/detail/id=13053`, true),
  },
  {
    id: 'kioritz-bsm513be',
    maker: '共立（やまびこ）',
    model: 'BSM513B/E',
    category: 'boom',
    totalWidthM: 10.2,
    sprayHeightM: [0.4, 1.4],
    nozzleCount: 34,
    ratedTotalDischargeLmin: 34.7,
    pumpCapacityLmin: 60,
    tankL: 500,
    applicableCropIds: BOOM_CROPS,
    sprayMethodIds: BOOM_METHODS,
    compatibleNozzleTypes: ['flat-fan'],
    productUrl: `${CAT}/detail/id=13054`,
    source: src(`${CAT}/detail/id=13054`, true),
  },

  // --- スピードスプレーヤ（果樹） ---
  {
    id: 'kioritz-ssv5150f',
    maker: '共立（やまびこ）',
    model: 'SSV5150F',
    category: 'speed',
    nozzleCount: 16,
    pumpCapacityLmin: 60,
    tankL: 500,
    applicableCropIds: ['fruit'],
    sprayMethodIds: ['orchard-airblast'],
    compatibleNozzleTypes: ['hollow-cone', 'full-cone'],
    productUrl: `${CAT}/contents_type=59`,
    source: src(`${CAT}/contents_type=59`, false),
  },
  {
    id: 'kioritz-ssv6150f',
    maker: '共立（やまびこ）',
    model: 'SSV6150F',
    category: 'speed',
    nozzleCount: 16,
    pumpCapacityLmin: 88,
    tankL: 600,
    applicableCropIds: ['fruit'],
    sprayMethodIds: ['orchard-airblast'],
    compatibleNozzleTypes: ['hollow-cone', 'full-cone'],
    productUrl: `${CAT}/detail/id=13879`,
    source: src(`${CAT}/detail/id=13879`, true),
  },
  {
    id: 'kioritz-ssvh1180fs',
    maker: '共立（やまびこ）',
    model: 'SSVH1180FS',
    category: 'speed',
    nozzleCount: 32,
    tankL: 1000,
    applicableCropIds: ['fruit'],
    sprayMethodIds: ['orchard-airblast'],
    compatibleNozzleTypes: ['hollow-cone', 'full-cone'],
    productUrl: `${CAT}/contents_type=59`,
    source: src(`${CAT}/contents_type=59`, false),
  },

  // --- ラジコン動噴 ---
  {
    id: 'kioritz-wgr617v-10',
    maker: '共立（やまびこ）',
    model: 'WGR617V-10',
    category: 'power-rc',
    pumpCapacityLmin: 32,
    maxPressureMPa: 5.0,
    applicableCropIds: ['fruit', 'vegetable', 'rice'],
    sprayMethodIds: ['hose-lance', 'low-volume'],
    compatibleNozzleTypes: ['full-cone', 'other'],
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/special/id=11024',
    source: src('https://www.yamabiko-corp.co.jp/kioritz/special/id=11024', true),
  },
  {
    id: 'kioritz-wgr457v-8',
    maker: '共立（やまびこ）',
    model: 'WGR457V-8',
    category: 'power-rc',
    pumpCapacityLmin: 30,
    maxPressureMPa: 5.0,
    applicableCropIds: ['fruit', 'vegetable', 'rice'],
    sprayMethodIds: ['hose-lance', 'low-volume'],
    compatibleNozzleTypes: ['full-cone', 'other'],
    productUrl: `${CAT}/contents_type=109`,
    source: src(`${CAT}/contents_type=109`, false),
  },
  {
    id: 'kioritz-vrc4570f2-8',
    maker: '共立（やまびこ）',
    model: 'VRC4570F2-8',
    category: 'power-rc',
    pumpCapacityLmin: 30,
    maxPressureMPa: 5.0,
    applicableCropIds: ['fruit', 'vegetable', 'rice'],
    sprayMethodIds: ['hose-lance', 'low-volume'],
    compatibleNozzleTypes: ['full-cone', 'other'],
    productUrl: `${CAT}/detail/id=12767`,
    source: src(`${CAT}/detail/id=12767`, true),
  },

  // --- セット動噴 ---
  {
    id: 'kioritz-wgrs617v-12',
    maker: '共立（やまびこ）',
    model: 'WGRS617V-12',
    category: 'power-set',
    pumpCapacityLmin: 43,
    maxPressureMPa: 5.0,
    applicableCropIds: ['fruit', 'vegetable'],
    sprayMethodIds: ['hose-lance'],
    compatibleNozzleTypes: ['full-cone', 'other'],
    productUrl: `${CAT}/contents_type=109`,
    source: src(`${CAT}/contents_type=109`, false),
  },
];
