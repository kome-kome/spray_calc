import { useMemo, useState } from 'react';
import { CROP_PRESETS, getCrop, getStage, SPRAY_VOLUME_DISCLAIMER } from '../data/crops';
import { NOZZLES } from '../data/nozzles';
import { MACHINES } from '../data/machines';
import { WIDTH_BASIS_LABELS } from '../data/sprayMethods';
import { findCompatibility } from '../data/compatibility';
import {
  CROP_CATEGORY_LABELS,
  CROP_CATEGORY_ORDER,
  MACHINE_CATEGORY_LABELS,
  type CropCategory,
  type NozzleType,
} from '../data/types';
import { dischargeFromPlan, round1 } from '../lib/sprayMath';
import { recommendMachines, recommendNozzles } from '../lib/recommend';
import { isPumpCapacityBased } from '../lib/selection';
import {
  liquidPlan,
  machinesForPlan,
  methodsForStage,
  nozzleCriteria,
  planDefaults,
  requiredDischargeRange,
  resolvePlan,
  speedForDischarge,
  validatePlan,
  volumeSpanLabel,
} from '../lib/cropPlan';
import { NumberField } from './NumberField';
import { MakerLinks } from './MakerLinks';
import { ProvenanceBadge } from './ProvenanceBadge';

const NOZZLE_TYPE_LABELS: Record<NozzleType, string> = {
  'flat-fan': '平板扇形',
  'hollow-cone': '中空円錐',
  'full-cone': '充円錐',
  other: 'その他',
};

const NOZZLE_LABEL = new Map(NOZZLES.map((n) => [n.id, n.model]));

/**
 * 作物 → 生育ステージ → 散布方法 の順に場面を決め、その前提で必要吐出量・
 * 適合機種・ノズル設定を提案する。散布量・速度・散布幅の既定値と目安レンジは
 * 選んだ場面から入り、レンジを外れた入力には警告を出す。
 */
export function Recommendation() {
  const [category, setCategory] = useState<'all' | CropCategory>('all');
  const [cropId, setCropId] = useState('');
  const [stageId, setStageId] = useState('');
  const [methodId, setMethodId] = useState('');

  const [R, setR] = useState<number | null>(null);
  const [W, setW] = useState<number | null>(null);
  const [V, setV] = useState<number | null>(null);
  const [F, setF] = useState<number | null>(1);
  const [count, setCount] = useState<number | null>(20);
  const [area, setArea] = useState<number | null>(null);
  const [times, setTimes] = useState<number | null>(1);
  const [dilution, setDilution] = useState<number | null>(1000);

  const crop = useMemo(() => (cropId ? getCrop(cropId) : undefined), [cropId]);
  const stage = useMemo(() => (crop && stageId ? getStage(crop, stageId) : undefined), [crop, stageId]);
  const stageMethods = useMemo(
    () => (stage ? methodsForStage(stage) : []),
    [stage],
  );
  const plan = useMemo(
    () => (cropId && stageId && methodId ? resolvePlan(cropId, stageId, methodId) : null),
    [cropId, stageId, methodId],
  );

  const cropOptions = useMemo(
    () => (category === 'all' ? CROP_PRESETS : CROP_PRESETS.filter((c) => c.category === category)),
    [category],
  );

  /** 場面が変わったら散布量・速度・散布幅の既定値を入れ直す。 */
  const applySelection = (nextCropId: string, nextStageId: string, nextMethodId: string) => {
    setCropId(nextCropId);
    setStageId(nextStageId);
    setMethodId(nextMethodId);
    const ctx = resolvePlan(nextCropId, nextStageId, nextMethodId);
    if (!ctx) return;
    const d = planDefaults(ctx);
    setR(d.R);
    setV(d.V);
    if (d.W != null) setW(d.W);
  };

  const handleCrop = (id: string) => {
    const next = id ? getCrop(id) : undefined;
    if (!next) {
      setCropId('');
      setStageId('');
      setMethodId('');
      return;
    }
    const firstStage = next.stages[0];
    applySelection(next.id, firstStage.id, firstStage.methods[0].sprayMethodId);
  };

  const handleStage = (id: string) => {
    if (!crop) return;
    const next = getStage(crop, id);
    if (!next) return;
    const keep = next.methods.some((m) => m.sprayMethodId === methodId);
    applySelection(crop.id, id, keep ? methodId : next.methods[0].sprayMethodId);
  };

  const requiredQ = useMemo(() => {
    if ([R, W, V, F].some((x) => x == null || !(x > 0))) return NaN;
    return dischargeFromPlan(R as number, W as number, V as number, F as number);
  }, [R, W, V, F]);
  const ok = Number.isFinite(requiredQ);

  const qRange = useMemo(
    () => (plan && W != null && V != null && F != null ? requiredDischargeRange(plan, W, V, F) : null),
    [plan, W, V, F],
  );

  const issues = useMemo(() => (plan ? validatePlan(plan, { R, W, V }) : []), [plan, R, W, V]);

  const machinePool = useMemo(() => (plan ? machinesForPlan(plan, MACHINES) : MACHINES), [plan]);
  const machineMatches = useMemo(
    () => (ok ? recommendMachines(requiredQ, machinePool) : []),
    [ok, requiredQ, machinePool],
  );

  const criteria = useMemo(
    () =>
      plan
        ? nozzleCriteria(plan.method)
        : { nozzleTypes: ['flat-fan' as NozzleType], minPressureMPa: 0.1, maxPressureMPa: 1.0, sweetSpotMPa: 0.3 },
    [plan],
  );
  const nozzlePoolSize = useMemo(
    () => NOZZLES.filter((n) => criteria.nozzleTypes.includes(n.type)).length,
    [criteria],
  );
  const nozzleMatches = useMemo(
    () => (ok && count ? recommendNozzles(requiredQ, count, NOZZLES, criteria) : []),
    [ok, requiredQ, count, criteria],
  );

  const liquid = useMemo(
    () => (R != null && area != null && times != null ? liquidPlan(R, area, times, { dilution }) : null),
    [R, area, times, dilution],
  );

  const volumeHint = plan
    ? `目安 ${plan.volumeLper10a.min}〜${plan.volumeLper10a.max}（標準 ${plan.volumeLper10a.typical}）`
    : '作物と場面を選ぶと目安が入ります';
  const widthHint = plan ? WIDTH_BASIS_LABELS[plan.method.widthBasis] : '1行程で散布する幅';
  const speedHint = plan
    ? `目安 ${plan.method.speedKmh[0]}〜${plan.method.speedKmh[1]} km/h`
    : '散布時の走行速度';

  return (
    <section className="panel" aria-labelledby="recommend-heading">
      <h2 id="recommend-heading">機器・ノズル提案</h2>
      <p className="panel__lead">
        作物・生育ステージ・散布方法から散布条件を決め、必要吐出量とやまびこ(共立)の適合機種・ノズル設定を提案します。
        散布量は同じ作物でもステージと散布方法で数倍変わるため、場面ごとの目安レンジで確認します。
      </p>

      <h3 className="section-title">1. 散布する場面</h3>
      <div className="category-filter" role="group" aria-label="作物カテゴリ">
        <button
          type="button"
          className={`chip ${category === 'all' ? 'is-active' : ''}`}
          onClick={() => setCategory('all')}
        >
          すべて
        </button>
        {CROP_CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${category === c ? 'is-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {CROP_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

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
            {cropOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（{volumeSpanLabel(c)}）
              </option>
            ))}
          </select>
          <span className="number-field__hint">
            {crop ? CROP_CATEGORY_LABELS[crop.category] : '品目を選ぶと場面と目安が絞り込まれます'}
          </span>
        </div>

        <div className="number-field">
          <label htmlFor="stage-select" className="number-field__label">
            生育ステージ
          </label>
          <select
            id="stage-select"
            className="number-field__input"
            value={stageId}
            onChange={(e) => handleStage(e.target.value)}
            disabled={!crop}
          >
            {crop ? (
              crop.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            ) : (
              <option value="">作物を選択してください</option>
            )}
          </select>
          <span className="number-field__hint">{stage?.description ?? '防除の場面を選びます'}</span>
        </div>

        <div className="number-field">
          <label htmlFor="method-select" className="number-field__label">
            散布方法
          </label>
          <select
            id="method-select"
            className="number-field__input"
            value={methodId}
            onChange={(e) => applySelection(cropId, stageId, e.target.value)}
            disabled={stageMethods.length === 0}
          >
            {stageMethods.length > 0 ? (
              stageMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            ) : (
              <option value="">作物を選択してください</option>
            )}
          </select>
          <span className="number-field__hint">{plan?.method.description ?? 'このステージで一般的な方法'}</span>
        </div>
      </div>

      {plan?.note ? <p className="plan-note">{plan.note}</p> : null}

      <h3 className="section-title">2. 散布条件</h3>
      <div className="fields">
        <NumberField id="rec-R" label="反当散布量" unit="L/10a" value={R} onChange={setR} hint={volumeHint} />
        <NumberField id="rec-W" label="散布幅" unit="m" value={W} onChange={setW} hint={widthHint} />
        <NumberField id="rec-V" label="走行速度" unit="km/h" value={V} onChange={setV} hint={speedHint} />
        <NumberField id="rec-F" label="圃場係数" value={F} onChange={setF} hint="通常は 1.0" />
        <NumberField id="rec-count" label="ノズル本数" unit="本" value={count} onChange={setCount} step={1} />
        <NumberField id="rec-area" label="圃場面積" unit="10a" value={area} onChange={setArea} hint="1ha = 10（10a単位）" />
        <NumberField id="rec-times" label="散布回数" unit="回" value={times} onChange={setTimes} step={1} />
        <NumberField id="rec-dilution" label="希釈倍数" unit="倍" value={dilution} onChange={setDilution} step={100} hint="農薬ラベルの倍数" />
      </div>

      <div className="result" aria-live="polite">
        {ok ? (
          <p className="result__ok">
            <span className="result__label">必要なノズル総吐出量</span>
            <strong>{round1(requiredQ)} L/min</strong>
            {qRange ? (
              <span className="result__sub">
                ／ この場面の目安 {round1(qRange.min)}〜{round1(qRange.max)} L/min
              </span>
            ) : null}
          </p>
        ) : (
          <p className="result__hint">反当散布量・散布幅・走行速度・圃場係数を入力してください。</p>
        )}
        {liquid ? (
          <p className="result__ok">
            <span className="result__label">総使用薬液量</span>
            <strong>約 {round1(liquid.totalLiquidL)} L</strong>
            {liquid.chemicalAmount != null ? (
              <span className="result__sub">
                ／ 薬剤 約 {round1(liquid.chemicalAmount)} mL(g)（{dilution}倍）
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {issues.length > 0 ? (
        <ul className="notice-list">
          {issues.map((i) => (
            <li key={`${i.field}-${i.message}`} className={`notice notice--${i.level}`}>
              {i.message}
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="section-title">
        3. 適合する機種
        {plan ? `（${plan.crop.name}・${plan.method.name}に使える機種）` : '（作物未選択のため全機種）'}
      </h3>
      {ok ? (
        machineMatches.length > 0 ? (
          <ul className="rec-list">
            {machineMatches.map((m) => {
              const compat = plan
                ? findCompatibility(m.machine.id, plan.crop.id, plan.method.id, plan.stage.id)
                : undefined;
              const loads =
                R != null && area != null && times != null && m.machine.tankL
                  ? liquidPlan(R, area, times, { tankL: m.machine.tankL })
                  : null;
              return (
                <li key={m.machine.id} className={`rec-item ${m.capable ? '' : 'rec-item--warn'}`}>
                  <div className="rec-item__head">
                    <a href={m.machine.productUrl} target="_blank" rel="noopener noreferrer">
                      {m.machine.maker} {m.machine.model}
                    </a>
                    <ProvenanceBadge
                      verified={m.machine.source.verified}
                      provenance={m.machine.source.provenance}
                    />
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
                  {!m.capable && R != null && W != null ? (
                    <div className="rec-item__body rec-item__advice">
                      {(() => {
                        const v = speedForDischarge(m.usableLmin, R, W, F ?? 1);
                        return v == null
                          ? null
                          : `${round1(R)} L/10a を撒くには 約 ${round1(v)} km/h まで減速するか、散布量を下げる必要があります。`;
                      })()}
                    </div>
                  ) : null}
                  {loads?.tankLoads != null ? (
                    <div className="rec-item__body">
                      タンク1杯で約 {round1(loads.areaPerTank10a as number)} 反ぶん／全体で {loads.tankLoads} 杯
                    </div>
                  ) : null}
                  {compat ? (
                    <div className="rec-item__body">
                      推奨ノズル:{' '}
                      {compat.recommendedNozzleIds.length > 0
                        ? compat.recommendedNozzleIds.map((id) => NOZZLE_LABEL.get(id) ?? id).join('・')
                        : '要確認'}
                      ／圧力 {compat.pressureMPa[0]}〜{compat.pressureMPa[1]} MPa
                      {compat.note ? `／${compat.note}` : ''}
                      <ProvenanceBadge verified={compat.source.verified} provenance={compat.source.provenance} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="result__hint">
            この作物・散布方法に該当する機種データがありません（順次拡充）。
          </p>
        )
      ) : (
        <p className="result__hint">条件を入力すると適合機種を表示します。</p>
      )}

      <h3 className="section-title">
        4. 適合するノズル（{criteria.nozzleTypes.map((t) => NOZZLE_TYPE_LABELS[t]).join('・')}・1本 約{' '}
        {ok && count ? round1(requiredQ / count) : 0} L/min）
      </h3>
      {nozzlePoolSize === 0 ? (
        <p className="result__hint">
          {plan?.method.name ?? 'この散布方法'}に使うノズル（
          {criteria.nozzleTypes.map((t) => NOZZLE_TYPE_LABELS[t]).join('・')}
          ）のデータは未収録です。機器の取扱説明書・メーカの噴口一覧で確認してください。
        </p>
      ) : (
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
                運転圧力 約 {round1(m.pressureMPa)} MPa
                {m.inRange
                  ? ''
                  : `（範囲外: ${criteria.minPressureMPa}〜${criteria.maxPressureMPa}MPa）`}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="disclaimer">{SPRAY_VOLUME_DISCLAIMER}</p>
      <MakerLinks />
    </section>
  );
}
