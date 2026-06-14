import type { Machine } from '../data/types';
import { SPRAY_METHODS, type SprayMethod } from '../data/sprayMethods';

/** 吸水量に対する実用吐出量の係数（吸水量＝上限、実用はその約8割）。 */
export const PUMP_USABLE_RATIO = 0.8;

/**
 * 実用上の総吐出量[L/min]。
 * - ブーム等: 公表のノズル総吐出量をそのまま採用。
 * - 動噴・SSV: 吸水量/ポンプ吐出量 × PUMP_USABLE_RATIO(0.8)。
 * いずれも不明なら null。
 */
export function usableDischargeLmin(m: Machine, ratio = PUMP_USABLE_RATIO): number | null {
  if (m.ratedTotalDischargeLmin != null && m.ratedTotalDischargeLmin > 0) {
    return m.ratedTotalDischargeLmin;
  }
  if (m.pumpCapacityLmin != null && m.pumpCapacityLmin > 0) {
    return m.pumpCapacityLmin * ratio;
  }
  return null;
}

/** 実用吐出量がポンプ吸水量ベース（×0.8）かどうか。表示の出し分けに使う。 */
export function isPumpCapacityBased(m: Machine): boolean {
  const hasRated = m.ratedTotalDischargeLmin != null && m.ratedTotalDischargeLmin > 0;
  return !hasRated && m.pumpCapacityLmin != null && m.pumpCapacityLmin > 0;
}

/** 指定作物で一般的な散布方法。 */
export function methodsForCrop(cropId: string): SprayMethod[] {
  return SPRAY_METHODS.filter((m) => m.cropIds.includes(cropId));
}

/** 指定作物に適用できる機種。 */
export function machinesForCrop(cropId: string, machines: Machine[]): Machine[] {
  return machines.filter((m) => m.applicableCropIds.includes(cropId));
}
