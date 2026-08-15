import type { CropCategory, DataSource } from './types';

/**
 * 作物データ（品目 × 生育ステージ × 散布方法）。
 *
 * 実務では反当散布量は「作物ごとの1つの値」ではなく、
 *   品目（りんごとぶどう、キャベツとねぎ）× 生育ステージ（休眠期と生育期、
 *   定植直後と結球期）× 散布方法（動噴ホース散布と少量散布）
 * で数倍変わる。旧データのように作物1件＝散布量1値では現場と合わないため、
 * ステージ×散布方法ごとに「下限・標準・上限」のレンジを持たせる。
 *
 * 数値は慣行の目安（農薬ラベルに記載される希釈水量の一般的な範囲）で、
 * provenance:'estimated'（要確認）。実際の散布量は農薬ラベル・地域の防除基準・
 * 樹齢や仕立て・生育量で変わるため、レンジは入力値の妥当性チェック用に使い、
 * 単独の推奨値としては扱わない。
 */

/** 目安レンジ（下限・標準・上限）。 */
export interface VolumeRange {
  min: number;
  typical: number;
  max: number;
}

/** 生育ステージ内の、1つの散布方法に対する散布量の目安。 */
export interface CropStageMethod {
  /** sprayMethods の id。 */
  sprayMethodId: string;
  /** 反当散布量[L/10a]の目安レンジ。 */
  volumeLper10a: VolumeRange;
  note?: string;
}

/** 生育ステージ（＝防除の場面）。 */
export interface CropStage {
  id: string;
  name: string;
  /** 主な防除対象・時期。 */
  description: string;
  methods: CropStageMethod[];
}

export interface CropPreset {
  id: string;
  name: string;
  category: CropCategory;
  /** 表記ゆれ・別名（品目検索用）。 */
  aliases?: string[];
  /**
   * 散布幅の既定[m]。果樹・茶は「樹列間隔（畝間）」＝走行1行程が受け持つ幅。
   * ブーム散布のように機械側で幅が決まる品目では未設定（機種の全幅を使う）。
   */
  defaultWidthM?: number;
  stages: CropStage[];
  source: DataSource;
}

const est: DataSource = { provenance: 'estimated', verified: false, updatedAt: '2026-08-15' };

type Tuple = [min: number, typical: number, max: number];

const vol = ([min, typical, max]: Tuple): VolumeRange => ({ min, typical, max });

/** ステージ内の1散布方法ぶんの目安。 */
const via = (sprayMethodId: string, t: Tuple, note?: string): CropStageMethod => ({
  sprayMethodId,
  volumeLper10a: vol(t),
  ...(note ? { note } : {}),
});

const stage = (
  id: string,
  name: string,
  description: string,
  methods: CropStageMethod[],
): CropStage => ({ id, name, description, methods });

const crop = (
  id: string,
  name: string,
  category: CropCategory,
  stages: CropStage[],
  extra: { aliases?: string[]; defaultWidthM?: number } = {},
): CropPreset => ({ id, name, category, ...extra, stages, source: est });

// --- 水稲 ---------------------------------------------------------------
// 本田の茎葉散布。動噴ホース散布は 60〜150 L/10a、乗用・ブームの少量散布は
// 15〜30 L/10a と、同じ防除でも方法で 5 倍前後の開きがある。
const paddyCrops: CropPreset[] = [
  crop('rice', '水稲', 'paddy', [
    stage('rice-early', '初中期（分げつ期）', '初期・中期の病害虫、初中期一発処理後の追加防除', [
      via('hose-lance', [60, 100, 150]),
      via('boom-broadcast', [20, 30, 50]),
      via('low-volume', [15, 20, 25], '少量散布ノズル使用'),
    ]),
    stage('rice-heading', '穂ばらみ〜出穂期', 'いもち病・カメムシ類の重要防除期。付着量を確保する', [
      via('hose-lance', [80, 120, 150]),
      via('boom-broadcast', [25, 40, 60]),
      via('low-volume', [20, 25, 30]),
    ]),
  ]),
];

// --- 畑作 ---------------------------------------------------------------
const uplandCrops: CropPreset[] = [
  crop('wheat', '麦', 'upland', [
    stage('wheat-tillering', '分げつ期', '雑草・初期病害虫。草丈が低く付着面積が小さい', [
      via('boom-broadcast', [60, 80, 100]),
      via('low-volume', [15, 25, 40]),
    ]),
    stage('wheat-heading', '出穂〜開花期', '赤かび病防除。穂への付着を確保する', [
      via('boom-broadcast', [60, 100, 150]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['小麦', '大麦', 'こむぎ'] }),
  crop('soybean', '大豆', 'upland', [
    stage('soybean-early', '生育初期', '出芽揃い〜本葉展開期の害虫・雑草', [
      via('boom-broadcast', [60, 80, 100]),
      via('low-volume', [20, 30, 50]),
    ]),
    stage('soybean-pod', '開花〜莢肥大期', '茎葉が繁茂し、株内部まで薬液を届ける必要がある', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['だいず'] }),
  crop('potato', 'ばれいしょ', 'upland', [
    stage('potato-early', '生育初期', '出芽〜培土前。茎葉量が少ない', [
      via('boom-broadcast', [60, 100, 150]),
    ]),
    stage('potato-canopy', '培土後〜茎葉繁茂期', '疫病防除。畝が覆われ薬液量が増える', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [150, 200, 300]),
    ]),
  ], { aliases: ['じゃがいも', '馬鈴薯'] }),
  crop('sugarbeet', 'てんさい', 'upland', [
    stage('sugarbeet-early', '生育初期', '本葉展開期の雑草・害虫', [
      via('boom-broadcast', [60, 100, 150]),
    ]),
    stage('sugarbeet-canopy', '茎葉繁茂期', '褐斑病防除。葉が重なり合う時期', [
      via('boom-broadcast', [100, 150, 200]),
    ]),
  ], { aliases: ['ビート', '砂糖大根'] }),
];

// --- 露地野菜 -----------------------------------------------------------
// 生育量に比例して散布量が増える。定植直後と収穫前で 2〜3 倍の差がある。
const vegetableCrops: CropPreset[] = [
  crop('cabbage', 'キャベツ', 'vegetable', [
    stage('veg-early', '定植〜活着期', '苗の株数ぶんだけ散布すればよく、少量で足りる', [
      via('boom-broadcast', [80, 100, 150]),
      via('hose-lance', [80, 120, 150]),
    ]),
    stage('veg-growing', '生育中期（外葉形成期）', '外葉が展開し株間が埋まる時期', [
      via('boom-broadcast', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
    stage('veg-heading', '結球期〜収穫前', '結球内部・株元まで薬液を届ける必要がある', [
      via('boom-broadcast', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ]),
  crop('chinese-cabbage', 'はくさい', 'vegetable', [
    stage('veg-early', '定植〜活着期', '苗の株数ぶんの散布', [
      via('boom-broadcast', [80, 100, 150]),
      via('hose-lance', [80, 120, 150]),
    ]),
    stage('veg-growing', '生育中期', '外葉展開期', [
      via('boom-broadcast', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
    stage('veg-heading', '結球期〜収穫前', '結球内部の害虫防除', [
      via('boom-broadcast', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ], { aliases: ['白菜'] }),
  crop('broccoli', 'ブロッコリー', 'vegetable', [
    stage('veg-early', '定植〜活着期', '苗の株数ぶんの散布', [
      via('boom-broadcast', [80, 100, 150]),
    ]),
    stage('veg-growing', '生育中期', '茎葉伸長期', [
      via('boom-broadcast', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
    stage('veg-harvest', '花蕾形成〜収穫前', '花蕾への害虫防除', [
      via('boom-broadcast', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ]),
  crop('lettuce', 'レタス', 'vegetable', [
    stage('veg-early', '定植〜活着期', '苗の株数ぶんの散布', [
      via('boom-broadcast', [80, 100, 150]),
    ]),
    stage('veg-growing', '生育中期', '外葉展開期', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
    stage('veg-heading', '結球期〜収穫前', '結球期。薬液がかかりにくくなる', [
      via('boom-broadcast', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
  ]),
  crop('welsh-onion', 'ねぎ', 'vegetable', [
    stage('onion-early', '定植〜生育初期', '葉が細く直立し、薬液が落ちやすい', [
      via('boom-broadcast', [100, 120, 150], '展着剤の使用を前提とする'),
      via('hose-lance', [100, 120, 150]),
    ]),
    stage('onion-growing', '軟白・肥大期〜収穫前', '葉鞘部・葉先までむらなく付着させる', [
      via('boom-broadcast', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
  ], { aliases: ['長ねぎ', '白ねぎ', '葱'] }),
  crop('onion', 'たまねぎ', 'vegetable', [
    stage('onion-early', '生育初期', '活着〜葉数確保期', [
      via('boom-broadcast', [80, 100, 150], '展着剤の使用を前提とする'),
    ]),
    stage('onion-bulbing', '肥大期〜収穫前', 'べと病等の重要防除期', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['玉ねぎ', '玉葱'] }),
  crop('carrot', 'にんじん', 'vegetable', [
    stage('veg-early', '生育初期', '間引き前後。葉量が少ない', [
      via('boom-broadcast', [80, 100, 150]),
    ]),
    stage('veg-growing', '茎葉繁茂期〜収穫前', '黒葉枯病等。葉が畝を覆う', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['人参'] }),
  crop('daikon', 'だいこん', 'vegetable', [
    stage('veg-early', '生育初期', '間引き前後', [via('boom-broadcast', [80, 100, 150])]),
    stage('veg-growing', '茎葉繁茂期〜収穫前', '葉が大きく展開する', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['大根'] }),
  crop('spinach', 'ほうれんそう', 'vegetable', [
    stage('veg-early', '生育初期', '本葉展開期', [via('boom-broadcast', [80, 100, 120])]),
    stage('veg-growing', '収穫前', '株が込み合う時期', [
      via('boom-broadcast', [100, 120, 150]),
      via('hose-lance', [100, 120, 150]),
    ]),
  ], { aliases: ['ほうれん草'] }),
  crop('sweetcorn', 'スイートコーン', 'vegetable', [
    stage('corn-early', '生育初期', '雑草・アワノメイガ初期防除', [
      via('boom-broadcast', [60, 100, 150]),
    ]),
    stage('corn-silking', '出穂〜絹糸抽出期', '雌穂への薬液到達が必要。草丈が高い', [
      via('boom-broadcast', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
  ], { aliases: ['とうもろこし'] }),
];

// --- 施設野菜 -----------------------------------------------------------
// ハウス内の動噴＋ホース散布が主体。走行速度ではなく歩行速度で考える。
const facilityCrops: CropPreset[] = [
  crop('tomato', 'トマト', 'facility', [
    stage('fac-early', '定植〜生育初期', '株が小さく、必要な薬液量も少ない', [
      via('facility-spray', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
    stage('fac-growing', '着果〜収穫期', '茎葉が繁茂し、葉裏まで薬液を届ける必要がある', [
      via('facility-spray', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ], { aliases: ['ミニトマト'] }),
  crop('cucumber', 'きゅうり', 'facility', [
    stage('fac-early', '定植〜つる伸長期', '株が小さい時期', [
      via('facility-spray', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
    stage('fac-growing', '収穫期', 'うどんこ病・べと病。葉数が多く葉裏防除が必要', [
      via('facility-spray', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ]),
  crop('eggplant', 'なす', 'facility', [
    stage('fac-early', '定植〜生育初期', '株が小さい時期', [
      via('facility-spray', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
    stage('fac-growing', '収穫期', '整枝後も枝葉が多く、薬液量が増える', [
      via('facility-spray', [200, 250, 300]),
      via('hose-lance', [200, 250, 300]),
    ]),
  ], { aliases: ['ナス', '茄子'] }),
  crop('strawberry', 'いちご', 'facility', [
    stage('straw-early', '定植〜株養成期', 'ランナー除去後の株養成期', [
      via('facility-spray', [100, 150, 200]),
      via('hose-lance', [100, 150, 200]),
    ]),
    stage('straw-harvest', '開花〜収穫期', '果実・葉裏へのむらのない付着が必要', [
      via('facility-spray', [150, 200, 250]),
      via('hose-lance', [150, 200, 250]),
    ]),
  ], { aliases: ['苺'] }),
];

// --- 果樹 ---------------------------------------------------------------
// スピードスプレーヤの送風散布が主体。散布幅は機械の幅ではなく「樹列間隔」で、
// 樹冠の大きさ（樹種・樹齢・仕立て）で散布量が大きく変わる。
// 休眠期（発芽前）散布は生育期より多量になる点が実務上の大きな差。
const orchardCrops: CropPreset[] = [
  crop('apple', 'りんご', 'orchard', [
    stage('orchard-dormant', '休眠期（発芽前）', 'マシン油乳剤・石灰硫黄合剤等。樹全体を濡らす多量散布', [
      via('orchard-airblast', [300, 400, 600]),
      via('hose-lance', [300, 400, 600]),
    ]),
    stage('orchard-growing', '生育期（開花後〜盛夏）', '黒星病・害虫の定期防除', [
      via('orchard-airblast', [200, 300, 400]),
      via('hose-lance', [250, 350, 450]),
    ]),
    stage('orchard-preharvest', '収穫前', '果実肥大期。散布量は生育期並みかやや少なめ', [
      via('orchard-airblast', [200, 250, 300]),
    ]),
  ], { defaultWidthM: 4.0, aliases: ['林檎'] }),
  crop('pear', 'なし', 'orchard', [
    stage('orchard-dormant', '休眠期（発芽前）', '越冬病害虫。棚面全体を濡らす', [
      via('orchard-airblast', [300, 400, 500]),
      via('hose-lance', [300, 400, 500]),
    ]),
    stage('orchard-growing', '生育期', '黒星病・赤星病の定期防除', [
      via('orchard-airblast', [250, 300, 400]),
      via('hose-lance', [250, 350, 450]),
    ]),
  ], { defaultWidthM: 3.5, aliases: ['梨'] }),
  crop('grape', 'ぶどう', 'orchard', [
    stage('orchard-dormant', '休眠期（発芽前）', '越冬病害虫防除', [
      via('orchard-airblast', [200, 300, 400]),
      via('hose-lance', [200, 300, 400]),
    ]),
    stage('orchard-growing', '生育期（展葉〜果房肥大）', 'べと病・晩腐病。果房への付着が重要', [
      via('orchard-airblast', [200, 250, 300]),
      via('hose-lance', [200, 300, 400]),
    ]),
  ], { defaultWidthM: 3.0, aliases: ['葡萄'] }),
  crop('peach', 'もも', 'orchard', [
    stage('orchard-dormant', '休眠期（発芽前）', '縮葉病・越冬害虫', [
      via('orchard-airblast', [250, 350, 500]),
      via('hose-lance', [250, 350, 500]),
    ]),
    stage('orchard-growing', '生育期', '灰星病・害虫の定期防除', [
      via('orchard-airblast', [200, 250, 350]),
      via('hose-lance', [250, 300, 400]),
    ]),
  ], { defaultWidthM: 4.0, aliases: ['桃'] }),
  crop('citrus', 'かんきつ', 'orchard', [
    stage('citrus-spring', '春季（発芽〜開花後）', 'そうか病・ミカンハダニ等', [
      via('orchard-airblast', [250, 350, 500]),
      via('hose-lance', [300, 400, 500]),
    ]),
    stage('citrus-summer', '夏季（果実肥大期）', 'かいよう病・害虫。樹冠が大きく多量散布になる', [
      via('orchard-airblast', [300, 400, 600]),
      via('hose-lance', [300, 450, 600]),
    ]),
  ], { defaultWidthM: 3.5, aliases: ['みかん', '温州みかん', '柑橘'] }),
  crop('persimmon', 'かき', 'orchard', [
    stage('orchard-dormant', '休眠期（発芽前）', '越冬病害虫防除', [
      via('orchard-airblast', [250, 350, 450]),
      via('hose-lance', [250, 350, 450]),
    ]),
    stage('orchard-growing', '生育期', '炭疽病・落葉病・カメムシ類', [
      via('orchard-airblast', [200, 300, 400]),
      via('hose-lance', [250, 350, 450]),
    ]),
  ], { defaultWidthM: 4.0, aliases: ['柿'] }),
];

// --- 茶 -----------------------------------------------------------------
const teaCrops: CropPreset[] = [
  crop('tea', '茶', 'tea', [
    stage('tea-pre', '摘採前', '新芽への薬液付着が目的。使用時期の制限に注意', [
      via('orchard-airblast', [200, 300, 400]),
      via('hose-lance', [200, 300, 400]),
    ]),
    stage('tea-post', '摘採後（整枝後）', 'クワシロカイガラムシ等。株内部まで濡らす多量散布', [
      via('orchard-airblast', [300, 400, 500]),
      via('hose-lance', [300, 400, 500]),
    ]),
  ], { defaultWidthM: 1.8, aliases: ['チャ', '茶樹'] }),
];

export const CROP_PRESETS: CropPreset[] = [
  ...paddyCrops,
  ...uplandCrops,
  ...vegetableCrops,
  ...facilityCrops,
  ...orchardCrops,
  ...teaCrops,
];

export const CROP_BY_ID = new Map(CROP_PRESETS.map((c) => [c.id, c]));

export function getCrop(cropId: string): CropPreset | undefined {
  return CROP_BY_ID.get(cropId);
}

export function getStage(crop: CropPreset, stageId: string): CropStage | undefined {
  return crop.stages.find((s) => s.id === stageId);
}

/** その作物で使われる散布方法 id（全ステージの和集合、初出順）。 */
export function sprayMethodIdsForCrop(crop: CropPreset): string[] {
  const ids: string[] = [];
  for (const s of crop.stages) {
    for (const m of s.methods) if (!ids.includes(m.sprayMethodId)) ids.push(m.sprayMethodId);
  }
  return ids;
}

/** 作物全体の散布量レンジ（全ステージ・全方法の最小〜最大）。一覧表示用。 */
export function cropVolumeSpan(crop: CropPreset): { min: number; max: number } {
  const all = crop.stages.flatMap((s) => s.methods.map((m) => m.volumeLper10a));
  return {
    min: Math.min(...all.map((v) => v.min)),
    max: Math.max(...all.map((v) => v.max)),
  };
}

export const SPRAY_VOLUME_DISCLAIMER =
  '散布量・適合の目安は慣行に基づく参考値です（作物ごとの目安レンジは要確認データ）。実際は農薬ラベルの希釈水量や地域の防除基準、機器の取扱説明書に従ってください。提案結果は目安であり、農学的助言ではありません。';
