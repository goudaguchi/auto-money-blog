// Layer 2: Kernel (認知特性・脳機能)
// 実行機能、注意制御、情報入力特性を測定

export interface KernelResult {
  workingMemory: number; // ワーキングメモリスコア
  inhibition: number; // 抑制機能スコア
  shifting: number; // シフト機能スコア
  selectiveAttention: number; // 選択的注意スコア
  sustainedAttention: number; // 持続的注意スコア
  visualDominance: number; // 視覚優位度 (-1 to 1, 1=視覚優位, -1=聴覚優位)
}

export interface NBackResult {
  level: number; // N-backレベル（1, 2, 3など）
  correct: number; // 正解数
  total: number; // 総問題数
  reactionTime: number; // 平均反応時間（ms）
  accuracy: number; // 正答率
}

export interface GoNoGoResult {
  goCorrect: number; // Go正解数
  goTotal: number; // Go総数
  noGoCorrect: number; // No-Go正解数
  noGoTotal: number; // No-Go総数
  falseAlarms: number; // 誤反応数
  reactionTime: number; // 平均反応時間（ms）
}

// N-backタスクの実装
export function calculateNBackScore(result: NBackResult): number {
  // 正答率と反応速度を考慮したスコア
  const accuracyWeight = 0.7;
  const speedWeight = 0.3;
  
  const accuracyScore = result.accuracy * 100;
  const speedScore = Math.max(0, 100 - (result.reactionTime / 10)); // 反応が速いほど高得点
  
  return accuracyScore * accuracyWeight + speedScore * speedWeight;
}

// Go/No-Goタスクの実装
export function calculateGoNoGoScore(result: GoNoGoResult): number {
  const goAccuracy = result.goTotal > 0 ? result.goCorrect / result.goTotal : 0;
  const noGoAccuracy = result.noGoTotal > 0 ? result.noGoCorrect / result.noGoTotal : 0;
  const falseAlarmRate = result.noGoTotal > 0 ? result.falseAlarms / result.noGoTotal : 0;
  
  // 抑制機能スコア = No-Go正答率 - 誤反応率
  const inhibitionScore = (noGoAccuracy - falseAlarmRate) * 100;
  
  return Math.max(0, Math.min(100, inhibitionScore));
}

// 統合Kernelスコアの計算
export function calculateKernelScore(
  nBackResult: NBackResult,
  goNoGoResult: GoNoGoResult,
  visualDominance: number
): KernelResult {
  const nBackScore = calculateNBackScore(nBackResult);
  const goNoGoScore = calculateGoNoGoScore(goNoGoResult);
  
  return {
    workingMemory: nBackScore,
    inhibition: goNoGoScore,
    shifting: (nBackScore + goNoGoScore) / 2, // 簡易的なシフト機能スコア
    selectiveAttention: goNoGoScore * 0.8, // Go/No-Goから推定
    sustainedAttention: nBackScore * 0.9, // N-backから推定
    visualDominance, // 別途測定
  };
}

