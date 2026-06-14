import type { Nozzle } from './types';

/**
 * 初期ノズルデータ。
 *
 * ISO110 平板扇形ノズルは ISO 10625 の色分けと、サイズ記号（40psi 時の
 * 米ガロン/min）から 0.3MPa(≒3bar) 換算した代表流量を収録（規格由来のため
 * verified:true）。ノズルは「やまびこ純正＋ISO標準」を主体とし、他社(ヤマホ)
 * はデータからは外して技術参考リンクのみ残す方針。やまびこ純正ノズルの流量表は
 * 一次情報を確認でき次第ここに追記する。
 */

const ISO_SOURCE = {
  provenance: 'iso-standard' as const,
  sourceUrl: 'https://www.iso.org/standard/37186.html',
  verified: true,
  updatedAt: '2026-06-14',
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

export const NOZZLES: Nozzle[] = [...isoNozzles];
