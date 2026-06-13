import { describe, it, expect } from 'vitest';
import { recommendSprayers, recommendNozzles } from './recommend';
import type { Nozzle, Sprayer } from '../data/types';

const src = { provenance: 'estimated' as const, verified: false, updatedAt: '2026-01-01' };

const sprayers: Sprayer[] = [
  { id: 'a', maker: 'm', model: 'A', type: 'boom', ratedTotalDischargeLmin: 25, source: src },
  { id: 'b', maker: 'm', model: 'B', type: 'boom', ratedTotalDischargeLmin: 35, source: src },
  { id: 'c', maker: 'm', model: 'C', type: 'boom', ratedTotalDischargeLmin: 10, source: src },
];

describe('recommendSprayers', () => {
  it('prefers the smallest sufficient sprayer', () => {
    const r = recommendSprayers(20, sprayers);
    expect(r[0].sprayer.id).toBe('a'); // 25 is the smallest rated >= 20
    expect(r[0].capable).toBe(true);
  });
  it('puts incapable sprayers last, closest (largest) first', () => {
    const r = recommendSprayers(100, sprayers);
    expect(r.every((m) => !m.capable)).toBe(true);
    expect(r[0].sprayer.id).toBe('b'); // 35 is closest to 100
  });
});

const nozzles: Nozzle[] = [
  { id: 'n02', maker: 'iso', model: '02', type: 'flat-fan', ratedFlowLmin: 0.79, ratedPressureMPa: 0.3, source: src },
  { id: 'n04', maker: 'iso', model: '04', type: 'flat-fan', ratedFlowLmin: 1.58, ratedPressureMPa: 0.3, source: src },
];

describe('recommendNozzles', () => {
  it('computes operating pressure and ranks in-range nozzles first', () => {
    // requiredQ 31.6 / 20本 = 1.58 L/本 → 04 はちょうど 0.3MPa、02 は 1.2MPa(範囲外)
    const r = recommendNozzles(31.6, 20, nozzles);
    expect(r[0].nozzle.id).toBe('n04');
    expect(r[0].pressureMPa).toBeCloseTo(0.3, 2);
    expect(r[0].inRange).toBe(true);
    const n02 = r.find((m) => m.nozzle.id === 'n02')!;
    expect(n02.inRange).toBe(false);
  });
  it('returns empty for invalid inputs', () => {
    expect(recommendNozzles(0, 20, nozzles)).toEqual([]);
    expect(recommendNozzles(30, 0, nozzles)).toEqual([]);
  });
});
