import type { ChangeEvent } from 'react';

export interface NumberFieldProps {
  id: string;
  label: string;
  unit?: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  highlight?: boolean;
  invalid?: boolean;
  min?: number;
  step?: number | 'any';
}

/** ラベル・単位・ヒント付きの数値入力。空欄は null として扱う。 */
export function NumberField(props: NumberFieldProps) {
  const {
    id,
    label,
    unit,
    hint,
    value,
    onChange,
    placeholder,
    highlight,
    invalid,
    min = 0,
    step = 'any',
  } = props;

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const n = Number(raw);
    onChange(Number.isFinite(n) ? n : null);
  };

  const className = ['number-field', highlight ? 'is-highlight' : '', invalid ? 'is-invalid' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="number-field__label">
        {label}
        {unit ? <span className="number-field__unit">（{unit}）</span> : null}
      </label>
      <input
        id={id}
        className="number-field__input"
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={handle}
      />
      {hint ? <p className="number-field__hint">{hint}</p> : null}
    </div>
  );
}
