/**
 * 作物別の反当散布量プリセット（目安）。
 *
 * これらは一般的な参考値であり、実際の散布量は農薬ラベルや地域の防除
 * 基準に従うこと。値は estimated 扱いで、後から実データに差し替え可能。
 */

export interface CropPreset {
  id: string;
  name: string;
  /** 反当散布量の目安[L/10a]。 */
  standardR: number;
}

export const CROP_PRESETS: CropPreset[] = [
  { id: 'low-volume', name: '少量散布', standardR: 8 },
  { id: 'rice', name: '水稲', standardR: 25 },
  { id: 'wheat', name: '麦', standardR: 50 },
  { id: 'soybean', name: '大豆', standardR: 50 },
  { id: 'vegetable', name: '露地野菜', standardR: 100 },
];

export const SPRAY_VOLUME_DISCLAIMER =
  '散布量の目安は一般的な参考値です。実際は農薬ラベルや地域の防除基準に従ってください。提案結果は目安であり、農学的助言ではありません。';
