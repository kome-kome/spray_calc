import { useMemo, useState } from 'react';
import { CROP_PRESETS, SPRAY_VOLUME_DISCLAIMER } from '../data/crops';
import { NOZZLES } from '../data/nozzles';
import { MACHINES } from '../data/machines';
import { SPRAY_METHODS } from '../data/sprayMethods';
import { COMPATIBILITY } from '../data/compatibility';
import { MACHINE_CATEGORY_LABELS, type MachineCategory, type NozzleType } from '../data/types';
import { dischargeFromPlan, round1 } from '../lib/sprayMath';
import { recommendMachines, recommendNozzles } from '../lib/recommend';
import { isPumpCapacityBased, methodsForCrop } from '../lib/selection';
import { NumberField } from './NumberField';
import { MakerLinks } from './MakerLinks';
import { ProvenanceBadge } from './ProvenanceBadge';

const CATEGORY_ORDER: MachineCategory[] = ['boom', 'speed', 'power-rc', 'power-set', 'riding'];

const NOZZLE_TYPE_LABELS: Record<NozzleType, string> = {
  'flat-fan': '平板扇形',
  'hollow-cone': '中空円錐',
  'full-cone': '充円錐',
  other: 'その他',
};

const CROP_NAME = new Map(CROP_PRESETS.map((c) => [c.id, c.name]));
const MACHINE_NAME = new Map(MACHINES.map((m) => [m.id, `${m.maker} ${m.model}`]));
const NOZZLE_LABEL = new Map(NOZZLES.map((n) => [n.id, n.model]));
const METHOD_NAME = new Map(SPRAY_METHODS.map((s) => [s.id, s.name]));

/** 作物・散布条件から必要総吐出量を求め、やまびこ適合機・ノズルを提案する。 */
export function Recommendation() {
  const [cropId, setCropId] = useState('');
  const [R, setR] = useState<number | null>(null);
  const [W, setW] = useState<number | null>(null);
  const [V, setV] = useState<number | null>(null);
  const [F, setF] = useState<number | null>(1);
  const [count, setCount] = useState<number | null>(20);
  const [area, setArea] = useState<number | null>(null);
  const [times, setTimes] = useState<number | null>(1);
  const [category, setCategory] = useState<'all' | MachineCategory>('all');

  const requiredQ = useMemo(() => {
    if ([R, W, V, F].some((x) => x == null || !(x > 0))) return NaN;
    return dischargeFromPlan(R as number, W as number, V as number, F as number);
  }, [R, W, V, F]);
  const ok = Number.isFinite(requiredQ);

  const filteredMachines = useMemo(
    () => (category === 'all' ? MACHINES : MACHINES.filter((m) => m.category === category)),
    [category],
  );
  const machineMatches = useMemo(
    () => (ok ? recommendMachines(requiredQ, filteredMachines) : []),
    [ok, requiredQ, filteredMachines],
  );
  const nozzleMatches = useMemo(
    () => (ok && count ? recommendNozzles(requiredQ, count, NOZZLES, { nozzleTypes: ['flat-fan'] }) : []),
    [ok, requiredQ, count],
  );
  const methods = useMemo(() => (cropId ? methodsForCrop(cropId) : []), [cropId]);
  const cropCompat = useMemo(() => (cropId ? COMPATIBILITY.filter((r) => r.cropId === cropId) : []), [cropId]);

  const totalLiquid = useMemo(() => {
    if (R == null || area == null || times == null) return NaN;
    return R * area * times;
  }, [R, area, times]);

  const handleCrop = (id: string) => {
    setCropId(id);
    const preset = CROP_PRESETS.find((c) => c.id === id);
    if (preset) setR(preset.standardR);
  };

  return (
    <section className="panel" aria-labelledby="recommend-heading">
      <h2 id="recommend-heading">機器・ノズルの提案</h2>
      <p className="panel__lead">
        作物・散布条件から必要吐出量を求め、やまびこ(共立)の適合機種とノズル設定を提案します。動噴・SSV
        は「吸水量×0.8」を実用吐出量として判定します。
      </p>

      <div className="fields">
        <div className="number-field">
          <label htmlFor="crop-select" className="number-field__label">
            作物
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
        <NumberField id="rec-area" label="圃場面積" unit="10a" value={area} onChange={setArea} hint="1ha = 10（10a単位）" />
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

      {methods.length > 0 ? (
        <>
          <h3 className="section-title">この作物の散布方法</h3>
          <ul className="method-list">
            {methods.map((m) => (
              <li key={m.id} className="method-item">
                <div className="method-item__name">{m.name}</div>
                <div className="method-item__meta">{m.description}</div>
                <div className="method-item__meta">
                  対応機種: {m.machineCategories.map((c) => MACHINE_CATEGORY_LABELS[c]).join('・')}／想定圧力{' '}
                  {m.typicalPressureMPa[0]}〜{m.typicalPressureMPa[1]} MPa
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {cropCompat.length > 0 ? (
        <>
          <h3 className="section-title">適合マトリクス（{CROP_NAME.get(cropId)}）</h3>
          <ul className="rec-list">
            {cropCompat.map((r) => (
              <li key={`${r.machineId}-${r.sprayMethodId}`} className="rec-item">
                <div className="rec-item__head">
                  <span>{MACHINE_NAME.get(r.machineId) ?? r.machineId}</span>
                  <ProvenanceBadge verified={r.source.verified} provenance={r.source.provenance} />
                </div>
                <div className="rec-item__body">
                  {METHOD_NAME.get(r.sprayMethodId) ?? r.sprayMethodId}／推奨ノズル:{' '}
                  {r.recommendedNozzleIds.length > 0
                    ? r.recommendedNozzleIds.map((id) => NOZZLE_LABEL.get(id) ?? id).join('・')
                    : '要確認'}
                  ／圧力 {r.pressureMPa[0]}〜{r.pressureMPa[1]} MPa
                  {r.note ? `／${r.note}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className="section-title">適合する機種</h3>
      <div className="category-filter" role="group" aria-label="機種カテゴリ">
        <button
          type="button"
          className={`chip ${category === 'all' ? 'is-active' : ''}`}
          onClick={() => setCategory('all')}
        >
          すべて
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${category === c ? 'is-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {MACHINE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      {ok ? (
        machineMatches.length > 0 ? (
          <ul className="rec-list">
            {machineMatches.map((m) => (
              <li key={m.machine.id} className={`rec-item ${m.capable ? '' : 'rec-item--warn'}`}>
                <div className="rec-item__head">
                  <a href={m.machine.productUrl} target="_blank" rel="noopener noreferrer">
                    {m.machine.maker} {m.machine.model}
                  </a>
                  <ProvenanceBadge verified={m.machine.source.verified} provenance={m.machine.source.provenance} />
                </div>
                <div className="rec-item__body">
                  <span className="rec-cat">{MACHINE_CATEGORY_LABELS[m.machine.category]}</span>　実用吐出量{' '}
                  {round1(m.usableLmin)} L/min
                  {isPumpCapacityBased(m.machine)
                    ? `（吸水量 ${m.machine.pumpCapacityLmin}×0.8）`
                    : '（ノズル総吐出量）'}
                  {m.machine.totalWidthM ? `・幅 ${m.machine.totalWidthM}m` : ''}
                  {m.machine.nozzleCount ? `・${m.machine.nozzleCount}本` : ''}
                  {m.machine.tankL ? `・タンク${m.machine.tankL}L` : ''}
                  {m.capable ? '' : '（吐出量不足の可能性）'}
                </div>
                <div className="rec-item__body">
                  適用作物: {m.machine.applicableCropIds.map((id) => CROP_NAME.get(id) ?? id).join('・')}／対応ノズル:{' '}
                  {m.machine.compatibleNozzleTypes.map((t) => NOZZLE_TYPE_LABELS[t]).join('・')}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="result__hint">このカテゴリに該当機種データがありません（順次拡充）。</p>
        )
      ) : (
        <p className="result__hint">条件を入力すると適合機種を表示します。</p>
      )}

      <h3 className="section-title">
        適合するノズル（ブーム用平板・1本 約 {ok && count ? round1(requiredQ / count) : 0} L/min）
      </h3>
      <ul className="rec-list">
        {nozzleMatches.slice(0, 6).map((m) => (
          <li key={m.nozzle.id} className={`rec-item ${m.inRange ? '' : 'rec-item--warn'}`}>
            <div className="rec-item__head">
              <span>
                {m.nozzle.colorHex ? (
                  <span className="nozzle-swatch" style={{ background: m.nozzle.colorHex }} aria-hidden />
                ) : null}
                {m.nozzle.maker} {m.nozzle.model}
              </span>
              <ProvenanceBadge verified={m.nozzle.source.verified} provenance={m.nozzle.source.provenance} />
            </div>
            <div className="rec-item__body">
              運転圧力 約 {round1(m.pressureMPa)} MPa{m.inRange ? '' : '（範囲外: 0.1〜1.0MPa）'}
            </div>
          </li>
        ))}
      </ul>

      <p className="disclaimer">{SPRAY_VOLUME_DISCLAIMER}</p>
      <MakerLinks />
    </section>
  );
}
