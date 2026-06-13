/**
 * 機械設定（散布幅・走行速度・圃場係数）の localStorage 永続化。
 * 圃場ごとに変わる R/Q は保存せず、機械側の設定だけ次回に引き継ぐ。
 */

const KEY = 'spray_calc.machine_setup.v1';

export interface MachineSetup {
  W?: number;
  V?: number;
  F?: number;
}

export function loadMachineSetup(): MachineSetup {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as MachineSetup;
    return {};
  } catch {
    return {};
  }
}

export function saveMachineSetup(setup: MachineSetup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(setup));
  } catch {
    /* プライベートモード等で localStorage 不可なら何もしない */
  }
}

export function clearMachineSetup(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
