import { useEffect, useState } from 'react';
import { BalanceCalculator } from './components/BalanceCalculator';
import { NozzleDischargeCalc } from './components/NozzleDischargeCalc';
import { Recommendation } from './components/Recommendation';
import { decodeBalance } from './lib/urlState';
import { loadMachineSetup, saveMachineSetup } from './lib/storage';
import type { BalanceFields } from './lib/sprayMath';

type Tab = 'balance' | 'nozzle' | 'recommend';

/** URL クエリ → localStorage の機械設定 → 既定値（F=1）の順で初期化。 */
function initBalance(): BalanceFields {
  const url = decodeBalance(window.location.search);
  const saved = loadMachineSetup();
  return {
    R: url.R ?? null,
    W: url.W ?? saved.W ?? null,
    V: url.V ?? saved.V ?? null,
    F: url.F ?? saved.F ?? 1,
    Q: url.Q ?? null,
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>('balance');
  const [balance, setBalance] = useState<BalanceFields>(initBalance);

  // 機械設定（W/V/F）だけを保存し、次回に引き継ぐ。
  useEffect(() => {
    saveMachineSetup({
      W: balance.W ?? undefined,
      V: balance.V ?? undefined,
      F: balance.F ?? undefined,
    });
  }, [balance.W, balance.V, balance.F]);

  const applyQ = (q: number) => {
    setBalance((b) => ({ ...b, Q: q }));
    setTab('balance');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'balance', label: 'バランス計算' },
    { id: 'nozzle', label: 'ノズルから計算' },
    { id: 'recommend', label: '機器・ノズル提案' },
  ];

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">散布計画 計算</h1>
        <p className="app__subtitle">スプレーヤの散布量シミュレータ</p>
      </header>

      <nav className="tabs" role="tablist" aria-label="計算メニュー">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app__main">
        {tab === 'balance' && <BalanceCalculator fields={balance} onChange={setBalance} />}
        {tab === 'nozzle' && <NozzleDischargeCalc onApplyQ={applyQ} />}
        {tab === 'recommend' && <Recommendation />}
      </main>

      <footer className="app__footer">
        <a href="https://www.yamabiko-corp.co.jp/kioritz" target="_blank" rel="noopener noreferrer">
          共立（やまびこ）公式サイト
        </a>
        <span className="app__note">本ツールの計算・提案は目安です。実際の散布は機器の取扱説明書・農薬ラベルに従ってください。</span>
      </footer>
    </div>
  );
}
