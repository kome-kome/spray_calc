import { describe, it, expect } from 'vitest';
import { NOZZLES } from './nozzles';
import { SPRAYERS } from './sprayers';

describe('nozzle data integrity', () => {
  it('has unique ids and positive rated flow / pressure', () => {
    const ids = new Set<string>();
    for (const n of NOZZLES) {
      expect(ids.has(n.id)).toBe(false);
      ids.add(n.id);
      expect(n.ratedFlowLmin).toBeGreaterThan(0);
      expect(n.ratedPressureMPa).toBeGreaterThan(0);
    }
  });
  it('verified records cite a source URL', () => {
    for (const n of NOZZLES) {
      if (n.source.verified) expect(Boolean(n.source.sourceUrl)).toBe(true);
    }
  });
});

describe('sprayer data integrity', () => {
  it('has unique ids and positive discharge / nozzle count where defined', () => {
    const ids = new Set<string>();
    for (const s of SPRAYERS) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      if (s.ratedTotalDischargeLmin != null) expect(s.ratedTotalDischargeLmin).toBeGreaterThan(0);
      if (s.nozzleCount != null) expect(s.nozzleCount).toBeGreaterThan(0);
    }
  });
  it('verified records cite a source URL', () => {
    for (const s of SPRAYERS) {
      if (s.source.verified) expect(Boolean(s.source.sourceUrl)).toBe(true);
    }
  });
});
