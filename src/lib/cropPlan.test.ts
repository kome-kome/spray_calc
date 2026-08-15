import { describe, it, expect } from 'vitest';
import { MACHINES } from '../data/machines';
import {
  defaultWidthM,
  liquidPlan,
  machinesForPlan,
  methodsForCropId,
  methodsForStage,
  nozzleCriteria,
  planDefaults,
  requiredDischargeRange,
  resolvePlan,
  speedForDischarge,
  validatePlan,
} from './cropPlan';
import { getCrop } from '../data/crops';

const ricePlan = () => resolvePlan('rice', 'rice-heading', 'hose-lance')!;
const appleAirblast = () => resolvePlan('apple', 'orchard-dormant', 'orchard-airblast')!;

describe('resolvePlan', () => {
  it('resolves crop / stage / method into one context', () => {
    const ctx = ricePlan();
    expect(ctx.crop.name).toBe('水稲');
    expect(ctx.stage.name).toContain('穂ばらみ');
    expect(ctx.method.id).toBe('hose-lance');
    expect(ctx.volumeLper10a.typical).toBe(120);
  });

  it('returns null for combinations the crop does not use', () => {
    expect(resolvePlan('apple', 'orchard-dormant', 'boom-broadcast')).toBeNull();
    expect(resolvePlan('rice', 'orchard-dormant', 'hose-lance')).toBeNull();
    expect(resolvePlan('unknown', 'x', 'hose-lance')).toBeNull();
  });

  it('separates spray volume by stage and by method', () => {
    const hose = resolvePlan('rice', 'rice-early', 'hose-lance')!;
    const lowVolume = resolvePlan('rice', 'rice-early', 'low-volume')!;
    // 同じ場面でも方法が変われば散布量は数倍変わる。
    expect(hose.volumeLper10a.typical).toBeGreaterThan(lowVolume.volumeLper10a.typical * 3);

    const dormant = resolvePlan('apple', 'orchard-dormant', 'orchard-airblast')!;
    const growing = resolvePlan('apple', 'orchard-growing', 'orchard-airblast')!;
    // 果樹の休眠期散布は生育期より多量。
    expect(dormant.volumeLper10a.typical).toBeGreaterThan(growing.volumeLper10a.typical);
  });
});

describe('planDefaults', () => {
  it('uses the row spacing as spray width for airblast', () => {
    const ctx = appleAirblast();
    const d = planDefaults(ctx);
    expect(d.W).toBe(getCrop('apple')!.defaultWidthM);
    expect(d.R).toBe(ctx.volumeLper10a.typical);
    expect(d.V).toBe(ctx.method.defaultSpeedKmh);
  });

  it('prefers the selected machine width for boom spraying', () => {
    const ctx = resolvePlan('wheat', 'wheat-tillering', 'boom-broadcast')!;
    const boom = MACHINES.find((m) => m.id === 'kioritz-bsm513be')!;
    expect(defaultWidthM(ctx, boom)).toBe(boom.totalWidthM);
    expect(defaultWidthM(ctx)).toBe(ctx.method.defaultWidthM);
  });
});

describe('validatePlan', () => {
  it('accepts values inside the crop / method range', () => {
    const ctx = appleAirblast();
    const d = planDefaults(ctx);
    expect(validatePlan(ctx, { R: d.R, W: d.W ?? null, V: d.V })).toEqual([]);
  });

  it('flags a spray volume outside the range for the stage', () => {
    const ctx = appleAirblast(); // 300〜600 L/10a
    const issues = validatePlan(ctx, { R: 25, W: 4, V: 2 });
    expect(issues.some((i) => i.field === 'R' && i.level === 'warn')).toBe(true);
  });

  it('flags a boom width used as the airblast spray width', () => {
    const ctx = appleAirblast(); // 樹列間隔 4.0m
    const issues = validatePlan(ctx, { R: 400, W: 8.4, V: 2 });
    expect(issues.some((i) => i.field === 'W')).toBe(true);
  });

  it('flags a travel speed the method does not run at', () => {
    const ctx = appleAirblast(); // 1.5〜3.0 km/h
    const issues = validatePlan(ctx, { R: 400, W: 4, V: 6 });
    expect(issues.some((i) => i.field === 'V')).toBe(true);
  });
});

describe('machinesForPlan', () => {
  it('keeps only machines applicable to the crop category and method', () => {
    const orchard = machinesForPlan(appleAirblast(), MACHINES);
    expect(orchard.length).toBeGreaterThan(0);
    expect(orchard.every((m) => m.category === 'speed')).toBe(true);

    const boom = machinesForPlan(resolvePlan('wheat', 'wheat-tillering', 'boom-broadcast')!, MACHINES);
    expect(boom.every((m) => m.applicableCropCategories.includes('upland'))).toBe(true);
    // 果樹用のスピードスプレーヤは麦のブーム散布には出さない。
    expect(boom.some((m) => m.category === 'speed')).toBe(false);
  });
});

describe('nozzleCriteria', () => {
  it('follows the method: fan nozzles for boom, cone nozzles for airblast', () => {
    const boom = nozzleCriteria(resolvePlan('wheat', 'wheat-tillering', 'boom-broadcast')!.method);
    expect(boom.nozzleTypes).toEqual(['flat-fan']);
    expect(boom.maxPressureMPa).toBe(0.5);

    const ss = nozzleCriteria(appleAirblast().method);
    expect(ss.nozzleTypes).toContain('hollow-cone');
    expect(ss.minPressureMPa).toBe(1.0);
  });
});

describe('requiredDischargeRange', () => {
  it('maps the volume range onto the required discharge', () => {
    const ctx = appleAirblast(); // 300 / 400 / 600 L/10a
    const r = requiredDischargeRange(ctx, 4, 2, 1)!;
    expect(r.min).toBeCloseTo((300 * 4 * 2) / 60, 6);
    expect(r.max).toBeCloseTo((600 * 4 * 2) / 60, 6);
    expect(requiredDischargeRange(ctx, 0, 2, 1)).toBeNull();
  });
});

describe('speedForDischarge', () => {
  it('gives the speed a machine must slow down to for the target volume', () => {
    // 実用吐出量 25 L/min・散布幅 8.4m で 100 L/10a を撒くなら 1.79 km/h。
    expect(speedForDischarge(25, 100, 8.4)).toBeCloseTo((60 * 25) / (100 * 8.4), 6);
    expect(speedForDischarge(0, 100, 8.4)).toBeNull();
    expect(speedForDischarge(25, 0, 8.4)).toBeNull();
  });
});

describe('liquidPlan', () => {
  it('computes liquid, chemical amount and tank loads', () => {
    const p = liquidPlan(100, 10, 2, { tankL: 500, dilution: 1000 })!;
    expect(p.totalLiquidL).toBe(2000);
    expect(p.chemicalAmount).toBe(2000); // 2000L ÷ 1000倍 = 2L = 2000mL
    expect(p.areaPerTank10a).toBe(5);
    expect(p.tankLoads).toBe(4);
  });

  it('rejects non-positive inputs', () => {
    expect(liquidPlan(0, 10, 1)).toBeNull();
    expect(liquidPlan(100, 0, 1)).toBeNull();
  });
});

describe('method lookups', () => {
  it('lists methods per stage and per crop', () => {
    const crop = getCrop('rice')!;
    expect(methodsForStage(crop.stages[0]).map((m) => m.id)).toContain('low-volume');
    expect(methodsForCropId('apple').map((m) => m.id)).toContain('orchard-airblast');
    expect(methodsForCropId('apple').map((m) => m.id)).not.toContain('boom-broadcast');
  });
});
