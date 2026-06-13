import { describe, it, expect } from 'vitest';
import { encodeBalance, decodeBalance } from './urlState';
import type { BalanceFields } from './sprayMath';

describe('urlState round-trip', () => {
  it('encodes only filled fields and decodes them back', () => {
    const fields: BalanceFields = { R: 100, W: 10, V: 3, F: 1, Q: null };
    const qs = encodeBalance(fields);
    expect(qs).not.toContain('Q=');
    expect(decodeBalance('?' + qs)).toEqual({ R: 100, W: 10, V: 3, F: 1 });
  });

  it('ignores empty and non-numeric params', () => {
    expect(decodeBalance('?R=abc&W=10&V=')).toEqual({ W: 10 });
  });

  it('accepts a search string without leading ?', () => {
    expect(decodeBalance('Q=50&F=1')).toEqual({ Q: 50, F: 1 });
  });
});
