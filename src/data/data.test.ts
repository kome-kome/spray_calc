import { describe, it, expect } from 'vitest';
import { NOZZLES } from './nozzles';
import { MACHINES } from './machines';
import { CROP_PRESETS } from './crops';
import { SPRAY_METHODS } from './sprayMethods';
import { COMPATIBILITY } from './compatibility';

const nozzleIds = new Set(NOZZLES.map((n) => n.id));
const machineIds = new Set(MACHINES.map((m) => m.id));
const cropIds = new Set(CROP_PRESETS.map((c) => c.id));
const methodIds = new Set(SPRAY_METHODS.map((s) => s.id));

describe('nozzle data integrity', () => {
  it('has unique ids and positive rated flow / pressure', () => {
    const seen = new Set<string>();
    for (const n of NOZZLES) {
      expect(seen.has(n.id)).toBe(false);
      seen.add(n.id);
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

describe('machine data integrity', () => {
  it('has unique ids, positive specs, and valid cross-references', () => {
    const seen = new Set<string>();
    for (const m of MACHINES) {
      expect(seen.has(m.id)).toBe(false);
      seen.add(m.id);
      if (m.ratedTotalDischargeLmin != null) expect(m.ratedTotalDischargeLmin).toBeGreaterThan(0);
      if (m.pumpCapacityLmin != null) expect(m.pumpCapacityLmin).toBeGreaterThan(0);
      if (m.source.verified) expect(Boolean(m.source.sourceUrl)).toBe(true);
      for (const c of m.applicableCropIds) expect(cropIds.has(c)).toBe(true);
      for (const s of m.sprayMethodIds) expect(methodIds.has(s)).toBe(true);
    }
  });
});

describe('crop / spray-method cross references', () => {
  it('spray methods reference existing crops', () => {
    for (const s of SPRAY_METHODS) for (const c of s.cropIds) expect(cropIds.has(c)).toBe(true);
  });
  it('crops reference existing spray methods', () => {
    for (const c of CROP_PRESETS) for (const s of c.sprayMethodIds) expect(methodIds.has(s)).toBe(true);
  });
});

describe('compatibility matrix referential integrity', () => {
  it('rows reference existing machine / crop / method / nozzles', () => {
    for (const r of COMPATIBILITY) {
      expect(machineIds.has(r.machineId)).toBe(true);
      expect(cropIds.has(r.cropId)).toBe(true);
      expect(methodIds.has(r.sprayMethodId)).toBe(true);
      for (const nid of r.recommendedNozzleIds) expect(nozzleIds.has(nid)).toBe(true);
    }
  });
});
