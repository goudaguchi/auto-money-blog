import type { EpisodeResult, DiagnosisScores, BiometricData, Episode } from './types';
import scenariosData from './scenarios.json';

const scenarios = scenariosData as Episode[];

export function calculateDiagnosis(episodeResults: EpisodeResult[]): DiagnosisScores {
  const scores: DiagnosisScores = {
    impulseControl: 0,
    planning: 0,
    riskTolerance: 0,
    moneySense: 0,
    selfControl: 0,
    boundarySetting: 0,
    selfAdvocacy: 0,
    empathy: 0,
  };

  episodeResults.forEach((result) => {
    // エピソードとシーンを特定
    const episode = scenarios.find((ep) => ep.id === result.episodeId);
    if (!episode) return;

    const scene = episode.scenes.find((s) => s.id === result.sceneId);
    if (!scene) return;

    const choice = scene.choices.find((c) => c.id === result.choiceId);
    if (!choice) return;

    // 基本スコアを追加
    Object.entries(choice.scores).forEach(([key, value]) => {
      if (key in scores) {
        scores[key as keyof DiagnosisScores] += value;
      }
    });

    // 生体データによる補正
    const biometricMultiplier = calculateBiometricMultiplier(result.biometricData, choice);
    Object.entries(choice.scores).forEach(([key, value]) => {
      if (key in scores && value < 0) {
        // 衝動的な選択肢を素早く選んだ場合、衝動性を強調
        scores[key as keyof DiagnosisScores] += value * (biometricMultiplier - 1);
      }
    });
  });

  return scores;
}

function calculateBiometricMultiplier(
  biometricData: BiometricData,
  choice: { scores: { [key: string]: number } }
): number {
  let multiplier = 1.0;

  // 0.5秒以内に決定 = 衝動的
  if (biometricData.timeToDecision < 500) {
    // 衝動的な選択肢（負のスコア）を素早く選んだ場合
    const hasImpulsiveChoice = Object.values(choice.scores).some((score) => score < 0);
    if (hasImpulsiveChoice) {
      multiplier = 2.0; // 衝動性を2倍に
    }
  }

  // 5秒以上迷った = 葛藤がある
  if (biometricData.timeToDecision > 5000) {
    // 論理的な選択肢（正のスコア）を選んだが迷った場合
    const hasLogicalChoice = Object.values(choice.scores).some((score) => score > 0);
    if (hasLogicalChoice) {
      multiplier = 0.7; // スコアを割り引く
    }
  }

  // クリック回数が多い = 迷いが多い
  if (biometricData.clickCount > 3) {
    multiplier *= 0.9;
  }

  // マウス移動距離が大きい = 落ち着きがない
  if (biometricData.mouseDistance > 1000) {
    multiplier *= 0.95;
  }

  return multiplier;
}

export function determineOSType(scores: DiagnosisScores): string {
  const { impulseControl, planning, selfControl, boundarySetting } = scores;

  // ADHD-Trauma型: 衝動性が高く、計画性が低い、境界設定が弱い
  if (impulseControl < -2 && planning < -2 && boundarySetting < -1) {
    return 'ADHD-Trauma型';
  }

  // High-IQ ADHD型: 衝動性はあるが、他の能力で補っている
  if (impulseControl < -1 && planning > 0) {
    return 'High-IQ ADHD型';
  }

  // 一般的なADHD型
  if (impulseControl < -1 || selfControl < -1) {
    return 'ADHD型';
  }

  // バランス型
  if (Math.abs(impulseControl) <= 1 && Math.abs(planning) <= 1) {
    return 'バランス型';
  }

  return '未分類';
}

export function generateRecommendations(scores: DiagnosisScores, osType: string): string[] {
  const recommendations: string[] = [];

  if (scores.impulseControl < -2) {
    recommendations.push('衝動性が高い傾向があります。重要な決定の前に「3分待つ」習慣を取り入れてみてください。');
  }

  if (scores.planning < -2) {
    recommendations.push('計画性を高めるために、大きなタスクを小さなステップに分解する習慣を身につけましょう。');
  }

  if (scores.boundarySetting < -1) {
    recommendations.push('境界設定を練習しましょう。「NO」と言うことは自己ケアの重要な一部です。');
  }

  if (scores.moneySense < -1) {
    recommendations.push('お金の管理について、予算を立てて「使っていいお金」を明確にしましょう。');
  }

  if (osType.includes('ADHD')) {
    recommendations.push('ADHD特性がある場合、環境調整（通知を減らす、集中できる空間を作る）が効果的です。');
  }

  return recommendations;
}

