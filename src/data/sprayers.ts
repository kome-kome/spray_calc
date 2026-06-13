import type { Sprayer } from './types';

/**
 * 初期散布機データ（共立／やまびこ ブームスプレーヤ）。
 *
 * 仕様値は製品検索の要約に基づくが、製品ページの直接確認ができていない
 * ため verified:false（要確認）。実データ確認後に verified:true へ更新する。
 */

export const SPRAYERS: Sprayer[] = [
  {
    id: 'kioritz-bsm512r',
    maker: '共立（やまびこ）',
    model: 'BSM512R',
    type: 'boom',
    totalWidthM: 8.4,
    sprayHeightM: [0.4, 0.9],
    nozzleCount: 28,
    ratedTotalDischargeLmin: 25,
    pumpMaxFlowLmin: 48,
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13053',
    source: {
      provenance: 'maker-catalog',
      sourceUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13053',
      verified: false,
      updatedAt: '2026-06-13',
    },
  },
  {
    id: 'kioritz-bsm513be',
    maker: '共立（やまびこ）',
    model: 'BSM513B/E',
    type: 'boom',
    totalWidthM: 10.2,
    sprayHeightM: [0.4, 1.4],
    nozzleCount: 34,
    ratedTotalDischargeLmin: 34.7,
    pumpMaxFlowLmin: 60,
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13054',
    source: {
      provenance: 'maker-catalog',
      sourceUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13054',
      verified: false,
      updatedAt: '2026-06-13',
    },
  },
];
