import { describe, it, expect } from 'vitest';
import {
  dischargeFromPlan,
  solveBalance,
  nozzleFlowAtPressure,
  pressureForFlow,
  totalNozzleDischarge,
  type BalanceFields,
  type BalanceKey,
} from './sprayMath';

// R·W·V·F/60 = 100·10·3·1/60 = 50。この1組で5ケースを往復検証できる。
const base = { R: 100, W: 10, V: 3, F: 1, Q: 50 } as const;

describe('dischargeFromPlan', () => {
  it('computes Q = R·W·V·F/60', () => {
    expect(dischargeFromPlan(100, 10, 3, 1)).toBeCloseTo(50, 6);
  });
});

describe('solveBalance round-trip', () => {
  const keys: BalanceKey[] = ['R', 'W', 'V', 'Q', 'F'];
  for (const k of keys) {
    it(`solves for ${k} and recovers the known value`, () => {
      const fields: BalanceFields = { ...base, [k]: null };
      const res = solveBalance(fields);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.key).toBe(k);
        expect(res.value).toBeCloseTo(base[k], 6);
      }
    });
  }
});

describe('solveBalance validation', () => {
  it('rejects zero blanks', () => {
    const r = solveBalance({ ...base });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_few_blanks');
  });
  it('rejects two blanks', () => {
    const r = solveBalance({ ...base, R: null, W: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_many_blanks');
  });
  it('rejects non-positive / NaN inputs', () => {
    expect(solveBalance({ ...base, R: null, W: 0 }).ok).toBe(false);
    expect(solveBalance({ ...base, R: null, V: -3 }).ok).toBe(false);
    expect(solveBalance({ ...base, R: null, F: NaN }).ok).toBe(false);
  });
});

describe('nozzle flow physics', () => {
  it('flow scales with sqrt(P): 4x pressure -> 2x flow', () => {
    expect(nozzleFlowAtPressure(2.0, 0.3, 1.2)).toBeCloseTo(4.0, 6);
  });
  it('pressureForFlow inverts nozzleFlowAtPressure', () => {
    const p = pressureForFlow(2.0, 0.3, 4.0);
    expect(p).toBeCloseTo(1.2, 6);
    expect(nozzleFlowAtPressure(2.0, 0.3, p)).toBeCloseTo(4.0, 6);
  });
  it('totalNozzleDischarge multiplies flow by count', () => {
    expect(totalNozzleDischarge(1.5, 20)).toBeCloseTo(30, 6);
  });
  it('returns NaN for invalid inputs', () => {
    expect(Number.isNaN(nozzleFlowAtPressure(0, 0.3, 0.3))).toBe(true);
    expect(Number.isNaN(pressureForFlow(2.0, 0.3, 0))).toBe(true);
  });
});
