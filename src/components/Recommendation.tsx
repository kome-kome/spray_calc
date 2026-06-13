import { useMemo, useState } from 'react';
import { CROP_PRESETS, SPRAY_VOLUME_DISCLAIMER } from '../data/crops';
import { NOZZLES } from '../data/nozzles';
import { SPRAYERS } from '../data/sprayers';
import { dischargeFromPlan, round1 } from '../lib/sprayMath';
import { recommendNozzles, recommendSprayers } from '../lib/recommend';
import { NumberField } from './NumberField';
import { MakerLinks } from './MakerLinks';
import { ProvenanceBadge } from './ProvenanceBadge';

/** 作物・散布条件から必要総吐出量を求め、適合機・ノズルを提案する。 */
export function Recommendation() {
  const [cropId, setCropId] = useState('');
  const [R, setR] = useState<number | null>(null);
  const [W, setW] = useState<number | null>(null);
  const [V, setV] = useState<number | null>(null);
  const [F, setF] = useState<number | null>(1);
  const [count, setCount] = useState<number | null>(20);
  const [area, setArea] = useState<number | null>(null);
  const [times, setTimes] = useState<number | null>(1);

  const requiredQ = useMemo(() => {
    if ([R, W, V, F].some((x) => x == null || !(x > 0))) return NaN;
    return dischargeFromPlan(R as number, W as number, V as number, F as number);
  }, [R, W, V, F]);

  const ok = Number.isFinite(requiredQ);

  const sprayerMatches = useMemo(
    () => (ok ? recommendSprayers(requiredQ, SPRAYERS) : []),
    [ok, requiredQ],
  );
  const nozzleMatches = useMemo(
    () => (ok && count ? recommendNozzles(requiredQ, count, NOZZLES) : []),
    [ok, requiredQ, count],
  );

  const totalLiquid = useMemo(() => {
    if (R == null || area == null || times == null) return NaN;
    return R * area * times;
  }, [R, area, times]);

  const handleCrop = (id: string) => {
    setCropId(id);
    const preset = CROP_PRESETS.find((c) => c.id === id);
    if (preset) setR(preset.standardR);
  };

  const perNozzleTarget = ok && count ? round1(requiredQ / count) : 0;

  return (
    <section className="panel" aria-labelledby="recommend-heading">
      <h2 id="recommend-heading">機器・ノズルの提案</h2>
      <p className="panel__lead">
        作物・散布条件から必要なノズル総吐出量を求め、適合する散布機とノズル設定（圧力・本数）を提案します。
      </p>

      <div className="fields">
        <div className="number-field">
          <label htmlFor="crop-select" className="number-field__label">
            作物（任意）
          </label>
          <select
            id="crop-select"
            className="number-field__input"
            value={cropId}
            onChange={(e) => handleCrop(e.target.value)}
          >
            <option value="">選択しない</option>
            {CROP_PRESETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（目安 {c.standardR} L/10a）
              </option>
            ))}
          </select>
        </div>
        <NumberField id="rec-R" label="反当散布量" unit="L/10a" value={R} onChange={setR} />
        <NumberField id="rec-W" label="散布幅" unit="m" value={W} onChange={setW} />
        <NumberField id="rec-V" label="走行速度" unit="km/h" value={V} onChange={setV} />
        <NumberField id="rec-F" label="圃場係数" value={F} onChange={setF} hint="通常は 1.0" />
        <NumberField id="rec-count" label="ノズル本数" unit="本" value={count} onChange={setCount} step={1} />
        <NumberField
          id="rec-area"
          label="圃場面積"
          unit="10a"
          value={area}
          onChange={setArea}
          hint="1ha = 10（10a単位）"
        />
        <NumberField id="rec-times" label="散布回数" unit="回" value={times} onChange={setTimes} step={1} />
      </div>

      <div className="result" aria-live="polite">
        {ok ? (
          <p className="result__ok">
            <span className="result__label">必要なノズル総吐出量</span>
            <strong>{round1(requiredQ)} L/min</strong>
            {Number.isFinite(totalLiquid) ? (
              <span className="result__sub">／ 総使用薬液量 約 {round1(totalLiquid)} L</span>
            ) : null}
          </p>
        ) : (
          <p className="result__hint">反当散布量・散布幅・走行速度・圃場係数を入力してください。</p>
        )}
      </div>

      {ok ? (
        <div className="recommend-grid">
          <div className="recommend-col">
            <h3>適合する散布機</h3>
            <ul className="rec-list">
              {sprayerMatches.map((m) => (
                <li key={m.sprayer.id} className={`rec-item ${m.capable ? '' : 'rec-item--warn'}`}>
                  <div className="rec-item__head">
                    <a href={m.sprayer.productUrl} target="_blank" rel="noopener noreferrer">
                      {m.sprayer.maker} {m.sprayer.model}
                    </a>
                    <ProvenanceBadge
                      verified={m.sprayer.source.verified}
                      provenance={m.sprayer.source.provenance}
                    />
                  </div>
                  <div className="rec-item__body">
                    定格 {m.sprayer.ratedTotalDischargeLmin} L/min・幅 {m.sprayer.totalWidthM} m・
                    {m.sprayer.nozzleCount}本{m.capable ? '（能力内）' : '（吐出量不足の可能性）'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="recommend-col">
            <h3>適合するノズル（1本 約 {perNozzleTarget} L/min）</h3>
            <ul className="rec-list">
              {nozzleMatches.slice(0, 6).map((m) => (
                <li key={m.nozzle.id} className={`rec-item ${m.inRange ? '' : 'rec-item--warn'}`}>
                  <div className="rec-item__head">
                    <span>
                      {m.nozzle.colorHex ? (
                        <span
                          className="nozzle-swatch"
                          style={{ background: m.nozzle.colorHex }}
                          aria-hidden
                        />
                      ) : null}
                      {m.nozzle.maker} {m.nozzle.model}
                    </span>
                    <ProvenanceBadge
                      verified={m.nozzle.source.verified}
                      provenance={m.nozzle.source.provenance}
                    />
                  </div>
                  <div className="rec-item__body">
                    運転圧力 約 {round1(m.pressureMPa)} MPa
                    {m.inRange ? '' : '（範囲外: 0.1〜1.0MPa）'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <p className="disclaimer">{SPRAY_VOLUME_DISCLAIMER}</p>
      <MakerLinks kind="both" />
    </section>
  );
}
