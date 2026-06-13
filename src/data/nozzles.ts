import type { Nozzle } from './types';

/**
 * 初期ノズルデータ。
 *
 * ISO110 平板扇形ノズルは ISO 10625 の色分けと、サイズ記号（40psi 時の
 * 米ガロン/min）から 0.3MPa(≒3bar) 換算した代表流量を収録している。
 *   例) "02" = 0.2 US gpm @ 40psi = 0.757 L/min @ 0.276MPa
 *       → 0.3MPa では √(0.3/0.276) 倍 ≒ 0.79 L/min
 * 流量は規格定義からの算出値のため verified:true（出典 ISO 10625）。
 *
 * メーカ個別ノズルは公式流量表が未確認のため estimated / verified:false。
 * 実データが入手でき次第、ここを差し替えれば全機能の精度が上がる。
 */

const ISO_SOURCE = {
  provenance: 'iso-standard' as const,
  sourceUrl: 'https://www.iso.org/standard/37186.html',
  verified: true,
  updatedAt: '2026-06-13',
};

interface IsoSpec {
  size: string;
  flow03: number; // 0.3MPa 時の吐出量[L/min]
  colorName: string;
  colorHex: string;
}

// ISO 10625 標準色 × 0.3MPa 換算流量。
const ISO_110: IsoSpec[] = [
  { size: '01', flow03: 0.39, colorName: 'だいだい', colorHex: '#f59e0b' },
  { size: '015', flow03: 0.59, colorName: 'みどり', colorHex: '#16a34a' },
  { size: '02', flow03: 0.79, colorName: 'きいろ', colorHex: '#facc15' },
  { size: '025', flow03: 0.99, colorName: 'むらさき', colorHex: '#a855f7' },
  { size: '03', flow03: 1.18, colorName: 'あお', colorHex: '#2563eb' },
  { size: '04', flow03: 1.58, colorName: 'あか', colorHex: '#dc2626' },
  { size: '05', flow03: 1.97, colorName: 'ちゃ', colorHex: '#92400e' },
  { size: '06', flow03: 2.37, colorName: 'はい', colorHex: '#6b7280' },
  { size: '08', flow03: 3.16, colorName: 'しろ', colorHex: '#e5e7eb' },
  { size: '10', flow03: 3.95, colorName: 'みずいろ', colorHex: '#38bdf8' },
];

const isoNozzles: Nozzle[] = ISO_110.map((s) => ({
  id: `iso110-${s.size}`,
  maker: 'ISO規格',
  series: 'ISO110 平板扇形',
  model: `110-${s.size}`,
  type: 'flat-fan',
  isoSize: s.size,
  colorName: s.colorName,
  colorHex: s.colorHex,
  fanAngleDeg: 110,
  ratedFlowLmin: s.flow03,
  ratedPressureMPa: 0.3,
  source: ISO_SOURCE,
}));

const makerNozzles: Nozzle[] = [
  {
    id: 'yamaho-saving-y',
    maker: 'ヤマホ工業',
    series: 'セービングノズル',
    model: 'Y型（畑用少量散布）',
    type: 'flat-fan',
    ratedFlowLmin: 0.8, // 推定値・要確認
    ratedPressureMPa: 0.3,
    productUrl: 'https://www.yamaho-k.co.jp/01b/06_1/post_139.html',
    source: {
      provenance: 'estimated',
      sourceUrl: 'https://www.yamaho-k.co.jp/01b/06_1/post_139.html',
      verified: false,
      updatedAt: '2026-06-13',
    },
  },
];

export const NOZZLES: Nozzle[] = [...isoNozzles, ...makerNozzles];
