import type { Provenance } from '../data/types';

const LABELS: Record<Provenance, string> = {
  'iso-standard': 'ISO規格',
  'maker-catalog': 'メーカ資料',
  estimated: '推定',
};

/** データの出典・検証状態を示すバッジ。verified:false は「要確認」。 */
export function ProvenanceBadge({
  verified,
  provenance,
}: {
  verified: boolean;
  provenance: Provenance;
}) {
  return (
    <span className={`badge ${verified ? 'badge--ok' : 'badge--warn'}`}>
      {LABELS[provenance]}
      {verified ? '・確認済' : '・要確認'}
    </span>
  );
}
