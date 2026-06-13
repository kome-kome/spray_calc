import { useMemo, useState } from 'react';
import { NOZZLES } from '../data/nozzles';
import { nozzleFlowAtPressure, totalNozzleDischarge, round1 } from '../lib/sprayMath';
import { trackEvent } from '../lib/analytics';
import { NumberField } from './NumberField';
import { MakerLinks } from './MakerLinks';
import { ProvenanceBadge } from './ProvenanceBadge';

interface Props {
  onApplyQ: (q: number) => void;
}

/** ノズル設定（モデル／圧力／本数）から総吐出量 Q を求める。 */
export function NozzleDischargeCalc({ onApplyQ }: Props) {
  const [nozzleId, setNozzleId] = useState<string>(NOZZLES[0]?.id ?? 'custom');
  const [pressure, setPressure] = useState<number | null>(0.3);
  const [count, setCount] = useState<number | null>(20);
  const [customFlow, setCustomFlow] = useState<number | null>(1.0);
  const [customRatedP, setCustomRatedP] = useState<number | null>(0.3);

  const isCustom = nozzleId === 'custom';
  const nozzle = NOZZLES.find((n) => n.id === nozzleId);

  const ratedFlow = isCustom ? customFlow : nozzle?.ratedFlowLmin ?? null;
  const ratedP = isCustom ? customRatedP : nozzle?.ratedPressureMPa ?? null;

  const perNozzle = useMemo(() => {
    if (ratedFlow == null || ratedP == null || pressure == null) return NaN;
    return nozzleFlowAtPressure(ratedFlow, ratedP, pressure);
  }, [ratedFlow, ratedP, pressure]);

  const totalQ = useMemo(() => {
    if (!Number.isFinite(perNozzle) || count == null || count <= 0) return NaN;
    return totalNozzleDischarge(perNozzle, count);
  }, [perNozzle, count]);

  const ok = Number.isFinite(totalQ);

  return (
    <section className="panel" aria-labelledby="nozzle-heading">
      <h2 id="nozzle-heading">ノズル設定から総吐出量を計算</h2>
      <p className="panel__lead">
        ノズルと運転圧力・本数から、ノズル総吐出量 Q を求めます。流量は圧力の平方根に比例します（q ∝ √P）。
      </p>

      <div className="fields">
        <div className="number-field">
          <label htmlFor="nozzle-select" className="number-field__label">
            ノズル
          </label>
          <select
            id="nozzle-select"
            className="number-field__input"
            value={nozzleId}
            onChange={(e) => setNozzleId(e.target.value)}
          >
            {NOZZLES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.maker}／{n.model}（{round1(n.ratedFlowLmin)}L/min @ {n.ratedPressureMPa}MPa）
              </option>
            ))}
            <option value="custom">手入力（定格流量・圧力を指定）</option>
          </select>
          {nozzle ? (
            <p className="number-field__hint">
              {nozzle.colorHex ? (
                <span className="nozzle-swatch" style={{ background: nozzle.colorHex }} aria-hidden />
              ) : null}
              {nozzle.colorName ? `ISO色: ${nozzle.colorName}・` : ''}
              <ProvenanceBadge verified={nozzle.source.verified} provenance={nozzle.source.provenance} />
            </p>
          ) : null}
        </div>

        {isCustom ? (
          <>
            <NumberField
              id="nozzle-rated-flow"
              label="定格吐出量"
              unit="L/min"
              value={customFlow}
              onChange={setCustomFlow}
            />
            <NumberField
              id="nozzle-rated-pressure"
              label="定格圧力"
              unit="MPa"
              value={customRatedP}
              onChange={setCustomRatedP}
            />
          </>
        ) : null}

        <NumberField
          id="nozzle-pressure"
          label="運転圧力"
          unit="MPa"
          value={pressure}
          onChange={setPressure}
          hint="現場で設定する圧力"
        />
        <NumberField
          id="nozzle-count"
          label="ノズル本数"
          unit="本"
          value={count}
          onChange={setCount}
          step={1}
        />
      </div>

      <div className="result" aria-live="polite">
        {ok ? (
          <p className="result__ok">
            <span className="result__label">ノズル総吐出量</span>
            <strong>{round1(totalQ)} L/min</strong>
            <span className="result__sub">
              （1本あたり {round1(perNozzle)} L/min ×{count}本）
            </span>
          </p>
        ) : (
          <p className="result__hint">ノズル・運転圧力・本数を入力してください。</p>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!ok}
          onClick={() => {
            onApplyQ(round1(totalQ));
            trackEvent('apply_nozzle_q', { nozzle: nozzleId });
          }}
        >
          この総吐出量をバランス計算へ反映
        </button>
      </div>

      <MakerLinks kind="nozzle" />
    </section>
  );
}
