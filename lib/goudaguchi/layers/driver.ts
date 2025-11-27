// Layer 3: Driver (深層心理・欲求)
// 防衛機制、愛着スタイル、スキーマを測定

export interface DriverResult {
  defenseMechanisms: {
    repression: number; // 抑圧
    projection: number; // 投影
    sublimation: number; // 昇華
    denial: number; // 否認
  };
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  coreSchemas: {
    abandonment: number; // 見捨てられ不安
    mistrust: number; // 不信感
    defectiveness: number; // 欠陥感
    failure: number; // 失敗感
  };
  selfEsteem: number; // 自己肯定感 (-2 to 2)
}

export interface IATResult {
  selfPositiveTime: number; // 自己+ポジティブの反応時間
  selfNegativeTime: number; // 自己+ネガティブの反応時間
  otherPositiveTime: number; // 他者+ポジティブの反応時間
  otherNegativeTime: number; // 他者+ネガティブの反応時間
  selfPositiveErrors: number; // エラー数
  selfNegativeErrors: number;
}

export interface ProjectiveTestResult {
  storyEnding: string; // 選択したストーリーの結末
  imageInterpretation: string; // 画像の解釈
  biasScore: number; // バイアススコア
}

// IATから自己肯定感を計算
export function calculateSelfEsteemFromIAT(result: IATResult): number {
  const selfPositiveAvg = result.selfPositiveTime / (result.selfPositiveTime + result.selfNegativeTime);
  const selfNegativeAvg = result.selfNegativeTime / (result.selfPositiveTime + result.selfNegativeTime);
  
  // 自己+ポジティブの反応が速い = 自己肯定感が高い
  // 自己+ネガティブの反応が速い = 自己肯定感が低い
  const difference = selfPositiveAvg - selfNegativeAvg;
  
  // -2から2の範囲に正規化
  return Math.max(-2, Math.min(2, difference * 4));
}

// 投影テストから防衛機制を推定
export function calculateDefenseMechanisms(result: ProjectiveTestResult): DriverResult['defenseMechanisms'] {
  // 簡易的な実装：バイアススコアから推定
  const bias = result.biasScore;
  
  return {
    repression: bias > 0.5 ? 0.7 : 0.3,
    projection: bias > 0.3 ? 0.6 : 0.4,
    sublimation: bias < 0.2 ? 0.8 : 0.4,
    denial: bias > 0.7 ? 0.9 : 0.3,
  };
}

// 愛着スタイルの判定（簡易版）
export function determineAttachmentStyle(
  iatResult: IATResult,
  projectiveResult: ProjectiveTestResult
): DriverResult['attachmentStyle'] {
  const selfEsteem = calculateSelfEsteemFromIAT(iatResult);
  const mistrust = projectiveResult.biasScore;
  
  if (selfEsteem > 0.5 && mistrust < 0.3) {
    return 'secure';
  } else if (selfEsteem < -0.5 && mistrust > 0.5) {
    return 'avoidant';
  } else if (selfEsteem < 0 && mistrust > 0.3) {
    return 'anxious';
  } else {
    return 'disorganized';
  }
}

// 統合Driverスコアの計算
export function calculateDriverScore(
  iatResult: IATResult,
  projectiveResult: ProjectiveTestResult
): DriverResult {
  const selfEsteem = calculateSelfEsteemFromIAT(iatResult);
  const defenseMechanisms = calculateDefenseMechanisms(projectiveResult);
  const attachmentStyle = determineAttachmentStyle(iatResult, projectiveResult);
  
  return {
    defenseMechanisms,
    attachmentStyle,
    coreSchemas: {
      abandonment: projectiveResult.biasScore > 0.6 ? 0.8 : 0.3,
      mistrust: projectiveResult.biasScore,
      defectiveness: selfEsteem < -0.5 ? 0.7 : 0.3,
      failure: selfEsteem < -1 ? 0.8 : 0.3,
    },
    selfEsteem,
  };
}

