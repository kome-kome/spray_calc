import type { Machine } from '../data/types';

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

// 作物・散布方法にひもづく絞り込みは lib/cropPlan.ts（machinesForPlan / methodsForCropId）。
