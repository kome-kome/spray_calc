import { useMemo, useState } from 'react';
import {
  BALANCE_FIELDS,
  solveBalance,
  type BalanceFields,
  type BalanceKey,
  type SolveFailure,
} from '../lib/sprayMath';
import { encodeBalance } from '../lib/urlState';
import { trackEvent } from '../lib/analytics';
import { NumberField } from './NumberField';

interface Props {
  fields: BalanceFields;
  onChange: (fields: BalanceFields) => void;
}

const FAILURE_MESSAGE: Record<SolveFailure, string> = {
  too_few_blanks: '計算したい項目を1つだけ空けてください。',
  too_many_blanks: '空欄は1つだけにしてください（残り4項目を入力）。',
  invalid_inputs: '入力は 0 より大きい数値にしてください。',
};

function meta(key: BalanceKey) {
  return BALANCE_FIELDS.find((f) => f.key === key)!;
}

/** 小数第1位までに丸めて余分な 0 を落とす。 */
function format(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* クリップボード不可は無視 */
  }
}

export function BalanceCalculator({ fields, onChange }: Props) {
  const [copied, setCopied] = useState<'result' | 'url' | null>(null);

  const result = useMemo(() => solveBalance(fields), [fields]);

  const setField = (key: BalanceKey, value: number | null) => {
    onChange({ ...fields, [key]: value });
  };

  const resultText = result.ok
    ? `${meta(result.key).label}は ${format(result.value)} ${meta(result.key).unit}`.trim()
    : '';

  const flash = (which: 'result' | 'url') => {
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyResult = async () => {
    if (!result.ok) return;
    await copyText(resultText);
    trackEvent('copy_result', { key: result.key });
    flash('result');
  };

  const handleShareUrl = async () => {
    const qs = encodeBalance(fields);
    const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    await copyText(url);
    trackEvent('share_url');
    flash('url');
  };

  const handleReset = () => {
    onChange({ R: null, W: null, V: null, Q: null, F: 1 });
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <section className="panel" aria-labelledby="balance-heading">
      <h2 id="balance-heading">バランス計算</h2>
      <p className="panel__lead">
        計算したい1項目を空欄にして、残り4項目を入力してください。入力すると自動で計算します。
      </p>

      <div className="formula">
        Q（総吐出量）= R（反当散布量）× W（散布幅）× V（走行速度）× F（圃場係数）÷ 60
      </div>

      <div className="fields">
        {BALANCE_FIELDS.map((f) => {
          const solvedHere = result.ok && result.key === f.key;
          return (
            <NumberField
              key={f.key}
              id={`balance-${f.key}`}
              label={f.label}
              unit={f.unit}
              hint={f.key === 'F' ? f.hint : undefined}
              value={fields[f.key]}
              onChange={(v) => setField(f.key, v)}
              highlight={solvedHere}
              placeholder={solvedHere ? format(result.value) : undefined}
            />
          );
        })}
      </div>

      <div className="result" aria-live="polite">
        {result.ok ? (
          <p className="result__ok">
            <span className="result__label">結果</span>
            <strong>{resultText}</strong>
          </p>
        ) : (
          <p className="result__hint">{FAILURE_MESSAGE[result.reason]}</p>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleCopyResult}
          disabled={!result.ok}
        >
          {copied === 'result' ? 'コピーしました' : '結果をコピー'}
        </button>
        <button type="button" className="btn" onClick={handleShareUrl}>
          {copied === 'url' ? 'URLをコピーしました' : 'URLで共有'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleReset}>
          リセット
        </button>
      </div>
    </section>
  );
}
