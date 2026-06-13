interface MakerLink {
  label: string;
  url: string;
}

const NOZZLE_MAKERS: MakerLink[] = [
  { label: 'ヤマホ工業（噴口・ノズル）', url: 'https://www.yamaho-k.co.jp/' },
];

const MACHINE_MAKERS: MakerLink[] = [
  {
    label: '共立 ブームスプレーヤ（やまびこ）',
    url: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/contents_type=129',
  },
  { label: '共立 製品一覧（やまびこ）', url: 'https://www.yamabiko-corp.co.jp/kioritz/products/' },
];

/** ノズル／機械メーカ公式サイトへの導線。 */
export function MakerLinks({ kind }: { kind: 'nozzle' | 'machine' | 'both' }) {
  const groups: { title: string; links: MakerLink[] }[] = [];
  if (kind === 'nozzle' || kind === 'both') groups.push({ title: 'ノズルメーカ', links: NOZZLE_MAKERS });
  if (kind === 'machine' || kind === 'both') groups.push({ title: '機械メーカ', links: MACHINE_MAKERS });

  return (
    <div className="maker-links">
      {groups.map((g) => (
        <div key={g.title} className="maker-links__group">
          <span className="maker-links__title">{g.title}</span>
          <ul>
            {g.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
