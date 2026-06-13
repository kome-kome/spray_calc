import type { Nozzle, Sprayer } from '../data/types';
import { pressureForFlow, round1 } from './sprayMath';

/**
 * 必要吐出量ベースの簡易提案ロジック。
 * 必要ノズル総吐出量[L/min] から、適合する散布機・ノズルを並べ替えて返す。
 */

export interface SprayerMatch {
  sprayer: Sprayer;
  /** 定格吐出量が必要量以上か。 */
  capable: boolean;
  /** requiredQ / 定格吐出量（1.0 以下かつ 1.0 に近いほど無駄が少ない）。 */
  ratioToRated: number;
}

export function recommendSprayers(requiredQLmin: number, sprayers: Sprayer[]): SprayerMatch[] {
  const matches = sprayers
    .filter((s) => (s.ratedTotalDischargeLmin ?? 0) > 0)
    .map((s) => {
      const rated = s.ratedTotalDischargeLmin as number;
      return { sprayer: s, capable: rated >= requiredQLmin, ratioToRated: requiredQLmin / rated };
    });

  // 能力を満たす機を優先。満たす中では定格が必要量に近い順（ratio が大きい順）、
  // 満たさない中では定格が大きい＝必要量に近い順（ratio が小さい順）。
  return matches.sort((a, b) => {
    if (a.capable !== b.capable) return a.capable ? -1 : 1;
    return a.capable ? b.ratioToRated - a.ratioToRated : a.ratioToRated - b.ratioToRated;
  });
}

export interface NozzleMatch {
  nozzle: Nozzle;
  /** 1本あたりに必要な流量[L/min]。 */
  perNozzleFlowLmin: number;
  /** その流量を出すのに必要な運転圧力[MPa]。 */
  pressureMPa: number;
  /** 想定圧力範囲内か。 */
  inRange: boolean;
}

export interface NozzleRecommendOptions {
  minPressureMPa?: number;
  maxPressureMPa?: number;
  /** 並べ替えの基準となる「狙いどころ」圧力[MPa]。 */
  sweetSpotMPa?: number;
}

export function recommendNozzles(
  requiredQLmin: number,
  nozzleCount: number,
  nozzles: Nozzle[],
  opts: NozzleRecommendOptions = {},
): NozzleMatch[] {
  const { minPressureMPa = 0.1, maxPressureMPa = 1.0, sweetSpotMPa = 0.3 } = opts;
  if (!(requiredQLmin > 0) || !(nozzleCount > 0)) return [];

  const perNozzle = requiredQLmin / nozzleCount;
  const matches = nozzles.map((n) => {
    const pressureMPa = pressureForFlow(n.ratedFlowLmin, n.ratedPressureMPa, perNozzle);
    const inRange =
      Number.isFinite(pressureMPa) && pressureMPa >= minPressureMPa && pressureMPa <= maxPressureMPa;
    return { nozzle: n, perNozzleFlowLmin: round1(perNozzle), pressureMPa, inRange };
  });

  // 圧力範囲内を優先し、狙いどころ圧力に近い順。
  return matches.sort((a, b) => {
    if (a.inRange !== b.inRange) return a.inRange ? -1 : 1;
    return Math.abs(a.pressureMPa - sweetSpotMPa) - Math.abs(b.pressureMPa - sweetSpotMPa);
  });
}
