// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App smoke', () => {
  it('renders the title and tabs', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: '散布計画 計算' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'バランス計算' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '機器・ノズル提案' })).toBeTruthy();
  });

  it('live-solves Q from R/W/V/F in the balance tab', () => {
    render(<App />);
    const set = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    set(/反当散布量/, '100');
    set(/散布幅/, '10');
    set(/走行速度/, '3');
    // 圃場係数 F は初期値 1.0、Q は空欄のまま → Q を逆算して 50 L/min。
    expect(screen.getByText(/ノズル総吐出量は\s*50\s*L\/min/)).toBeTruthy();
  });
});
