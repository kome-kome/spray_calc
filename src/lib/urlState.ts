import type { BalanceFields, BalanceKey } from './sprayMath';

/** バランス計算の入力値を URL クエリと相互変換する（共有・再現用）。 */

const KEYS: BalanceKey[] = ['R', 'W', 'V', 'Q', 'F'];

/** 入力済み（有限数）のフィールドだけをクエリ文字列に符号化する。 */
export function encodeBalance(fields: BalanceFields): string {
  const params = new URLSearchParams();
  for (const k of KEYS) {
    const v = fields[k];
    if (v !== null && Number.isFinite(v)) params.set(k, String(v));
  }
  return params.toString();
}

/** クエリ文字列から有効な数値フィールドだけを復元する。 */
export function decodeBalance(search: string): Partial<Record<BalanceKey, number>> {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: Partial<Record<BalanceKey, number>> = {};
  for (const k of KEYS) {
    const raw = params.get(k);
    if (raw !== null && raw.trim() !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}
