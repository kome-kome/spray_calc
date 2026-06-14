/**
 * 作物プリセット（目安）と、その作物で一般的な散布方法へのリンク。
 *
 * 反当散布量は一般的な参考値。実際は農薬ラベル・地域防除基準に従うこと。
 */

export type CropCategory = 'paddy' | 'upland' | 'orchard';

export interface CropPreset {
  id: string;
  name: string;
  category: CropCategory;
  /** 反当散布量の目安[L/10a]。 */
  standardR: number;
  /** 一般的な散布方法（sprayMethods の id）。 */
  sprayMethodIds: string[];
}

export const CROP_PRESETS: CropPreset[] = [
  { id: 'rice', name: '水稲', category: 'paddy', standardR: 25, sprayMethodIds: ['boom-broadcast', 'hose-lance'] },
  { id: 'wheat', name: '麦', category: 'upland', standardR: 50, sprayMethodIds: ['boom-broadcast'] },
  { id: 'soybean', name: '大豆', category: 'upland', standardR: 50, sprayMethodIds: ['boom-broadcast', 'low-volume'] },
  { id: 'vegetable', name: '露地野菜', category: 'upland', standardR: 100, sprayMethodIds: ['boom-broadcast', 'hose-lance', 'low-volume'] },
  { id: 'fruit', name: '果樹', category: 'orchard', standardR: 300, sprayMethodIds: ['orchard-airblast', 'hose-lance'] },
];

export const SPRAY_VOLUME_DISCLAIMER =
  '散布量・適合の目安は一般的な参考値です。実際は農薬ラベルや地域の防除基準、機器の取扱説明書に従ってください。提案結果は目安であり、農学的助言ではありません。';
