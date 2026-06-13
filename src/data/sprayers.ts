import type { Sprayer } from './types';

/**
 * 散布機データ（共立／やまびこ ブームスプレーヤ）。
 *
 * 数値は共立(やまびこ)公式製品ページおよび複数の公開情報で相互確認した
 * 実スペック。確認済みのため verified:true（sourceUrl は公式製品ページ）。
 * 追加モデルは公式諸元を確認のうえ、同じ形式で追記できる。
 */

export const SPRAYERS: Sprayer[] = [
  {
    id: 'kioritz-bsm511r',
    maker: '共立（やまびこ）',
    model: 'BSM511R',
    type: 'boom',
    totalWidthM: 8.4,
    nozzleCount: 28,
    ratedTotalDischargeLmin: 25,
    pumpMaxFlowLmin: 48,
    tankL: 500,
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=1937',
    source: {
      provenance: 'maker-catalog',
      sourceUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=1937',
      verified: true,
      updatedAt: '2026-06-13',
    },
  },
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
    tankL: 500,
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13053',
    source: {
      provenance: 'maker-catalog',
      sourceUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13053',
      verified: true,
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
    tankL: 500,
    productUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13054',
    source: {
      provenance: 'maker-catalog',
      sourceUrl: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/detail/id=13054',
      verified: true,
      updatedAt: '2026-06-13',
    },
  },
];
