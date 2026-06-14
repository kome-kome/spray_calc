import { describe, it, expect } from 'vitest';
import { usableDischargeLmin, isPumpCapacityBased, methodsForCrop, PUMP_USABLE_RATIO } from './selection';
import type { Machine } from '../data/types';

const base = {
  id: 'x',
  maker: 'm',
  model: 'M',
  applicableCropIds: [],
  sprayMethodIds: [],
  compatibleNozzleTypes: [],
  source: { provenance: 'estimated' as const, verified: false, updatedAt: '2026-01-01' },
};

describe('usableDischargeLmin', () => {
  it('uses rated nozzle discharge for boom', () => {
    const m: Machine = { ...base, category: 'boom', ratedTotalDischargeLmin: 25, pumpCapacityLmin: 48 };
    expect(usableDischargeLmin(m)).toBe(25);
    expect(isPumpCapacityBased(m)).toBe(false);
  });
  it('uses 吸水量 × 0.8 for power sprayers', () => {
    const m: Machine = { ...base, category: 'power-rc', pumpCapacityLmin: 32 };
    expect(PUMP_USABLE_RATIO).toBe(0.8);
    expect(usableDischargeLmin(m)).toBeCloseTo(25.6, 6);
    expect(isPumpCapacityBased(m)).toBe(true);
  });
  it('returns null when no capacity is known', () => {
    const m: Machine = { ...base, category: 'riding' };
    expect(usableDischargeLmin(m)).toBeNull();
  });
});

describe('methodsForCrop', () => {
  it('returns methods applicable to the crop', () => {
    expect(methodsForCrop('fruit').some((m) => m.id === 'orchard-airblast')).toBe(true);
    expect(methodsForCrop('rice').some((m) => m.id === 'boom-broadcast')).toBe(true);
  });
});
