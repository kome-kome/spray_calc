/** Google Analytics (gtag) への薄いラッパ。未読込でも安全に no-op。 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    /* 計測の失敗はアプリ動作に影響させない */
  }
}
