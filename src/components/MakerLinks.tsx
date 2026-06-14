interface MakerLink {
  label: string;
  url: string;
}

const YAMABIKO_LINKS: MakerLink[] = [
  {
    label: '共立 ブームスプレーヤ',
    url: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/contents_type=129',
  },
  {
    label: '共立 スピードスプレーヤ',
    url: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/contents_type=59',
  },
  {
    label: '共立 セット動噴・動力噴霧機',
    url: 'https://www.yamabiko-corp.co.jp/kioritz/products/category/contents_type=109',
  },
  { label: '共立 製品一覧', url: 'https://www.yamabiko-corp.co.jp/kioritz/products/' },
];

// 他社(ヤマホ)は技術参考リンクのみ残す。
const REFERENCE_LINKS: MakerLink[] = [
  { label: 'ヤマホ 反当散布量換算表', url: 'http://www.yamaho-k.co.jp/03/post_95.html' },
  { label: 'ヤマホ 技術資料', url: 'https://www.yamaho-k.co.jp/03/' },
];

/** やまびこ(共立)公式への導線と、散布量計算の技術参考リンク。 */
export function MakerLinks() {
  const groups: { title: string; links: MakerLink[] }[] = [
    { title: 'やまびこ（共立）公式', links: YAMABIKO_LINKS },
    { title: '技術参考', links: REFERENCE_LINKS },
  ];

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
