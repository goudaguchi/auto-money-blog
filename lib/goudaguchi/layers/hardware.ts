// Layer 1: Hardware (神経系・感覚処理)
// 感覚処理感受性、自律神経調整、概日リズムを測定

export interface HardwareResult {
  sensorySensitivity: number; // 感覚処理感受性 (-2 to 2, 正=過敏, 負=鈍麻)
  polyvagalState: number; // 自律神経状態 (-2 to 2, 正=過覚醒, 負=低覚醒)
  chronotype: number; // 概日リズム (-1 to 1, 1=朝型, -1=夜型)
  recoveryTime: number; // ストレス後の回復時間（秒）
}

export interface SensoryTestResult {
  visualSensitivity: number; // 視覚過敏度
  auditorySensitivity: number; // 聴覚過敏度
  discomfortScore: number; // 不快指数
}

export interface StressTestResult {
  baselineReactionTime: number; // ベースライン反応時間
  stressedReactionTime: number; // ストレス下の反応時間
  recoveryTime: number; // 回復時間
  performanceDegradation: number; // パフォーマンス低下率
}

// 感覚処理感受性の計算
export function calculateSensorySensitivity(result: SensoryTestResult): number {
  const avgSensitivity = (result.visualSensitivity + result.auditorySensitivity) / 2;
  // -2 (鈍麻) から 2 (過敏) の範囲に正規化
  return (avgSensitivity - 50) / 25; // 0-100スケールを-2から2に変換
}

// 自律神経状態の計算（Polyvagal Theory）
export function calculatePolyvagalState(result: StressTestResult): number {
  const degradation = result.performanceDegradation;
  const recovery = result.recoveryTime;
  
  // パフォーマンス低下が大きく、回復が遅い = 過覚醒
  // パフォーマンス低下が小さく、回復が速い = 適切な状態
  // パフォーマンス低下が小さく、回復が遅い = 低覚醒
  let state = 0;
  
  if (degradation > 30) {
    state += 1; // 過覚醒傾向
  }
  if (recovery > 5) {
    state += 0.5; // 回復が遅い
  }
  if (degradation < 10 && recovery < 2) {
    state -= 0.5; // 低覚醒傾向
  }
  
  return Math.max(-2, Math.min(2, state));
}

// 統合Hardwareスコアの計算
export function calculateHardwareScore(
  sensoryResult: SensoryTestResult,
  stressResult: StressTestResult,
  chronotype: number
): HardwareResult {
  return {
    sensorySensitivity: calculateSensorySensitivity(sensoryResult),
    polyvagalState: calculatePolyvagalState(stressResult),
    chronotype,
    recoveryTime: stressResult.recoveryTime,
  };
}

