import { describe, it, expect } from 'vitest';
import { NOZZLES } from './nozzles';
import { MACHINES } from './machines';
import { CROP_PRESETS, sprayMethodIdsForCrop } from './crops';
import { SPRAY_METHODS, METHOD_BY_ID } from './sprayMethods';
import { COMPATIBILITY } from './compatibility';
import { CROP_CATEGORY_ORDER } from './types';
import { machinesForPlan, resolvePlan } from '../lib/cropPlan';

const nozzleIds = new Set(NOZZLES.map((n) => n.id));
const machineIds = new Set(MACHINES.map((m) => m.id));
const cropIds = new Set(CROP_PRESETS.map((c) => c.id));
const methodIds = new Set(SPRAY_METHODS.map((s) => s.id));
const categories = new Set(CROP_CATEGORY_ORDER);

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
      expect(m.applicableCropCategories.length).toBeGreaterThan(0);
      for (const c of m.applicableCropCategories) expect(categories.has(c)).toBe(true);
      for (const s of m.sprayMethodIds) expect(methodIds.has(s)).toBe(true);
    }
  });
});

describe('spray method data integrity', () => {
  it('has valid speed / pressure ranges and crop categories', () => {
    for (const s of SPRAY_METHODS) {
      expect(s.speedKmh[0]).toBeLessThan(s.speedKmh[1]);
      expect(s.typicalPressureMPa[0]).toBeLessThan(s.typicalPressureMPa[1]);
      expect(s.defaultSpeedKmh).toBeGreaterThanOrEqual(s.speedKmh[0]);
      expect(s.defaultSpeedKmh).toBeLessThanOrEqual(s.speedKmh[1]);
      expect(s.cropCategories.length).toBeGreaterThan(0);
      for (const c of s.cropCategories) expect(categories.has(c)).toBe(true);
    }
  });
});

describe('crop data integrity', () => {
  it('has unique crop ids and unique stage ids per crop', () => {
    const seen = new Set<string>();
    for (const c of CROP_PRESETS) {
      expect(seen.has(c.id)).toBe(false);
      seen.add(c.id);
      expect(c.stages.length).toBeGreaterThan(0);
      const stages = new Set<string>();
      for (const s of c.stages) {
        expect(stages.has(s.id)).toBe(false);
        stages.add(s.id);
        expect(s.methods.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps spray volume ranges ordered and positive', () => {
    for (const c of CROP_PRESETS) {
      for (const s of c.stages) {
        for (const m of s.methods) {
          const v = m.volumeLper10a;
          expect(v.min).toBeGreaterThan(0);
          expect(v.min).toBeLessThanOrEqual(v.typical);
          expect(v.typical).toBeLessThanOrEqual(v.max);
        }
      }
    }
  });

  it('only uses spray methods that cover the crop category', () => {
    for (const c of CROP_PRESETS) {
      for (const id of sprayMethodIdsForCrop(c)) {
        const method = METHOD_BY_ID.get(id);
        expect(method, `${c.id} references unknown method ${id}`).toBeTruthy();
        expect(method?.cropCategories).toContain(c.category);
      }
    }
  });

  it('gives every crop at least one machine to propose', () => {
    for (const c of CROP_PRESETS) {
      const proposable = c.stages.flatMap((s) =>
        s.methods.flatMap((m) => {
          const ctx = resolvePlan(c.id, s.id, m.sprayMethodId);
          return ctx ? machinesForPlan(ctx, MACHINES) : [];
        }),
      );
      expect(proposable.length, `${c.id} has no applicable machine`).toBeGreaterThan(0);
    }
  });

  it('sets a row spacing for crops sprayed by airblast', () => {
    for (const c of CROP_PRESETS) {
      if (sprayMethodIdsForCrop(c).includes('orchard-airblast')) {
        expect(c.defaultWidthM, `${c.id} needs a row spacing`).toBeGreaterThan(0);
      }
    }
  });
});

describe('compatibility matrix referential integrity', () => {
  it('rows reference existing machine / crop / method / stage / nozzles', () => {
    for (const r of COMPATIBILITY) {
      expect(machineIds.has(r.machineId)).toBe(true);
      expect(cropIds.has(r.cropId)).toBe(true);
      expect(methodIds.has(r.sprayMethodId)).toBe(true);
      for (const nid of r.recommendedNozzleIds) expect(nozzleIds.has(nid)).toBe(true);
      if (r.stageId != null) {
        expect(resolvePlan(r.cropId, r.stageId, r.sprayMethodId), `${r.machineId}/${r.cropId}`).toBeTruthy();
      }
    }
  });
});
