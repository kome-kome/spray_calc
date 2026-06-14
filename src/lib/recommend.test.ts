import { describe, it, expect } from 'vitest';
import { recommendMachines, recommendNozzles } from './recommend';
import type { Machine, Nozzle } from '../data/types';

const src = { provenance: 'estimated' as const, verified: false, updatedAt: '2026-01-01' };
const baseM = {
  maker: 'm',
  applicableCropIds: [],
  sprayMethodIds: [],
  compatibleNozzleTypes: [],
  source: src,
};

const machines: Machine[] = [
  { ...baseM, id: 'boom', model: 'BOOM', category: 'boom', ratedTotalDischargeLmin: 25 },
  { ...baseM, id: 'pump', model: 'PUMP', category: 'power-rc', pumpCapacityLmin: 40 }, // usable = 32
  { ...baseM, id: 'small', model: 'SMALL', category: 'power-rc', pumpCapacityLmin: 15 }, // usable = 12
];

describe('recommendMachines', () => {
  it('uses usable discharge incl. the 0.8 pump factor', () => {
    const pump = recommendMachines(10, machines).find((m) => m.machine.id === 'pump')!;
    expect(pump.usableLmin).toBeCloseTo(32, 6); // 40 * 0.8
  });
  it('prefers the smallest sufficient machine, incapable last', () => {
    const r = recommendMachines(20, machines);
    expect(r[0].machine.id).toBe('boom'); // usable 25, closest to 20
    expect(r[r.length - 1].machine.id).toBe('small'); // usable 12 < 20, incapable
    expect(r[r.length - 1].capable).toBe(false);
  });
});

const nozzles: Nozzle[] = [
  { id: 'n02', maker: 'iso', model: '02', type: 'flat-fan', ratedFlowLmin: 0.79, ratedPressureMPa: 0.3, source: src },
  { id: 'n04', maker: 'iso', model: '04', type: 'flat-fan', ratedFlowLmin: 1.58, ratedPressureMPa: 0.3, source: src },
  { id: 'c1', maker: 'x', model: 'cone', type: 'full-cone', ratedFlowLmin: 1.58, ratedPressureMPa: 0.3, source: src },
];

describe('recommendNozzles', () => {
  it('ranks in-range nozzles first', () => {
    const r = recommendNozzles(31.6, 20, nozzles); // 1.58 L/本 → 04 at 0.3MPa
    expect(r[0].nozzle.id === 'n04' || r[0].nozzle.id === 'c1').toBe(true);
    expect(r[0].pressureMPa).toBeCloseTo(0.3, 2);
  });
  it('filters by nozzle type when requested', () => {
    const r = recommendNozzles(31.6, 20, nozzles, { nozzleTypes: ['flat-fan'] });
    expect(r.every((m) => m.nozzle.type === 'flat-fan')).toBe(true);
  });
  it('returns empty for invalid inputs', () => {
    expect(recommendNozzles(0, 20, nozzles)).toEqual([]);
    expect(recommendNozzles(30, 0, nozzles)).toEqual([]);
  });
});
