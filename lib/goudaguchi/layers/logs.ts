// Layer 5: Logs (生育歴・ナラティブ)
// ACEs、成功/失敗体験、自己効力感を測定

export interface LogsResult {
  aceScore: number; // ACEsスコア (0-10)
  traumaLevel: 'low' | 'moderate' | 'high' | 'severe';
  selfEfficacy: number; // 自己効力感 (-2 to 2)
  resilience: number; // レジリエンス (0-100)
  lifeNarrative: {
    positiveEvents: number;
    negativeEvents: number;
    turningPoints: number;
  };
}

export interface ACEsQuestionnaire {
  abuse: {
    physical: boolean;
    emotional: boolean;
    sexual: boolean;
  };
  neglect: {
    physical: boolean;
    emotional: boolean;
  };
  householdDysfunction: {
    substanceAbuse: boolean;
    mentalIllness: boolean;
    parentalSeparation: boolean;
    domesticViolence: boolean;
    criminalBehavior: boolean;
  };
}

export interface LifeTimelineEvent {
  age: number;
  type: 'positive' | 'negative' | 'neutral' | 'turningPoint';
  description: string;
  impact: number; // -2 to 2
}

// ACEsスコアの計算
export function calculateACEScore(questionnaire: ACEsQuestionnaire): number {
  let score = 0;
  
  // Abuse (3項目)
  if (questionnaire.abuse.physical) score++;
  if (questionnaire.abuse.emotional) score++;
  if (questionnaire.abuse.sexual) score++;
  
  // Neglect (2項目)
  if (questionnaire.neglect.physical) score++;
  if (questionnaire.neglect.emotional) score++;
  
  // Household Dysfunction (5項目)
  if (questionnaire.householdDysfunction.substanceAbuse) score++;
  if (questionnaire.householdDysfunction.mentalIllness) score++;
  if (questionnaire.householdDysfunction.parentalSeparation) score++;
  if (questionnaire.householdDysfunction.domesticViolence) score++;
  if (questionnaire.householdDysfunction.criminalBehavior) score++;
  
  return score;
}

// トラウマレベルの判定
export function determineTraumaLevel(aceScore: number): LogsResult['traumaLevel'] {
  if (aceScore === 0) return 'low';
  if (aceScore <= 2) return 'moderate';
  if (aceScore <= 4) return 'high';
  return 'severe';
}

// ライフタイムラインから自己効力感を計算
export function calculateSelfEfficacy(events: LifeTimelineEvent[]): number {
  if (events.length === 0) return 0;
  
  const positiveEvents = events.filter(e => e.type === 'positive' || e.impact > 0);
  const negativeEvents = events.filter(e => e.type === 'negative' || e.impact < 0);
  const turningPoints = events.filter(e => e.type === 'turningPoint');
  
  const positiveRatio = positiveEvents.length / events.length;
  const negativeRatio = negativeEvents.length / events.length;
  const turningPointRatio = turningPoints.length / events.length;
  
  // ポジティブイベントが多い、転換点がある = 自己効力感が高い
  const efficacy = (positiveRatio - negativeRatio) * 2 + turningPointRatio;
  
  return Math.max(-2, Math.min(2, efficacy));
}

// レジリエンスの計算
export function calculateResilience(
  aceScore: number,
  events: LifeTimelineEvent[]
): number {
  const traumaLevel = determineTraumaLevel(aceScore);
  const selfEfficacy = calculateSelfEfficacy(events);
  
  // トラウマがあっても自己効力感が高い = レジリエンスが高い
  let resilience = 50; // ベースライン
  
  if (traumaLevel === 'low') {
    resilience += 20;
  } else if (traumaLevel === 'moderate') {
    resilience += 10;
  } else if (traumaLevel === 'high') {
    resilience -= 10;
  } else {
    resilience -= 20;
  }
  
  resilience += selfEfficacy * 15;
  
  return Math.max(0, Math.min(100, resilience));
}

// 統合Logsスコアの計算
export function calculateLogsScore(
  aceQuestionnaire: ACEsQuestionnaire,
  lifeEvents: LifeTimelineEvent[]
): LogsResult {
  const aceScore = calculateACEScore(aceQuestionnaire);
  const traumaLevel = determineTraumaLevel(aceScore);
  const selfEfficacy = calculateSelfEfficacy(lifeEvents);
  const resilience = calculateResilience(aceScore, lifeEvents);
  
  const positiveEvents = lifeEvents.filter(e => e.type === 'positive').length;
  const negativeEvents = lifeEvents.filter(e => e.type === 'negative').length;
  const turningPoints = lifeEvents.filter(e => e.type === 'turningPoint').length;
  
  return {
    aceScore,
    traumaLevel,
    selfEfficacy,
    resilience,
    lifeNarrative: {
      positiveEvents,
      negativeEvents,
      turningPoints,
    },
  };
}

