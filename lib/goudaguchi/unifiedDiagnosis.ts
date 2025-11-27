// 5層統合診断システム
// 全レイヤーのデータを統合して最終診断を生成

import type { DiagnosisScores } from './types';
import type { HardwareResult } from './layers/hardware';
import type { KernelResult } from './layers/kernel';
import type { DriverResult } from './layers/driver';
import type { LogsResult } from './layers/logs';

export interface UnifiedDiagnosisResult {
  // 各レイヤーの結果
  hardware: HardwareResult;
  kernel: KernelResult;
  driver: DriverResult;
  application: DiagnosisScores; // 既存のApplication層スコア
  logs: LogsResult;
  
  // 統合分析
  osType: string;
  primaryCharacteristics: string[];
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  clinicalRisk: 'low' | 'moderate' | 'high' | 'severe';
}

// OSタイプの詳細判定
export function determineAdvancedOSType(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  application: DiagnosisScores,
  logs: LogsResult
): string {
  // ADHD-Trauma型: トラウマ + ADHD特性
  if (logs.traumaLevel !== 'low' && 
      (application.impulseControl < -2 || kernel.inhibition < 50)) {
    return 'ADHD-Trauma型';
  }
  
  // High-IQ ADHD型: 高い認知能力でADHD特性を補っている
  if (kernel.workingMemory > 70 && 
      kernel.inhibition < 60 && 
      application.planning > 0) {
    return 'High-IQ ADHD型';
  }
  
  // Sensory-Processing型: 感覚過敏が主な特徴
  if (hardware.sensorySensitivity > 1.5) {
    return 'Sensory-Processing型';
  }
  
  // Attachment-Disordered型: 愛着の問題が主
  if (driver.attachmentStyle !== 'secure' && logs.aceScore >= 4) {
    return 'Attachment-Disordered型';
  }
  
  // Executive-Dysfunction型: 実行機能の問題が主
  if (kernel.workingMemory < 50 && kernel.inhibition < 50) {
    return 'Executive-Dysfunction型';
  }
  
  // 一般的なADHD型
  if (application.impulseControl < -1 || kernel.inhibition < 60) {
    return 'ADHD型';
  }
  
  // バランス型
  return 'バランス型';
}

// リスク要因の特定
export function identifyRiskFactors(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  logs: LogsResult
): string[] {
  const risks: string[] = [];
  
  if (logs.aceScore >= 4) {
    risks.push('高レベルのトラウマ体験');
  }
  
  if (driver.selfEsteem < -1) {
    risks.push('低い自己肯定感');
  }
  
  if (kernel.inhibition < 40) {
    risks.push('抑制機能の低下');
  }
  
  if (hardware.polyvagalState > 1.5) {
    risks.push('過覚醒状態');
  }
  
  if (driver.attachmentStyle === 'disorganized') {
    risks.push('混乱型愛着スタイル');
  }
  
  if (logs.resilience < 40) {
    risks.push('低いレジリエンス');
  }
  
  return risks;
}

// 強みの特定
export function identifyStrengths(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  application: DiagnosisScores,
  logs: LogsResult
): string[] {
  const strengths: string[] = [];
  
  if (kernel.workingMemory > 70) {
    strengths.push('優れたワーキングメモリ');
  }
  
  if (application.empathy > 1) {
    strengths.push('高い共感性');
  }
  
  if (logs.resilience > 70) {
    strengths.push('高いレジリエンス');
  }
  
  if (driver.attachmentStyle === 'secure') {
    strengths.push('安定した愛着スタイル');
  }
  
  if (hardware.chronotype > 0.5) {
    strengths.push('規則的な生活リズム');
  }
  
  if (application.planning > 1) {
    strengths.push('優れた計画性');
  }
  
  return strengths;
}

// 臨床リスクレベルの判定
export function determineClinicalRisk(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  logs: LogsResult
): UnifiedDiagnosisResult['clinicalRisk'] {
  let riskScore = 0;
  
  // トラウマスコア
  if (logs.aceScore >= 6) riskScore += 3;
  else if (logs.aceScore >= 4) riskScore += 2;
  else if (logs.aceScore >= 2) riskScore += 1;
  
  // 自己肯定感
  if (driver.selfEsteem < -1.5) riskScore += 2;
  else if (driver.selfEsteem < -0.5) riskScore += 1;
  
  // 認知機能
  if (kernel.inhibition < 30 && kernel.workingMemory < 40) riskScore += 2;
  else if (kernel.inhibition < 50 || kernel.workingMemory < 50) riskScore += 1;
  
  // 自律神経
  if (hardware.polyvagalState > 1.5 || hardware.polyvagalState < -1.5) riskScore += 1;
  
  if (riskScore >= 5) return 'severe';
  if (riskScore >= 3) return 'high';
  if (riskScore >= 1) return 'moderate';
  return 'low';
}

// パーソナライズされた推奨事項の生成
export function generateUnifiedRecommendations(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  application: DiagnosisScores,
  logs: LogsResult,
  osType: string
): string[] {
  const recommendations: string[] = [];
  
  // トラウマ関連
  if (logs.aceScore >= 4) {
    recommendations.push('トラウマインフォームドケアの専門家との相談を検討してください。');
  }
  
  // 認知機能
  if (kernel.inhibition < 50) {
    recommendations.push('抑制機能を向上させるため、マインドフルネスや瞑想を試してみてください。');
  }
  
  if (kernel.workingMemory < 50) {
    recommendations.push('ワーキングメモリを鍛えるため、N-backタスクなどの認知トレーニングを継続してください。');
  }
  
  // 感覚処理
  if (hardware.sensorySensitivity > 1) {
    recommendations.push('感覚過敏がある場合、環境調整（照明、音、触覚刺激の管理）が重要です。');
  }
  
  // 自律神経
  if (hardware.polyvagalState > 1) {
    recommendations.push('過覚醒状態を緩和するため、深呼吸やグラウンディング技法を練習してください。');
  }
  
  // 愛着
  if (driver.attachmentStyle !== 'secure') {
    recommendations.push('愛着スタイルの改善のため、安全な関係性を築く練習をしてみてください。');
  }
  
  // 自己肯定感
  if (driver.selfEsteem < -0.5) {
    recommendations.push('自己肯定感を高めるため、小さな成功体験を積み重ね、自己受容を練習してください。');
  }
  
  // レジリエンス
  if (logs.resilience < 50) {
    recommendations.push('レジリエンスを高めるため、過去の困難を乗り越えた経験を振り返り、強みを認識してください。');
  }
  
  // OSタイプ別の推奨事項
  if (osType.includes('ADHD')) {
    recommendations.push('ADHD特性に合わせた環境調整（通知を減らす、集中できる空間を作る、タスクを細分化する）が効果的です。');
  }
  
  return recommendations;
}

// 統合診断の生成
export function generateUnifiedDiagnosis(
  hardware: HardwareResult,
  kernel: KernelResult,
  driver: DriverResult,
  application: DiagnosisScores,
  logs: LogsResult
): UnifiedDiagnosisResult {
  const osType = determineAdvancedOSType(hardware, kernel, driver, application, logs);
  const riskFactors = identifyRiskFactors(hardware, kernel, driver, logs);
  const strengths = identifyStrengths(hardware, kernel, driver, application, logs);
  const clinicalRisk = determineClinicalRisk(hardware, kernel, driver, logs);
  const recommendations = generateUnifiedRecommendations(
    hardware, kernel, driver, application, logs, osType
  );
  
  // 主要特性の抽出
  const primaryCharacteristics: string[] = [];
  if (kernel.inhibition < 50) primaryCharacteristics.push('抑制機能の低下');
  if (application.impulseControl < -1) primaryCharacteristics.push('衝動性');
  if (logs.aceScore >= 4) primaryCharacteristics.push('トラウマ体験');
  if (driver.selfEsteem < -0.5) primaryCharacteristics.push('低い自己肯定感');
  if (hardware.sensorySensitivity > 1) primaryCharacteristics.push('感覚過敏');
  
  return {
    hardware,
    kernel,
    driver,
    application,
    logs,
    osType,
    primaryCharacteristics,
    riskFactors,
    strengths,
    recommendations,
    clinicalRisk,
  };
}

