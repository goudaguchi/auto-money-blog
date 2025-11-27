export interface BiometricData {
  timeToFirstInteraction: number; // 画面表示から最初のアクションまでの時間（ms）
  timeToDecision: number; // 最終決定までの時間（ms）
  hoverDuration: { [choiceId: string]: number }; // 各選択肢のホバー時間（ms）
  clickCount: number; // 決定までにクリックした回数
  mouseDistance: number; // マウスの総移動距離（px）
}

export interface Choice {
  id: string;
  text: string;
  scores: {
    [key: string]: number;
  };
}

export interface Scene {
  id: string;
  text: string;
  choices: Choice[];
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  scenes: Scene[];
}

export interface DiagnosisScores {
  impulseControl: number;
  planning: number;
  riskTolerance: number;
  moneySense: number;
  selfControl: number;
  boundarySetting: number;
  selfAdvocacy: number;
  empathy: number;
  [key: string]: number;
}

export interface EpisodeResult {
  episodeId: string;
  sceneId: string;
  choiceId: string;
  biometricData: BiometricData;
  timestamp: number;
}

export interface DiagnosisResult {
  episodeResults: EpisodeResult[];
  finalScores: DiagnosisScores;
  osType?: string;
  recommendations?: string[];
}

// 5層診断システム用の型
export interface UnifiedDiagnosisData {
  // 各レイヤーのデータ（オプショナル、段階的に実装）
  hardware?: any;
  kernel?: any;
  driver?: any;
  application: DiagnosisScores; // 既存のApplication層
  logs?: any;
  
  // 統合結果
  unifiedResult?: any;
}

