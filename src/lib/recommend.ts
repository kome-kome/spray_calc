import type { Machine, Nozzle, NozzleType } from '../data/types';
import { pressureForFlow, round1 } from './sprayMath';
import { usableDischargeLmin } from './selection';

/**
 * 必要吐出量ベースの簡易提案ロジック。
 * 必要ノズル総吐出量[L/min] から、適合する機種・ノズルを並べ替えて返す。
 */

export interface MachineMatch {
  machine: Machine;
  /** 実用吐出量[L/min]（動噴・SSV は吸水量×0.8）。 */
  usableLmin: number;
  /** 実用吐出量が必要量以上か。 */
  capable: boolean;
  /** requiredQ / usable（1.0 以下かつ 1.0 に近いほど無駄が少ない）。 */
  ratio: number;
}

export function recommendMachines(requiredQLmin: number, machines: Machine[]): MachineMatch[] {
  const matches: MachineMatch[] = [];
  for (const machine of machines) {
    const usable = usableDischargeLmin(machine);
    if (usable == null) continue;
    matches.push({
      machine,
      usableLmin: usable,
      capable: usable >= requiredQLmin,
      ratio: requiredQLmin / usable,
    });
  }
  // 能力を満たす機を優先。満たす中では実用吐出量が必要量に近い順（ratio 大）、
  // 満たさない中では実用吐出量が大きい＝必要量に近い順（ratio 小）。
  return matches.sort((a, b) => {
    if (a.capable !== b.capable) return a.capable ? -1 : 1;
    return a.capable ? b.ratio - a.ratio : a.ratio - b.ratio;
  });
}

export interface NozzleMatch {
  nozzle: Nozzle;
  perNozzleFlowLmin: number;
  pressureMPa: number;
  inRange: boolean;
}

export interface NozzleRecommendOptions {
  minPressureMPa?: number;
  maxPressureMPa?: number;
  sweetSpotMPa?: number;
  /** 指定があればこのノズル種別だけに絞る。 */
  nozzleTypes?: NozzleType[];
}

export function recommendNozzles(
  requiredQLmin: number,
  nozzleCount: number,
  nozzles: Nozzle[],
  opts: NozzleRecommendOptions = {},
): NozzleMatch[] {
  const { minPressureMPa = 0.1, maxPressureMPa = 1.0, sweetSpotMPa = 0.3, nozzleTypes } = opts;
  if (!(requiredQLmin > 0) || !(nozzleCount > 0)) return [];

  const pool =
    nozzleTypes && nozzleTypes.length > 0
      ? nozzles.filter((n) => nozzleTypes.includes(n.type))
      : nozzles;

  const perNozzle = requiredQLmin / nozzleCount;
  const matches = pool.map((n) => {
    const pressureMPa = pressureForFlow(n.ratedFlowLmin, n.ratedPressureMPa, perNozzle);
    const inRange =
      Number.isFinite(pressureMPa) && pressureMPa >= minPressureMPa && pressureMPa <= maxPressureMPa;
    return { nozzle: n, perNozzleFlowLmin: round1(perNozzle), pressureMPa, inRange };
  });

  return matches.sort((a, b) => {
    if (a.inRange !== b.inRange) return a.inRange ? -1 : 1;
    return Math.abs(a.pressureMPa - sweetSpotMPa) - Math.abs(b.pressureMPa - sweetSpotMPa);
  });
}
