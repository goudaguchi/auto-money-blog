'use client';

import { useState, useEffect, useRef } from 'react';

// ========================================
// 型定義
// ========================================
interface Choice {
  id: string;
  text: string;
  scores: Partial<DiagnosisScores>;
  instinctWeight?: number; // 本能的な選択度（高いほど自然な選択）
}

interface Scene {
  id: string;
  text: string;
  choices: Choice[];
}

interface Episode {
  id: string;
  title: string;
  description: string;
  targetParams: string[];
  scenes: Scene[];
}

interface MaskingScenario {
  id: string;
  situation: string;
  choices: { id: string; text: string; instinctScore: number }[];
}

interface EnergyActivity {
  id: string;
  name: string;
  category: 'social' | 'work' | 'rest' | 'creative' | 'physical';
}

interface BiometricData {
  timeToDecision: number;
  clickCount: number;
  choiceChanges: number;
}

interface SceneResult {
  episodeId: string;
  sceneId: string;
  choiceId: string;
  biometricData: BiometricData;
}

interface MaskingResult {
  scenarioId: string;
  instinctChoice: string;
  behaviorChoice: string;
  gap: number; // 乖離度
  responseTime: { instinct: number; behavior: number };
}

interface EnergyResult {
  charging: string[]; // 充電活動
  draining: string[]; // 消耗活動
  neutral: string[]; // 中立活動
}

interface CognitiveResult {
  baselineRT: number; // ベースライン反応時間
  switchCost: number; // 切り替えコスト
  accuracy: number; // 正答率
  errorAfterSwitch: number; // 切り替え後のエラー率
}

interface SensoryResult {
  sensoryOverload: number; // 感覚過敏度 (-3〜+3)
  emotionalAbsorption: number; // 情緒吸収度 (-3〜+3)
  stimulationSeeking: number; // 刺激追求度 (-3〜+3)
  executiveFunction: number; // 実行機能 (-3〜+3)
  socialCognition: number; // 社会的認知 (-3〜+3)
  neurotype: string; // 神経タイプの総合判定
}

// 神経多様性質問データ
interface NeurodiversityQuestion {
  id: string;
  text: string;
  category: 'sensory' | 'emotional' | 'stimulation' | 'executive' | 'social';
  reverseScore?: boolean; // trueなら高い選択肢ほど低スコア
}

interface DiagnosisScores {
  impulse: number;
  planning: number;
  empathy: number;
  risk: number;
  boundary: number;
  creation: number;
  money: number;
}

interface SystemSpec {
  cpu: { type: string; description: string };
  memory: { type: string; description: string };
  input: { type: string; description: string };
  cooling: { type: string; description: string };
  battery: { type: string; description: string };
  driver: { type: string; description: string };
}

// ========================================
// 擬態コストシナリオ（本音 vs 行動）
// ========================================
const MASKING_SCENARIOS: MaskingScenario[] = [
  {
    id: 'm1',
    situation: '職場の飲み会に誘われた。正直、今日は疲れていて一人で過ごしたい気分。',
    choices: [
      { id: 'c1', text: '「行きたくない」と正直に断る', instinctScore: 3 },
      { id: 'c2', text: '「用事がある」と嘘をついて断る', instinctScore: 1 },
      { id: 'c3', text: '少しだけ顔を出す', instinctScore: 0 },
      { id: 'c4', text: '疲れていても最後まで参加する', instinctScore: -2 },
    ],
  },
  {
    id: 'm2',
    situation: '会議中、上司の提案に明らかな問題点があると気づいた。',
    choices: [
      { id: 'c1', text: 'その場で率直に指摘する', instinctScore: 3 },
      { id: 'c2', text: '会議後に個別に伝える', instinctScore: 1 },
      { id: 'c3', text: '遠回しにやんわり言う', instinctScore: 0 },
      { id: 'c4', text: '何も言わずに従う', instinctScore: -2 },
    ],
  },
  {
    id: 'm3',
    situation: '友人から相談を受けているが、正直、今は自分のことで精一杯。',
    choices: [
      { id: 'c1', text: '「今は余裕がないから、また今度でいい？」と言う', instinctScore: 3 },
      { id: 'c2', text: '短時間だけ聞いて切り上げる', instinctScore: 1 },
      { id: 'c3', text: '自分のことは置いて、しっかり聞く', instinctScore: -1 },
      { id: 'c4', text: '何時間でも付き合う', instinctScore: -3 },
    ],
  },
  {
    id: 'm4',
    situation: '興味のない話題で盛り上がっているグループ。参加を求められている。',
    choices: [
      { id: 'c1', text: '「興味ないからいいや」と離れる', instinctScore: 3 },
      { id: 'c2', text: '聞いてるふりをしながらスマホを見る', instinctScore: 1 },
      { id: 'c3', text: '適当に相槌を打って参加する', instinctScore: -1 },
      { id: 'c4', text: '興味があるふりをして積極的に会話する', instinctScore: -3 },
    ],
  },
  {
    id: 'm5',
    situation: '予定が急に変更になった。本当は変更したくない。',
    choices: [
      { id: 'c1', text: '「変更は困る」とはっきり言う', instinctScore: 3 },
      { id: 'c2', text: '不満を表情に出しながら受け入れる', instinctScore: 1 },
      { id: 'c3', text: '内心イライラしながらも笑顔で対応', instinctScore: -2 },
      { id: 'c4', text: '「全然大丈夫！」と快く受け入れたふりをする', instinctScore: -3 },
    ],
  },
  {
    id: 'm6',
    situation: '自分の趣味や好きなことを聞かれた。でもちょっとマイナーで理解されにくい。',
    choices: [
      { id: 'c1', text: 'そのまま正直に話す', instinctScore: 3 },
      { id: 'c2', text: '少しマイルドに言い換えて話す', instinctScore: 1 },
      { id: 'c3', text: '「普通の趣味」を答える', instinctScore: -2 },
      { id: 'c4', text: '「特にないかな」とごまかす', instinctScore: -3 },
    ],
  },
];

// ========================================
// エネルギーマトリックス用アクティビティ
// ========================================
const ENERGY_ACTIVITIES: EnergyActivity[] = [
  { id: 'a1', name: '大人数の飲み会', category: 'social' },
  { id: 'a2', name: '親しい友人との1対1', category: 'social' },
  { id: 'a3', name: 'SNSを見る', category: 'rest' },
  { id: 'a4', name: '読書', category: 'rest' },
  { id: 'a5', name: '運動・散歩', category: 'physical' },
  { id: 'a6', name: '創作活動（絵、文章など）', category: 'creative' },
  { id: 'a7', name: 'ゲーム', category: 'rest' },
  { id: 'a8', name: '会議・ミーティング', category: 'work' },
  { id: 'a9', name: '一人で黙々と作業', category: 'work' },
  { id: 'a10', name: '電話対応', category: 'work' },
  { id: 'a11', name: '睡眠', category: 'rest' },
  { id: 'a12', name: '新しい人との出会い', category: 'social' },
  { id: 'a13', name: '料理', category: 'creative' },
  { id: 'a14', name: '掃除・片付け', category: 'physical' },
  { id: 'a15', name: '音楽を聴く', category: 'rest' },
  { id: 'a16', name: 'マルチタスク', category: 'work' },
];

// ========================================
// 神経多様性質問（感覚・情緒・刺激・実行機能・社会性）
// ========================================
const NEURODIVERSITY_QUESTIONS: NeurodiversityQuestion[] = [
  // 感覚過敏（sensory）- HSP/ASD関連
  { id: 'n1', text: '蛍光灯や強い日光の下にいると、頭が痛くなったり疲れたりすることがある', category: 'sensory' },
  { id: 'n2', text: 'カフェや人混みの中では、周囲の会話や雑音が気になって集中できない', category: 'sensory' },
  { id: 'n3', text: '服のタグや素材が肌に当たると、気になって仕方がない', category: 'sensory' },
  { id: 'n4', text: '特定の匂い（香水、洗剤など）が苦手で、体調が悪くなることがある', category: 'sensory' },
  
  // 情緒吸収（emotional）- HSP/共感性関連
  { id: 'n5', text: '他人の機嫌や感情に、自分の気分が大きく左右される', category: 'emotional' },
  { id: 'n6', text: '映画やドラマで悲しいシーンを見ると、自分も泣いてしまうことが多い', category: 'emotional' },
  { id: 'n7', text: '相手が怒っていなくても「怒ってる？」と確認したくなる', category: 'emotional' },
  { id: 'n8', text: '人から批判されると、かなり長い間引きずってしまう', category: 'emotional' },
  
  // 刺激追求（stimulation）- HSS/ADHD関連
  { id: 'n9', text: '同じルーティンを続けていると、退屈で耐えられなくなる', category: 'stimulation' },
  { id: 'n10', text: '新しい体験やスリルを求めて、リスクを取ることがある', category: 'stimulation' },
  { id: 'n11', text: '興味を持つと、寝食を忘れて没頭してしまう', category: 'stimulation' },
  { id: 'n12', text: '「やめておいた方がいい」と言われると、逆にやりたくなる', category: 'stimulation' },
  
  // 実行機能（executive）- ADHD関連
  { id: 'n13', text: 'やらなきゃいけないことがあっても、直前まで手をつけられない', category: 'executive' },
  { id: 'n14', text: '部屋が散らかっていても、片付けを始めるのが億劫', category: 'executive' },
  { id: 'n15', text: '話している途中で別のことを思いつき、脱線してしまう', category: 'executive' },
  { id: 'n16', text: '時間の見積もりが苦手で、遅刻しがち・早すぎたりする', category: 'executive' },
  
  // 社会的認知（social）- ASD関連
  { id: 'n17', text: '「空気を読め」と言われても、何を読めばいいかわからないことがある', category: 'social' },
  { id: 'n18', text: '冗談や皮肉を言われても、本気なのか冗談なのかわからないことがある', category: 'social' },
  { id: 'n19', text: '興味のある話題になると、一方的に話しすぎてしまうことがある', category: 'social' },
  { id: 'n20', text: '暗黙のルールや「普通はこうする」がわからず、後から指摘されることがある', category: 'social' },
];

// ========================================
// ストーリー診断エピソード（既存を簡略化）
// ========================================
const STORY_EPISODES: Episode[] = [
  {
    id: 'ep1',
    title: '締切の夜',
    description: '明日が締切の重要な仕事がある夜。',
    targetParams: ['impulse', 'planning'],
    scenes: [
      {
        id: 's1',
        text: '明日が締切のプロジェクト。残り作業は3時間分。今は夜8時。友達から「今から飲みに行かない？」と誘いが来た。',
        choices: [
          { id: 'c1', text: '断って仕事に集中する', scores: { impulse: -2, planning: 3 } },
          { id: 'c2', text: '1時間だけ行って帰る', scores: { impulse: 1, planning: 0 } },
          { id: 'c3', text: '行く！徹夜すれば間に合う', scores: { impulse: 3, planning: -2 } },
        ],
      },
    ],
  },
  {
    id: 'ep2',
    title: '給料日の誘惑',
    description: '給料日、欲しいものがセール中。',
    targetParams: ['money', 'impulse'],
    scenes: [
      {
        id: 's1',
        text: 'ずっと欲しかったものが50%オフ。でも今月は予算が厳しい。',
        choices: [
          { id: 'c1', text: '我慢する', scores: { money: 3, impulse: -2 } },
          { id: 'c2', text: '一晩考える', scores: { money: 1, impulse: 0 } },
          { id: 'c3', text: '即購入する', scores: { money: -3, impulse: 3 } },
        ],
      },
    ],
  },
  {
    id: 'ep3',
    title: '断りづらい頼み事',
    description: '疲れている時の頼み事。',
    targetParams: ['boundary', 'empathy'],
    scenes: [
      {
        id: 's1',
        text: '疲れている日に友達から「明日引っ越し手伝って」と頼まれた。',
        choices: [
          { id: 'c1', text: '断る', scores: { boundary: 3, empathy: 0 } },
          { id: 'c2', text: '条件付きで引き受ける', scores: { boundary: 1, empathy: 1 } },
          { id: 'c3', text: '引き受ける', scores: { boundary: -2, empathy: 2 } },
        ],
      },
    ],
  },
  {
    id: 'ep4',
    title: '創作の衝動',
    description: 'アイデアが降りてきた深夜。',
    targetParams: ['creation', 'planning'],
    scenes: [
      {
        id: 's1',
        text: '深夜2時。明日は仕事だけど、すごいアイデアが浮かんだ。',
        choices: [
          { id: 'c1', text: 'メモして寝る', scores: { creation: 0, planning: 3 } },
          { id: 'c2', text: '1時間だけ作業する', scores: { creation: 2, planning: 0 } },
          { id: 'c3', text: '朝まで没頭する', scores: { creation: 3, planning: -3 } },
        ],
      },
    ],
  },
  {
    id: 'ep5',
    title: '人生の選択',
    description: '安定か挑戦か。',
    targetParams: ['risk', 'creation'],
    scenes: [
      {
        id: 's1',
        text: '安定した仕事を続けるか、やりたいことに挑戦するか迷っている。',
        choices: [
          { id: 'c1', text: '安定を選ぶ', scores: { risk: -3, creation: -2 } },
          { id: 'c2', text: '副業から始める', scores: { risk: 1, creation: 1 } },
          { id: 'c3', text: '飛び込む', scores: { risk: 3, creation: 3 } },
        ],
      },
    ],
  },
];

// ========================================
// 診断ロジック
// ========================================
function calculateStoryScores(results: SceneResult[]): DiagnosisScores {
  const scores: DiagnosisScores = {
    impulse: 0, planning: 0, empathy: 0,
    risk: 0, boundary: 0, creation: 0, money: 0,
  };

  results.forEach((result) => {
    const episode = STORY_EPISODES.find((ep) => ep.id === result.episodeId);
    if (!episode) return;
    const scene = episode.scenes.find((s) => s.id === result.sceneId);
    if (!scene) return;
    const choice = scene.choices.find((c) => c.id === result.choiceId);
    if (!choice) return;

    Object.entries(choice.scores).forEach(([key, value]) => {
      if (key in scores && value !== undefined) {
        scores[key as keyof DiagnosisScores] += value;
      }
    });
  });

  return scores;
}

function calculateMaskingCost(results: MaskingResult[]): { totalGap: number; avgGap: number; exhaustionLevel: string } {
  if (results.length === 0) return { totalGap: 0, avgGap: 0, exhaustionLevel: '未測定' };

  const totalGap = results.reduce((sum, r) => sum + Math.abs(r.gap), 0);
  const avgGap = totalGap / results.length;

  let exhaustionLevel = '低い';
  if (avgGap >= 4) exhaustionLevel = '非常に高い';
  else if (avgGap >= 3) exhaustionLevel = '高い';
  else if (avgGap >= 2) exhaustionLevel = '中程度';

  return { totalGap, avgGap, exhaustionLevel };
}

function generateSystemSpec(
  scores: DiagnosisScores,
  maskingCost: { avgGap: number; exhaustionLevel: string },
  energyResult: EnergyResult,
  cognitiveResult: CognitiveResult | null,
  sensoryResult: SensoryResult | null
): SystemSpec {
  // CPU（認知切り替え能力を反映）
  let cpuType = 'バランス型プロセッサ';
  let cpuDesc = '安定した処理能力';
  
  // 認知テスト結果に基づくCPU判定
  if (cognitiveResult && cognitiveResult.switchCost >= 600) {
    cpuType = 'シングルスレッド特化プロセッサ';
    cpuDesc = '過集中モード搭載 / コンテキストスイッチに時間がかかる';
  } else if (cognitiveResult && cognitiveResult.switchCost < 200) {
    cpuType = 'マルチスレッドプロセッサ';
    cpuDesc = '高速コンテキストスイッチ / 並列処理向き';
  } else if (scores.creation >= 3 && scores.planning <= -1) {
    cpuType = 'バースト型プロセッサ';
    cpuDesc = '瞬間火力重視 / クールダウン必要';
  } else if (scores.planning >= 3) {
    cpuType = 'マルチコアプロセッサ';
    cpuDesc = '計画的な並列処理が得意';
  } else if (scores.impulse >= 3) {
    cpuType = '高クロックプロセッサ';
    cpuDesc = '瞬発力特化 / 発熱注意';
  }

  // Memory
  let memoryType = '標準メモリ';
  let memoryDesc = '通常容量';
  if (maskingCost.avgGap >= 3) {
    memoryType = 'メモリ圧迫状態';
    memoryDesc = `"常識人エミュレーター"が常駐（${Math.round(maskingCost.avgGap * 15)}%占有）`;
  }

  // Input（神経多様性テスト結果に基づく）
  let inputType = '標準入力システム';
  let inputDesc = '通常の感度';
  if (sensoryResult) {
    if (sensoryResult.sensoryOverload >= 2) {
      inputType = '高感度センサー（過敏型）';
      inputDesc = `感覚フィルタが繊細 / 過負荷に注意`;
    } else if (sensoryResult.sensoryOverload >= 1) {
      inputType = 'やや高感度センサー';
      inputDesc = '刺激に反応しやすい傾向';
    }
    
    // 神経タイプも反映
    if (sensoryResult.neurotype.includes('HSS型HSP')) {
      inputType = 'ハイブリッドセンサー（HSS型HSP）';
      inputDesc = '高感度 + 刺激追求 / エネルギー管理が重要';
    }
  }

  // Cooling
  let coolingType = '標準冷却システム';
  let coolingDesc = '通常の感情制御';
  if (scores.impulse >= 3 && scores.boundary <= -2) {
    coolingType = '冷却機能不全';
    coolingDesc = '感情が熱暴走しやすい';
  } else if (scores.empathy >= 3 && scores.boundary <= -2) {
    coolingType = '放熱過多';
    coolingDesc = '他者に熱を奪われやすい';
  }

  // Battery
  const chargingCount = energyResult.charging.length;
  const drainingCount = energyResult.draining.length;
  let batteryType = 'バランス型バッテリー';
  let batteryDesc = '標準的な充放電';
  if (drainingCount > chargingCount * 1.5) {
    batteryType = '消耗激しいバッテリー';
    batteryDesc = '放電が多い / 充電ポイントの確保が重要';
  } else if (chargingCount > drainingCount * 1.5) {
    batteryType = '高効率バッテリー';
    batteryDesc = '回復手段が豊富';
  }

  // Driver
  let driverType = '標準ドライバ';
  let driverDesc = '自然な振る舞い';
  if (maskingCost.avgGap >= 3) {
    driverType = `"社会人エミュレーター v${maskingCost.avgGap.toFixed(1)}"`;
    driverDesc = '高負荷で常駐 / 定期的なリブート推奨';
  }

  return {
    cpu: { type: cpuType, description: cpuDesc },
    memory: { type: memoryType, description: memoryDesc },
    input: { type: inputType, description: inputDesc },
    cooling: { type: coolingType, description: coolingDesc },
    battery: { type: batteryType, description: batteryDesc },
    driver: { type: driverType, description: driverDesc },
  };
}

// ========================================
// メインコンポーネント
// ========================================
export default function OSDiagnosisPage() {
  // フェーズ管理
  const [phase, setPhase] = useState<
    'intro' | 'masking' | 'energy' | 'cognitive' | 'sensory' | 'story' | 'result'
  >('intro');

  // 各テストの状態
  const [maskingIndex, setMaskingIndex] = useState(0);
  const [maskingMode, setMaskingMode] = useState<'instinct' | 'behavior'>('instinct');
  const [maskingResults, setMaskingResults] = useState<MaskingResult[]>([]);
  const [currentInstinctChoice, setCurrentInstinctChoice] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const [energyResult, setEnergyResult] = useState<EnergyResult>({ charging: [], draining: [], neutral: [] });
  const [draggedActivity, setDraggedActivity] = useState<string | null>(null);

  const [cognitiveResult, setCognitiveResult] = useState<CognitiveResult | null>(null);
  const [sensoryResult, setSensoryResult] = useState<SensoryResult | null>(null);

  // 神経多様性テスト用の状態
  const [neuroQuestionIndex, setNeuroQuestionIndex] = useState(0);
  const [neuroResponses, setNeuroResponses] = useState<{ questionId: string; category: string; score: number }[]>([]);

  // Cognitive Switching用の状態
  const [cognitiveTrials, setCognitiveTrials] = useState<{
    color: string;
    word: string;
    rule: 'match' | 'mismatch';
    isSwitch: boolean;
  }[]>([]);
  const [cognitiveIndex, setCognitiveIndex] = useState(0);
  const [cognitiveResponses, setCognitiveResponses] = useState<{
    correct: boolean;
    rt: number;
    isSwitch: boolean;
  }[]>([]);
  const [showCognitiveStimulus, setShowCognitiveStimulus] = useState(false);
  const [cognitiveRule, setCognitiveRule] = useState<'match' | 'mismatch'>('match');
  const [showRuleChange, setShowRuleChange] = useState(false);

  const [storyIndex, setStoryIndex] = useState(0);
  const [storyResults, setStoryResults] = useState<SceneResult[]>([]);

  const [finalResult, setFinalResult] = useState<{
    scores: DiagnosisScores;
    maskingCost: { totalGap: number; avgGap: number; exhaustionLevel: string };
    energyResult: EnergyResult;
    systemSpec: SystemSpec;
  } | null>(null);

  // 計測用
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
  }, [phase, maskingIndex, maskingMode, storyIndex]);

  // ========== Cognitive Test生成 ==========
  const generateCognitiveTrials = () => {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const colorNames: Record<string, string> = {
      red: 'あか', blue: 'あお', green: 'みどり', yellow: 'きいろ'
    };
    const trials: typeof cognitiveTrials = [];
    
    // Phase 1: 最初のルール（一致を選ぶ）- 8試行
    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isMatch = Math.random() > 0.5;
      const word = isMatch ? colorNames[color] : colorNames[colors.filter(c => c !== color)[Math.floor(Math.random() * 3)]];
      trials.push({ color, word, rule: 'match', isSwitch: false });
    }
    
    // Phase 2: ルール切り替え（不一致を選ぶ）- 8試行
    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isMatch = Math.random() > 0.5;
      const word = isMatch ? colorNames[color] : colorNames[colors.filter(c => c !== color)[Math.floor(Math.random() * 3)]];
      trials.push({ color, word, rule: 'mismatch', isSwitch: i === 0 });
    }
    
    return trials;
  };

  // ========== ハンドラー ==========
  const handleStart = () => {
    setPhase('masking');
    setMaskingIndex(0);
    setMaskingMode('instinct');
    setMaskingResults([]);
    setEnergyResult({ charging: [], draining: [], neutral: [] });
    setStoryResults([]);
    setFinalResult(null);
    setCognitiveTrials([]);
    setCognitiveIndex(0);
    setCognitiveResponses([]);
    setCognitiveResult(null);
  };

  const handleMaskingChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  const handleMaskingConfirm = () => {
    if (!selectedChoice) return;

    const scenario = MASKING_SCENARIOS[maskingIndex];
    const responseTime = Date.now() - startTime.current;

    if (maskingMode === 'instinct') {
      setCurrentInstinctChoice(selectedChoice);
      setMaskingMode('behavior');
      setSelectedChoice(null);
    } else {
      // 乖離度を計算
      const instinctScore = scenario.choices.find(c => c.id === currentInstinctChoice)?.instinctScore || 0;
      const behaviorScore = scenario.choices.find(c => c.id === selectedChoice)?.instinctScore || 0;
      const gap = instinctScore - behaviorScore;

      setMaskingResults(prev => [...prev, {
        scenarioId: scenario.id,
        instinctChoice: currentInstinctChoice!,
        behaviorChoice: selectedChoice,
        gap,
        responseTime: { instinct: responseTime, behavior: responseTime },
      }]);

      if (maskingIndex < MASKING_SCENARIOS.length - 1) {
        setMaskingIndex(maskingIndex + 1);
        setMaskingMode('instinct');
        setCurrentInstinctChoice(null);
        setSelectedChoice(null);
      } else {
        // 認知テストへ
        const trials = generateCognitiveTrials();
        setCognitiveTrials(trials);
        setCognitiveIndex(0);
        setCognitiveResponses([]);
        setCognitiveRule('match');
        setShowRuleChange(false);
        setPhase('cognitive');
      }
    }
  };

  // Cognitive Test ハンドラー
  const handleCognitiveStart = () => {
    setShowCognitiveStimulus(true);
    startTime.current = Date.now();
  };

  const handleCognitiveResponse = (response: 'match' | 'mismatch') => {
    if (!showCognitiveStimulus) return;
    
    const trial = cognitiveTrials[cognitiveIndex];
    const rt = Date.now() - startTime.current;
    
    // 正解判定
    const colorNames: Record<string, string> = {
      red: 'あか', blue: 'あお', green: 'みどり', yellow: 'きいろ'
    };
    const isActualMatch = colorNames[trial.color] === trial.word;
    
    let correct = false;
    if (trial.rule === 'match') {
      // matchルール: 一致していたら「一致」を押す
      correct = (response === 'match') === isActualMatch;
    } else {
      // mismatchルール: 一致していたら「不一致」を押す（逆）
      correct = (response === 'mismatch') === isActualMatch;
    }
    
    setCognitiveResponses(prev => [...prev, { correct, rt, isSwitch: trial.isSwitch }]);
    setShowCognitiveStimulus(false);
    
    // 次の試行へ
    if (cognitiveIndex < cognitiveTrials.length - 1) {
      const nextTrial = cognitiveTrials[cognitiveIndex + 1];
      
      // ルール切り替えチェック
      if (nextTrial.isSwitch) {
        setShowRuleChange(true);
        setCognitiveRule('mismatch');
        setTimeout(() => {
          setShowRuleChange(false);
          setCognitiveIndex(cognitiveIndex + 1);
          setTimeout(() => {
            setShowCognitiveStimulus(true);
            startTime.current = Date.now();
          }, 500);
        }, 3000);
      } else {
        setCognitiveIndex(cognitiveIndex + 1);
        setTimeout(() => {
          setShowCognitiveStimulus(true);
          startTime.current = Date.now();
        }, 500);
      }
    } else {
      // 認知テスト完了
      const allResponses = [...cognitiveResponses, { correct, rt, isSwitch: trial.isSwitch }];
      const normalTrials = allResponses.filter(r => !r.isSwitch);
      const switchTrials = allResponses.filter(r => r.isSwitch);
      
      const baselineRT = normalTrials.length > 0 
        ? normalTrials.reduce((sum, r) => sum + r.rt, 0) / normalTrials.length 
        : 0;
      const switchRT = switchTrials.length > 0 
        ? switchTrials.reduce((sum, r) => sum + r.rt, 0) / switchTrials.length 
        : 0;
      const switchCost = switchRT - baselineRT;
      const accuracy = allResponses.filter(r => r.correct).length / allResponses.length;
      const errorAfterSwitch = switchTrials.length > 0 
        ? switchTrials.filter(r => !r.correct).length / switchTrials.length 
        : 0;
      
      setCognitiveResult({ baselineRT, switchCost, accuracy, errorAfterSwitch });
      setPhase('energy');
    }
  };

  const handleEnergyDrop = (zone: 'charging' | 'draining' | 'neutral') => {
    if (!draggedActivity) return;
    
    setEnergyResult(prev => {
      const newResult = { ...prev };
      // 他のゾーンから削除
      newResult.charging = newResult.charging.filter(id => id !== draggedActivity);
      newResult.draining = newResult.draining.filter(id => id !== draggedActivity);
      newResult.neutral = newResult.neutral.filter(id => id !== draggedActivity);
      // 新しいゾーンに追加
      newResult[zone] = [...newResult[zone], draggedActivity];
      return newResult;
    });
    setDraggedActivity(null);
  };

  const handleEnergyComplete = () => {
    // 未分類のアイテムをneutralに
    const classified = [...energyResult.charging, ...energyResult.draining, ...energyResult.neutral];
    const unclassified = ENERGY_ACTIVITIES.filter(a => !classified.includes(a.id)).map(a => a.id);
    setEnergyResult(prev => ({
      ...prev,
      neutral: [...prev.neutral, ...unclassified]
    }));
    // 神経多様性テストへ
    setNeuroQuestionIndex(0);
    setNeuroResponses([]);
    setPhase('sensory');
  };

  // 神経多様性テスト ハンドラー
  const handleNeuroResponse = (score: number) => {
    const question = NEURODIVERSITY_QUESTIONS[neuroQuestionIndex];
    
    setNeuroResponses(prev => [...prev, {
      questionId: question.id,
      category: question.category,
      score: question.reverseScore ? -score : score
    }]);
    
    if (neuroQuestionIndex < NEURODIVERSITY_QUESTIONS.length - 1) {
      setNeuroQuestionIndex(neuroQuestionIndex + 1);
    } else {
      // 全質問完了 - 結果を計算
      const allResponses = [...neuroResponses, {
        questionId: question.id,
        category: question.category,
        score: question.reverseScore ? -score : score
      }];
      
      // カテゴリごとの平均スコアを計算
      const calculateCategoryScore = (category: string) => {
        const categoryResponses = allResponses.filter(r => r.category === category);
        if (categoryResponses.length === 0) return 0;
        return categoryResponses.reduce((sum, r) => sum + r.score, 0) / categoryResponses.length;
      };
      
      const sensoryScore = calculateCategoryScore('sensory');
      const emotionalScore = calculateCategoryScore('emotional');
      const stimulationScore = calculateCategoryScore('stimulation');
      const executiveScore = calculateCategoryScore('executive');
      const socialScore = calculateCategoryScore('social');
      
      // ========================================
      // 拡張版：神経タイプの詳細判定（15種類以上）
      // ========================================
      let neurotype = 'ニューロティピカル（定型発達）';
      
      // 判定用フラグ
      const hasHSP = sensoryScore >= 1.5 && emotionalScore >= 1.5;
      const hasHSS = stimulationScore >= 1.5;
      const hasADHD_inattention = executiveScore >= 1.5;
      const hasADHD_hyperactive = stimulationScore >= 1.5 && executiveScore >= 1;
      const hasASD = socialScore >= 1.5;
      const hasSensory = sensoryScore >= 1.5;
      const hasHighEmpathy = emotionalScore >= 1.5;
      
      // ========================================
      // 複合型（最も優先度が高い）
      // ========================================
      
      // AuDHD（ASD + ADHD）- 実は非常に多い組み合わせ
      if (hasASD && (hasADHD_inattention || hasADHD_hyperactive)) {
        if (hasHSP) {
          neurotype = 'AuDHD + HSP（複合型神経多様性）';
        } else if (hasADHD_inattention && hasADHD_hyperactive) {
          neurotype = 'AuDHD - 混合型（ASD + ADHD混合）';
        } else if (hasADHD_inattention) {
          neurotype = 'AuDHD - 不注意優勢（ASD + ADHD不注意）';
        } else {
          neurotype = 'AuDHD - 多動優勢（ASD + ADHD多動）';
        }
      }
      // HSP + ADHD
      else if (hasHSP && (hasADHD_inattention || hasADHD_hyperactive)) {
        if (hasHSS) {
          neurotype = 'HSS型HSP + ADHD（高感受性×刺激追求×注意特性）';
        } else if (hasADHD_inattention && !hasADHD_hyperactive) {
          neurotype = 'HSP + ADHD不注意型（繊細×集中困難）';
        } else {
          neurotype = 'HSP + ADHD混合型（繊細×衝動性）';
        }
      }
      // HSP + ASD
      else if (hasHSP && hasASD) {
        neurotype = 'HSP + ASD傾向（高感受性×社会的認知特性）';
      }
      
      // ========================================
      // ADHD系（単体）
      // ========================================
      else if (hasADHD_inattention || hasADHD_hyperactive) {
        if (hasADHD_inattention && hasADHD_hyperactive) {
          neurotype = 'ADHD - 混合型（不注意 + 多動・衝動）';
        } else if (hasADHD_inattention && stimulationScore < 1) {
          neurotype = 'ADHD - 不注意優勢型（ADD傾向）';
        } else if (hasADHD_hyperactive && executiveScore < 1.5) {
          neurotype = 'ADHD - 多動・衝動優勢型';
        } else if (hasADHD_inattention) {
          neurotype = 'ADHD - 不注意優勢型';
        } else {
          neurotype = 'ADHD傾向（実行機能の課題）';
        }
      }
      
      // ========================================
      // ASD系（単体）
      // ========================================
      else if (hasASD) {
        if (hasSensory && socialScore >= 2) {
          neurotype = 'ASD（自閉スペクトラム - 感覚過敏併存）';
        } else if (socialScore >= 2) {
          neurotype = 'ASD（自閉スペクトラム）';
        } else if (hasSensory) {
          neurotype = 'ASD傾向（社会的認知 + 感覚特性）';
        } else {
          neurotype = 'アスペルガー傾向（社会的認知特性）';
        }
      }
      
      // ========================================
      // HSP系（単体）
      // ========================================
      else if (hasHSP) {
        if (hasHSS) {
          neurotype = 'HSS型HSP（刺激追求型・高感受性）';
        } else if (stimulationScore >= 1 && stimulationScore < 1.5) {
          neurotype = 'HSE（外向型HSP）';
        } else if (stimulationScore < 0.5) {
          neurotype = 'HSP - 内向型（繊細×内省的）';
        } else {
          neurotype = 'HSP（Highly Sensitive Person）';
        }
      }
      
      // ========================================
      // 単一特性
      // ========================================
      else if (hasSensory && !hasHighEmpathy) {
        neurotype = '感覚処理感受性（SPS）- 感覚過敏型';
      }
      else if (hasHighEmpathy && !hasSensory) {
        neurotype = 'エンパス傾向（高共感性）';
      }
      else if (hasHSS && !hasADHD_inattention) {
        neurotype = '刺激追求型（High Sensation Seeker）';
      }
      
      // ========================================
      // 軽度の特性がある場合
      // ========================================
      else if (sensoryScore >= 1 || emotionalScore >= 1 || executiveScore >= 1 || socialScore >= 1) {
        const mildTraits: string[] = [];
        if (sensoryScore >= 1) mildTraits.push('感覚敏感');
        if (emotionalScore >= 1) mildTraits.push('共感的');
        if (stimulationScore >= 1) mildTraits.push('活動的');
        if (executiveScore >= 1) mildTraits.push('マイペース');
        if (socialScore >= 1) mildTraits.push('独自路線');
        
        if (mildTraits.length > 0) {
          neurotype = `ニューロティピカル（${mildTraits.join('・')}傾向）`;
        }
      }
      
      // デフォルト: 定型発達
      // neurotype = 'ニューロティピカル（定型発達）' は初期値
      
      setSensoryResult({
        sensoryOverload: sensoryScore,
        emotionalAbsorption: emotionalScore,
        stimulationSeeking: stimulationScore,
        executiveFunction: executiveScore,
        socialCognition: socialScore,
        neurotype
      });
      
      setPhase('story');
    }
  };

  const handleStoryChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  const handleStoryConfirm = () => {
    if (!selectedChoice) return;

    const episode = STORY_EPISODES[storyIndex];
    const result: SceneResult = {
      episodeId: episode.id,
      sceneId: episode.scenes[0].id,
      choiceId: selectedChoice,
      biometricData: {
        timeToDecision: Date.now() - startTime.current,
        clickCount: 1,
        choiceChanges: 0,
      },
    };

    const newResults = [...storyResults, result];
    setStoryResults(newResults);

    if (storyIndex < STORY_EPISODES.length - 1) {
      setStoryIndex(storyIndex + 1);
      setSelectedChoice(null);
    } else {
      // 最終結果を計算
      const scores = calculateStoryScores(newResults);
      const maskingCost = calculateMaskingCost(maskingResults);
      const systemSpec = generateSystemSpec(scores, maskingCost, energyResult, cognitiveResult, sensoryResult);
      setFinalResult({ scores, maskingCost, energyResult, systemSpec });
      setPhase('result');
    }
  };

  // ========== レンダリング ==========

  // イントロ画面
  if (phase === 'intro') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-stone-100">
              自己OS診断
            </h1>
            <p className="text-lg text-stone-400 mb-2">あなたという人間の「取扱説明書」を作る</p>
            <p className="text-teal-400/80 text-sm">正解はありません。感じたままに答えてください。</p>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
            <h2 className="text-lg font-medium mb-4 text-stone-300">これから測定すること</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-xs font-medium shrink-0">1</span>
                <div>
                  <p className="font-medium text-stone-200">擬態コスト</p>
                  <p className="text-sm text-stone-500">本音と行動のギャップ</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-xs font-medium shrink-0">2</span>
                <div>
                  <p className="font-medium text-stone-200">認知の切り替え</p>
                  <p className="text-sm text-stone-500">脳の柔軟性と過集中傾向</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-xs font-medium shrink-0">3</span>
                <div>
                  <p className="font-medium text-stone-200">エネルギー収支</p>
                  <p className="text-sm text-stone-500">何で回復し、何で消耗するか</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-xs font-medium shrink-0">4</span>
                <div>
                  <p className="font-medium text-stone-200">神経の特性</p>
                  <p className="text-sm text-stone-500">感覚・情緒・実行機能の傾向</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-xs font-medium shrink-0">5</span>
                <div>
                  <p className="font-medium text-stone-200">行動パターン</p>
                  <p className="text-sm text-stone-500">7つの軸での傾向</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 mb-8 border border-stone-700/50">
            <h2 className="text-lg font-medium mb-4 text-stone-300">最終的に生成されるもの</h2>
            <div className="bg-slate-950/50 rounded-xl p-4 font-mono text-sm text-stone-400">
              <p className="text-stone-600">// あなたの取扱説明書</p>
              <p><span className="text-teal-500/70">CPU:</span> <span className="text-stone-500">処理の特性</span></p>
              <p><span className="text-teal-500/70">Memory:</span> <span className="text-stone-500">メモリの状態</span></p>
              <p><span className="text-teal-500/70">Input:</span> <span className="text-stone-500">感覚の入力</span></p>
              <p><span className="text-teal-500/70">Cooling:</span> <span className="text-stone-500">感情の制御</span></p>
              <p><span className="text-teal-500/70">Battery:</span> <span className="text-stone-500">エネルギー管理</span></p>
              <p><span className="text-teal-500/70">Driver:</span> <span className="text-stone-500">常駐プログラム</span></p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all font-medium text-lg"
            >
              静かに始める
            </button>
            <p className="text-stone-600 text-sm mt-4">約10〜15分 / 一人で、落ち着ける環境で</p>
          </div>
        </div>
      </main>
    );
  }

  // 擬態コスト測定
  if (phase === 'masking') {
    const scenario = MASKING_SCENARIOS[maskingIndex];
    const progress = ((maskingIndex + (maskingMode === 'behavior' ? 0.5 : 0)) / MASKING_SCENARIOS.length) * 100;

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>擬態コスト</span>
              <span>{maskingIndex + 1} / {MASKING_SCENARIOS.length}</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600/70 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 mb-6">
            <div className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
              maskingMode === 'instinct' ? 'bg-amber-900/50 text-amber-400/90' : 'bg-stone-700/50 text-stone-400'
            }`}>
              {maskingMode === 'instinct' ? '本音では？' : '実際には？'}
            </div>

            <p className="text-lg mb-6 leading-relaxed text-stone-200">{scenario.situation}</p>

            <p className="text-sm text-stone-500 mb-4">
              {maskingMode === 'instinct' 
                ? '誰にも見られていないとしたら、どうしたい？' 
                : '社会的な制約を考慮して、実際はどうする？'}
            </p>

            <div className="space-y-3">
              {scenario.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleMaskingChoice(choice.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedChoice === choice.id
                      ? 'border-teal-500/50 bg-teal-900/30 text-stone-100'
                      : 'border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/30 text-stone-300'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>

            {selectedChoice && (
              <button
                onClick={handleMaskingConfirm}
                className="w-full mt-6 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all font-medium"
              >
                次へ
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 認知切り替えテスト
  if (phase === 'cognitive') {
    const trial = cognitiveTrials[cognitiveIndex];
    const progress = cognitiveTrials.length > 0 ? (cognitiveIndex / cognitiveTrials.length) * 100 : 0;

    const colorStyles: Record<string, string> = {
      red: 'text-red-500',
      blue: 'text-blue-500',
      green: 'text-green-500',
      yellow: 'text-yellow-400',
    };

    // ルール変更画面
    if (showRuleChange) {
      return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 flex items-center justify-center">
          <div className="max-w-xl mx-auto px-4 text-center">
            <div className="bg-orange-500/20 border-2 border-orange-500 rounded-2xl p-8 animate-pulse">
              <p className="text-4xl mb-4">⚠️</p>
              <h2 className="text-2xl font-bold mb-4 text-orange-400">ルール変更！</h2>
              <p className="text-lg mb-4">これからは<span className="font-bold text-orange-300">「不一致」</span>を選んでください</p>
              <p className="text-gray-400">色と文字が<span className="underline">一致していたら</span>→「不一致」ボタン</p>
              <p className="text-gray-400">色と文字が<span className="underline">違っていたら</span>→「一致」ボタン</p>
            </div>
          </div>
        </main>
      );
    }

    // 開始前の説明画面
    if (!showCognitiveStimulus && cognitiveIndex === 0 && cognitiveResponses.length === 0) {
      return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">🧠 認知切り替えテスト</h1>
              <p className="text-gray-400">脳の「切り替え能力」を測定します</p>
            </div>

            <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
              <h2 className="text-xl font-semibold mb-4 text-teal-400/80">ルール説明</h2>
              <div className="space-y-4 text-gray-300">
                <p>色のついた文字が表示されます。</p>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-center mb-2">例: <span className="text-red-500 text-2xl font-bold">あお</span></p>
                  <p className="text-sm text-gray-400 text-center">↑ 赤色で「あお」と書いてある（色と文字が不一致）</p>
                </div>
                <p><span className="text-teal-400/80 font-bold">最初のルール：</span>色と文字が<span className="underline">一致していたら</span>「一致」ボタン、<span className="underline">違っていたら</span>「不一致」ボタンを押してください。</p>
                <p className="text-orange-300">⚠️ 途中でルールが変わります！</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleCognitiveStart}
                className="px-12 py-4 bg-teal-600/70 text-white rounded-xl hover:bg-teal-500 transition-all font-bold text-xl"
              >
                テスト開始
              </button>
            </div>
          </div>
        </main>
      );
    }

    // テスト画面
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>認知切り替えテスト</span>
              <span>{cognitiveIndex + 1} / {cognitiveTrials.length}</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600/70 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm ${
              cognitiveRule === 'match' ? 'bg-cyan-500/30 text-teal-400/80' : 'bg-orange-500/30 text-orange-300'
            }`}>
              現在のルール: {cognitiveRule === 'match' ? '一致を選ぶ' : '不一致を選ぶ（逆！）'}
            </span>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-8 border border-stone-700/50 mb-6">
            {showCognitiveStimulus && trial ? (
              <div className="text-center">
                <p className={`text-6xl md:text-8xl font-bold mb-8 ${colorStyles[trial.color]}`}>
                  {trial.word}
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  {cognitiveRule === 'match' 
                    ? '色と文字が一致していたら「一致」、違っていたら「不一致」'
                    : '色と文字が一致していたら「不一致」、違っていたら「一致」'}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleCognitiveResponse('match')}
                    className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-xl transition-all"
                  >
                    一致
                  </button>
                  <button
                    onClick={() => handleCognitiveResponse('mismatch')}
                    className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-xl transition-all"
                  >
                    不一致
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl text-gray-400">準備中...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // エネルギーマトリックス
  if (phase === 'energy') {
    const classified = [...energyResult.charging, ...energyResult.draining, ...energyResult.neutral];
    const unclassified = ENERGY_ACTIVITIES.filter(a => !classified.includes(a.id));
    const progress = (classified.length / ENERGY_ACTIVITIES.length) * 100;

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>エネルギーマトリックス</span>
              <span>{classified.length} / {ENERGY_ACTIVITIES.length}</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 mb-6">
            <h2 className="text-xl font-semibold mb-2">あなたのエネルギー収支</h2>
            <p className="text-sm text-gray-400 mb-6">各活動を「充電」「消耗」「中立」に分類してください</p>

            {/* 未分類アイテム */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">アイテムをタップして選択、ゾーンをタップで配置</p>
              <div className="flex flex-wrap gap-2">
                {unclassified.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => setDraggedActivity(draggedActivity === activity.id ? null : activity.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      draggedActivity === activity.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {activity.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3つのゾーン */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 充電ゾーン */}
              <div
                onClick={() => draggedActivity && handleEnergyDrop('charging')}
                className={`min-h-[150px] rounded-xl border-2 border-dashed p-4 transition-all ${
                  draggedActivity ? 'border-green-400 bg-green-500/10 cursor-pointer' : 'border-green-500/30'
                }`}
              >
                <p className="text-green-400 font-medium mb-2">⚡ 充電される</p>
                <div className="flex flex-wrap gap-2">
                  {energyResult.charging.map((id) => {
                    const activity = ENERGY_ACTIVITIES.find(a => a.id === id);
                    return (
                      <span key={id} className="px-2 py-1 bg-green-500/30 rounded text-xs">
                        {activity?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 中立ゾーン */}
              <div
                onClick={() => draggedActivity && handleEnergyDrop('neutral')}
                className={`min-h-[150px] rounded-xl border-2 border-dashed p-4 transition-all ${
                  draggedActivity ? 'border-gray-400 bg-gray-500/10 cursor-pointer' : 'border-gray-500/30'
                }`}
              >
                <p className="text-gray-400 font-medium mb-2">➖ 中立</p>
                <div className="flex flex-wrap gap-2">
                  {energyResult.neutral.map((id) => {
                    const activity = ENERGY_ACTIVITIES.find(a => a.id === id);
                    return (
                      <span key={id} className="px-2 py-1 bg-gray-500/30 rounded text-xs">
                        {activity?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 消耗ゾーン */}
              <div
                onClick={() => draggedActivity && handleEnergyDrop('draining')}
                className={`min-h-[150px] rounded-xl border-2 border-dashed p-4 transition-all ${
                  draggedActivity ? 'border-red-400 bg-red-500/10 cursor-pointer' : 'border-red-500/30'
                }`}
              >
                <p className="text-red-400 font-medium mb-2">🔋 消耗する</p>
                <div className="flex flex-wrap gap-2">
                  {energyResult.draining.map((id) => {
                    const activity = ENERGY_ACTIVITIES.find(a => a.id === id);
                    return (
                      <span key={id} className="px-2 py-1 bg-red-500/30 rounded text-xs">
                        {activity?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleEnergyComplete}
              className="w-full mt-6 py-4 bg-teal-600/70 text-white rounded-xl hover:bg-teal-500 transition-all font-bold"
            >
              次へ進む
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 神経多様性テスト
  if (phase === 'sensory') {
    const question = NEURODIVERSITY_QUESTIONS[neuroQuestionIndex];
    const progress = (neuroQuestionIndex / NEURODIVERSITY_QUESTIONS.length) * 100;
    
    const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
      sensory: { label: '感覚処理', icon: '👁️', color: 'text-orange-400' },
      emotional: { label: '情緒処理', icon: '💚', color: 'text-pink-400' },
      stimulation: { label: '刺激追求', icon: '⚡', color: 'text-yellow-400' },
      executive: { label: '実行機能', icon: '🧠', color: 'text-cyan-400' },
      social: { label: '社会的認知', icon: '👥', color: 'text-purple-400' },
    };
    
    const currentCategory = categoryLabels[question.category];

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>神経多様性テスト</span>
              <span>{neuroQuestionIndex + 1} / {NEURODIVERSITY_QUESTIONS.length}</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600/70 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="text-center mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm bg-white/10 ${currentCategory.color}`}>
              {currentCategory.icon} {currentCategory.label}
            </span>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 mb-6">
            <p className="text-lg leading-relaxed mb-8 text-center">
              {question.text}
            </p>

            <div className="space-y-3">
              {[
                { score: 0, label: 'まったく当てはまらない', color: 'border-green-500/50 hover:bg-green-500/20' },
                { score: 1, label: 'あまり当てはまらない', color: 'border-yellow-500/50 hover:bg-yellow-500/20' },
                { score: 2, label: 'やや当てはまる', color: 'border-orange-500/50 hover:bg-orange-500/20' },
                { score: 3, label: 'とても当てはまる', color: 'border-red-500/50 hover:bg-red-500/20' },
              ].map((option) => (
                <button
                  key={option.score}
                  onClick={() => handleNeuroResponse(option.score)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${option.color}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリ進捗表示 */}
          <div className="flex justify-center gap-2 flex-wrap">
            {Object.entries(categoryLabels).map(([key, { icon, color }]) => {
              const answered = neuroResponses.filter(r => r.category === key).length;
              const total = NEURODIVERSITY_QUESTIONS.filter(q => q.category === key).length;
              const isCurrent = question.category === key;
              return (
                <div
                  key={key}
                  className={`px-3 py-1 rounded-full text-xs ${
                    isCurrent ? 'bg-white/20 ring-2 ring-white/50' : 'bg-white/5'
                  } ${color}`}
                >
                  {icon} {answered}/{total}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ストーリー診断
  if (phase === 'story') {
    const episode = STORY_EPISODES[storyIndex];
    const scene = episode.scenes[0];
    const progress = (storyIndex / STORY_EPISODES.length) * 100;

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>行動パターン診断</span>
              <span>{storyIndex + 1} / {STORY_EPISODES.length}</span>
            </div>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600/70 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-1">{episode.title}</h2>
            <p className="text-gray-400 text-sm">{episode.description}</p>
          </div>

          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50">
            <p className="text-lg mb-6 leading-relaxed">{scene.text}</p>

            <div className="space-y-3">
              {scene.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleStoryChoice(choice.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedChoice === choice.id
                      ? 'border-teal-500/50 bg-teal-900/30'
                      : 'border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/30'
                  }`}
                >
                  {choice.text}
                </button>
              ))}
            </div>

            {selectedChoice && (
              <button
                onClick={handleStoryConfirm}
                className="w-full mt-6 py-4 bg-teal-600/70 text-white rounded-xl hover:bg-teal-500 transition-all font-bold"
              >
                決定する
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 結果画面
  if (phase === 'result' && finalResult) {
    const { scores, maskingCost, energyResult: energy, systemSpec } = finalResult;

    // パラメータの詳細情報
    const parameterDetails: Record<string, {
      name: string;
      icon: string;
      lowLabel: string;
      highLabel: string;
      description: string;
      lowAdvice: string;
      highAdvice: string;
    }> = {
      impulse: {
        name: '衝動性',
        icon: '⚡',
        lowLabel: '慎重派',
        highLabel: '即断即決派',
        description: '思いついたことをすぐ行動に移す傾向',
        lowAdvice: '慎重に考えてから動くタイプ。石橋を叩きすぎて機会を逃すことも。たまには「えいやっ」と飛び込んでみると新しい発見があるかも。',
        highAdvice: '思い立ったらすぐ行動するタイプ。瞬発力は武器だけど、重要な決定の前は「3分ルール」を。SNS投稿や大きな買い物は、一度時間を置こう。',
      },
      planning: {
        name: '計画性',
        icon: '📋',
        lowLabel: '直感派',
        highLabel: '設計派',
        description: '物事を事前に計画し、順序立てて進める傾向',
        lowAdvice: 'その場のノリで動くタイプ。柔軟性はあるけど、大きなプロジェクトでは「今日これだけ」リストが効果的。ToDoリストより、1日1個の目標がおすすめ。',
        highAdvice: '計画を立ててから動くタイプ。見通しを立てる力は強み。ただし、計画通りにいかなくても自分を責めすぎないで。計画は「目安」と捉えよう。',
      },
      empathy: {
        name: '共感性',
        icon: '💚',
        lowLabel: '自分軸',
        highLabel: '他者軸',
        description: '他人の感情や状況に共感し、配慮する傾向',
        lowAdvice: '自分の軸がしっかりしているタイプ。ブレないのは強みだけど、時には相手の立場に立って考えてみると、人間関係がスムーズに。',
        highAdvice: '他人の気持ちに敏感なタイプ。共感力は大きな武器。ただし、他人の感情を吸収しすぎないよう注意。「これは私の感情？相手の感情？」と確認する習慣を。',
      },
      risk: {
        name: 'リスク許容度',
        icon: '🎲',
        lowLabel: '安定志向',
        highLabel: '冒険志向',
        description: '不確実な状況やリスクを受け入れる傾向',
        lowAdvice: '安全を重視するタイプ。慎重さは資産を守る力になる。ただし、「失敗しないこと」より「小さく試すこと」を意識すると世界が広がるかも。',
        highAdvice: 'リスクを取れるタイプ。チャレンジ精神は成功の鍵。ただし「これだけは失えない」ラインを決めておこう。全賭けは避けて、分散を意識。',
      },
      boundary: {
        name: '自己境界',
        icon: '🛡️',
        lowLabel: '自己犠牲型',
        highLabel: '自己防衛型',
        description: '自分と他人の間に適切な境界線を引く傾向',
        lowAdvice: '他人のために自分を後回しにしがちなタイプ。優しさは美徳だけど、自分を守ることも大事。「NO」は相手を傷つける言葉じゃなくて、自分を守る言葉。',
        highAdvice: '自分を守ることができるタイプ。セルフケア上手は長く活躍できる秘訣。ただし、時には壁を下げて人を受け入れることで、深い関係が生まれることも。',
      },
      creation: {
        name: '創作コミット',
        icon: '🎨',
        lowLabel: '現実派',
        highLabel: '創造派',
        description: 'クリエイティブな活動への没頭度',
        lowAdvice: '現実的なタスクを優先するタイプ。地に足がついているのは強み。たまには「役に立たないこと」を楽しむ時間を作ると、意外なリフレッシュに。',
        highAdvice: '創作への情熱が強いタイプ。過集中モードは最大の武器。ただし終了時間を決めておかないと生活が崩壊することも。タイマーを味方につけよう。',
      },
      money: {
        name: '金銭感覚',
        icon: '💰',
        lowLabel: '享楽派',
        highLabel: '堅実派',
        description: 'お金の使い方における慎重さ',
        lowAdvice: '今を楽しむことにお金を使うタイプ。人生を楽しむ才能がある。ただし「使っていいお金」を先に分けておく仕組みを作ると安心。24時間ルールも効果的。',
        highAdvice: '堅実にお金を管理できるタイプ。将来への備えは心の安定につながる。ただし、たまには自分へのご褒美も大事。「使うための貯金」も作ってみては。',
      },
    };

    // 総合分析を生成
    const generateOverallAnalysis = () => {
      const analyses: string[] = [];

      // 擬態コストに基づく分析
      if (maskingCost.avgGap >= 3) {
        analyses.push('🎭 あなたは日常的に「本当の自分」を抑えて生活しています。これは社会適応の証拠でもありますが、長期間続くと燃え尽きのリスクがあります。週に1回は「誰にも見られていない自分」でいられる時間を確保しましょう。');
      } else if (maskingCost.avgGap >= 2) {
        analyses.push('🎭 適度に本音と行動を使い分けています。社会的な場面では必要なスキルですが、信頼できる人の前では素を出せていますか？');
      }

      // スコアの組み合わせに基づく分析
      if (scores.impulse >= 2 && scores.planning <= -1) {
        analyses.push('⚡ 「思いついたらすぐ動く」タイプです。これは強みですが、重要な決定では意図的にブレーキをかける仕組みが必要です。大きな買い物やSNS投稿は「下書き保存→24時間後に見直し」がおすすめ。');
      }

      if (scores.empathy >= 2 && scores.boundary <= -2) {
        analyses.push('💚 共感力が高く、人の気持ちに寄り添えるのは素晴らしい才能です。ただし、自分を犠牲にしすぎていませんか？「相手を助ける前に、自分の酸素マスクを」が鉄則です。');
      }

      if (scores.creation >= 2 && scores.planning <= -1) {
        analyses.push('🎨 クリエイティブへの情熱が強く、過集中モードに入れるのは大きな武器です。ただし「始めたら止まらない」傾向があるなら、開始前にタイマーをセットする習慣を。');
      }

      if (scores.risk >= 2 && scores.money <= -2) {
        analyses.push('🎲 チャレンジ精神があり、お金を使うことに抵抗がないタイプです。大きな成功を掴む可能性がある一方、「これだけは絶対に手をつけない」資金を別口座に分けておくことをおすすめします。');
      }

      // エネルギー分析
      const socialDraining = energy.draining.filter(id => 
        ENERGY_ACTIVITIES.find(a => a.id === id)?.category === 'social'
      ).length;
      const socialCharging = energy.charging.filter(id => 
        ENERGY_ACTIVITIES.find(a => a.id === id)?.category === 'social'
      ).length;

      if (socialDraining >= 2 && socialCharging === 0) {
        analyses.push('🔋 社交的な活動で消耗するタイプのようです。これは「内向型」の特徴で、決して悪いことではありません。大人数の集まりの後は、意識的に一人の時間を確保しましょう。');
      } else if (socialCharging >= 2 && socialDraining === 0) {
        analyses.push('🔋 人と一緒にいることでエネルギーが充電されるタイプです。孤独な作業が続くとストレスがたまりやすいかも。定期的に人と会う予定を入れておきましょう。');
      }

      return analyses;
    };

    const overallAnalyses = generateOverallAnalysis();

    // 強みと注意点を抽出
    const strengths: string[] = [];
    const warnings: string[] = [];

    if (scores.creation >= 2) strengths.push('創造性・過集中力');
    if (scores.planning >= 2) strengths.push('計画力・見通し力');
    if (scores.empathy >= 2) strengths.push('共感力・人間理解');
    if (scores.boundary >= 2) strengths.push('セルフケア・自己防衛');
    if (scores.risk >= 2) strengths.push('チャレンジ精神');
    if (scores.impulse <= -2) strengths.push('慎重さ・熟考力');
    if (scores.money >= 2) strengths.push('堅実な金銭管理');

    if (scores.impulse >= 3) warnings.push('衝動的な判断に注意');
    if (scores.boundary <= -3) warnings.push('自己犠牲の傾向');
    if (scores.money <= -3) warnings.push('散財リスク');
    if (maskingCost.avgGap >= 3) warnings.push('慢性的な社会的疲労');

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-stone-100">
              あなたのOS診断結果
            </h1>
            <p className="text-gray-400">自分を理解し、うまく付き合うための設計書</p>
          </div>

          {/* サマリーカード */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">あなたの強み</p>
                <div className="flex flex-wrap gap-1">
                  {strengths.length > 0 ? strengths.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-green-500/30 rounded-full text-xs text-green-300">{s}</span>
                  )) : <span className="text-gray-500 text-sm">バランス型</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">注意ポイント</p>
                <div className="flex flex-wrap gap-1">
                  {warnings.length > 0 ? warnings.map((w, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-500/30 rounded-full text-xs text-orange-300">{w}</span>
                  )) : <span className="text-gray-500 text-sm">特になし</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 総合分析 */}
          {overallAnalyses.length > 0 && (
            <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                <span className="text-teal-400/80">あなたの傾向分析</span>
              </h2>
              <div className="space-y-4">
                {overallAnalyses.map((analysis, i) => (
                  <p key={i} className="text-gray-300 leading-relaxed">{analysis}</p>
                ))}
              </div>
            </div>
          )}

          {/* 擬態コスト詳細 */}
          <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎭</span>
              <span className="text-teal-400/80">擬態コスト分析</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">「本音」と「実際の行動」のギャップを測定しました</p>
            
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">本音との乖離度</span>
                <span className="text-2xl font-bold">{maskingCost.avgGap.toFixed(1)} / 6.0</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    maskingCost.avgGap >= 4 ? 'bg-red-500' :
                    maskingCost.avgGap >= 3 ? 'bg-orange-500' :
                    maskingCost.avgGap >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(maskingCost.avgGap / 6) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <p className="font-medium text-white">社会的疲弊度: {maskingCost.exhaustionLevel}</p>
                  <p className="text-sm text-gray-400">
                    {maskingCost.avgGap >= 4 
                      ? '非常に高いレベルです。「常識人エミュレーター」が常にフル稼働しており、精神的リソースを大量に消費しています。'
                      : maskingCost.avgGap >= 3
                      ? '高めのレベルです。日常的に本音を抑えて生活しており、疲労が蓄積しやすい状態です。'
                      : maskingCost.avgGap >= 2
                      ? '中程度のレベルです。社会生活に必要な調整はしていますが、バランスは取れています。'
                      : '低いレベルです。比較的自然体で過ごせているか、社会的な場面が少ない可能性があります。'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="font-medium text-white">おすすめの対策</p>
                  <p className="text-sm text-gray-400">
                    {maskingCost.avgGap >= 3 
                      ? '週に最低1回は「素の自分」でいられる時間を確保しましょう。一人の時間、または本音を言える相手との時間が必要です。'
                      : '現在のバランスを維持しつつ、ストレスを感じたら早めにガス抜きを心がけましょう。'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 認知切り替えテスト結果 */}
          {cognitiveResult && (
            <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span className="text-teal-400/80">認知切り替え分析</span>
              </h2>
              <p className="text-sm text-gray-400 mb-4">ルール変更への適応能力を測定しました</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">切り替えコスト</p>
                  <p className="text-2xl font-bold text-teal-400/80">{Math.round(cognitiveResult.switchCost)}ms</p>
                  <p className="text-xs text-gray-500">ルール変更時の遅延</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">正答率</p>
                  <p className="text-2xl font-bold text-purple-300">{Math.round(cognitiveResult.accuracy * 100)}%</p>
                  <p className="text-xs text-gray-500">全体の正確性</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">切り替え柔軟性</span>
                  <span className={`font-bold ${
                    cognitiveResult.switchCost < 200 ? 'text-green-400' :
                    cognitiveResult.switchCost < 400 ? 'text-yellow-400' :
                    cognitiveResult.switchCost < 600 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {cognitiveResult.switchCost < 200 ? '非常に高い' :
                     cognitiveResult.switchCost < 400 ? '高い' :
                     cognitiveResult.switchCost < 600 ? '標準的' : '過集中傾向'}
                  </span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      cognitiveResult.switchCost < 200 ? 'bg-green-500' :
                      cognitiveResult.switchCost < 400 ? 'bg-yellow-500' :
                      cognitiveResult.switchCost < 600 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(10, 100 - (cognitiveResult.switchCost / 10))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="font-medium text-white">
                      {cognitiveResult.switchCost < 200 
                        ? 'マルチタスク型' 
                        : cognitiveResult.switchCost < 400
                        ? 'バランス型'
                        : cognitiveResult.switchCost < 600
                        ? 'シングルフォーカス型'
                        : '過集中ロック型'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {cognitiveResult.switchCost < 200 
                        ? '素早くタスクを切り替えられます。複数の作業を並行するのが得意ですが、深い集中が必要な作業では意識的に中断を減らしましょう。'
                        : cognitiveResult.switchCost < 400
                        ? '適度な切り替え能力を持っています。状況に応じて集中と切り替えを使い分けられます。'
                        : cognitiveResult.switchCost < 600
                        ? '一つのことに集中するのが得意です。割り込みに弱い傾向があるので、通知を切るなど環境を整えましょう。'
                        : '一度ハマると抜け出しにくい傾向があります。過集中は武器ですが、タイマーを使って定期的に休憩を取りましょう。'}
                    </p>
                  </div>
                </div>
                {cognitiveResult.errorAfterSwitch > 0.3 && (
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-orange-300">ルール変更後のエラー率が高め</p>
                      <p className="text-sm text-gray-400">
                        急な変更に対応するのが苦手かもしれません。重要な状況変化の前には、意識的に「モード切り替え」の時間を取りましょう。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 神経多様性分析 */}
          {sensoryResult && (
            <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🧬</span>
                <span className="text-teal-400/80">神経多様性分析</span>
              </h2>
              <p className="text-sm text-gray-400 mb-4">あなたの神経システムの特性を5軸で分析しました</p>
              
              {/* 神経タイプ表示 */}
              <div className="bg-teal-900/30 rounded-xl p-4 mb-6 border border-white/20">
                <p className="text-gray-400 text-sm mb-1">あなたの神経タイプ</p>
                <p className="text-2xl font-bold text-teal-400">
                  {sensoryResult.neurotype}
                </p>
              </div>

              {/* 5軸のスコア表示 */}
              <div className="space-y-4 mb-6">
                {[
                  { key: 'sensoryOverload', label: '感覚過敏', icon: '👁️', color: 'orange', score: sensoryResult.sensoryOverload, desc: '光・音・触覚などへの敏感さ' },
                  { key: 'emotionalAbsorption', label: '情緒吸収', icon: '💚', color: 'pink', score: sensoryResult.emotionalAbsorption, desc: '他者の感情を吸収する傾向' },
                  { key: 'stimulationSeeking', label: '刺激追求', icon: '⚡', color: 'yellow', score: sensoryResult.stimulationSeeking, desc: '新しい体験・スリルへの欲求' },
                  { key: 'executiveFunction', label: '実行機能課題', icon: '🧠', color: 'cyan', score: sensoryResult.executiveFunction, desc: 'タスク管理・時間感覚の困難さ' },
                  { key: 'socialCognition', label: '社会的認知課題', icon: '👥', color: 'purple', score: sensoryResult.socialCognition, desc: '暗黙のルール理解の困難さ' },
                ].map((axis) => (
                  <div key={axis.key} className="bg-black/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm">
                        <span>{axis.icon}</span>
                        <span>{axis.label}</span>
                      </span>
                      <span className={`font-bold text-${axis.color}-400`}>
                        {axis.score >= 2 ? '高' : axis.score >= 1 ? '中' : '低'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full transition-all bg-${axis.color}-500`}
                        style={{ 
                          width: `${Math.min(100, (axis.score / 3) * 100)}%`,
                          backgroundColor: axis.color === 'orange' ? '#f97316' : 
                                          axis.color === 'pink' ? '#ec4899' :
                                          axis.color === 'yellow' ? '#eab308' :
                                          axis.color === 'cyan' ? '#06b6d4' : '#a855f7'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{axis.desc}</p>
                  </div>
                ))}
              </div>

              {/* 傾向に基づくアドバイス */}
              <div className="space-y-3">
                {sensoryResult.sensoryOverload >= 1.5 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/30">
                    <span className="text-xl">👁️</span>
                    <div>
                      <p className="font-medium text-orange-300">感覚過敏への対策</p>
                      <p className="text-sm text-gray-400">
                        ノイズキャンセリング、サングラス、静かな環境での作業がおすすめ。刺激を減らすことで疲労を大幅に軽減できます。
                      </p>
                    </div>
                  </div>
                )}
                {sensoryResult.emotionalAbsorption >= 1.5 && (
                  <div className="flex items-start gap-3 p-3 bg-pink-500/10 rounded-xl border border-pink-500/30">
                    <span className="text-xl">💚</span>
                    <div>
                      <p className="font-medium text-pink-300">情緒吸収への対策</p>
                      <p className="text-sm text-gray-400">
                        他人の感情を受け取りやすいあなたは、意識的に「境界線」を引く練習を。一人の時間を確保して感情をリセットしましょう。
                      </p>
                    </div>
                  </div>
                )}
                {sensoryResult.stimulationSeeking >= 1.5 && sensoryResult.sensoryOverload >= 1 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="font-medium text-yellow-300">HSS型HSPの特性</p>
                      <p className="text-sm text-gray-400">
                        刺激を求めるけど疲れやすい、という矛盾を抱えています。「短時間の刺激→しっかり休む」のサイクルを意識しましょう。
                      </p>
                    </div>
                  </div>
                )}
                {sensoryResult.executiveFunction >= 1.5 && (
                  <div className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                    <span className="text-xl">🧠</span>
                    <div>
                      <p className="font-medium text-teal-400/80">実行機能サポート</p>
                      <p className="text-sm text-gray-400">
                        外部ツール（タイマー、リマインダー、ルーティン化）を積極的に活用。「やる気」ではなく「仕組み」で動ける環境を作りましょう。
                      </p>
                    </div>
                  </div>
                )}
                {sensoryResult.socialCognition >= 1.5 && (
                  <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                    <span className="text-xl">👥</span>
                    <div>
                      <p className="font-medium text-purple-300">社会的認知サポート</p>
                      <p className="text-sm text-gray-400">
                        暗黙のルールがわかりにくい場合、信頼できる人に「これって普通？」と確認する習慣を。自分なりの社会的ガイドラインを作りましょう。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* エネルギーマトリックス詳細 */}
          <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔋</span>
              <span className="text-teal-400/80">エネルギー収支マップ</span>
            </h2>
            <p className="text-sm text-gray-400 mb-4">あなたの「充電器」と「放電器」を可視化しました</p>

            <div className="space-y-4">
              {/* 充電ポイント */}
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <p className="text-green-400 font-medium mb-2 flex items-center gap-2">
                  <span>⚡</span> 充電されるもの（積極的に取り入れよう）
                </p>
                <div className="flex flex-wrap gap-2">
                  {energy.charging.map(id => {
                    const activity = ENERGY_ACTIVITIES.find(a => a.id === id);
                    return <span key={id} className="px-3 py-1 bg-green-500/20 rounded-full text-sm">{activity?.name}</span>;
                  })}
                  {energy.charging.length === 0 && <span className="text-gray-500 text-sm">充電ポイントが少ないかも。回復方法を意識的に見つけましょう。</span>}
                </div>
              </div>

              {/* 消耗ポイント */}
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <p className="text-red-400 font-medium mb-2 flex items-center gap-2">
                  <span>🔋</span> 消耗するもの（セーブを意識しよう）
                </p>
                <div className="flex flex-wrap gap-2">
                  {energy.draining.map(id => {
                    const activity = ENERGY_ACTIVITIES.find(a => a.id === id);
                    return <span key={id} className="px-3 py-1 bg-red-500/20 rounded-full text-sm">{activity?.name}</span>;
                  })}
                  {energy.draining.length === 0 && <span className="text-gray-500 text-sm">消耗ポイントが少ない（または自覚がない）状態です。</span>}
                </div>
              </div>

              {/* エネルギー管理のアドバイス */}
              <div className="flex items-start gap-3 mt-4">
                <span className="text-xl">💡</span>
                <div>
                  <p className="font-medium text-white">エネルギー管理のコツ</p>
                  <p className="text-sm text-gray-400">
                    消耗する活動の後には、充電できる活動を意識的に入れましょう。
                    {energy.draining.length > energy.charging.length && 
                      '現在は消耗が多めなので、新しい充電方法を開拓することをおすすめします。'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* パラメータ詳細 */}
          <div className="bg-stone-800/30 rounded-2xl p-6 mb-6 border border-stone-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-teal-400/80">7つのパラメータ詳細</span>
            </h2>
            <p className="text-sm text-gray-400 mb-6">各項目をタップすると詳細が見れます</p>

            <div className="space-y-4">
              {(Object.keys(scores) as (keyof DiagnosisScores)[]).map((key) => {
                const value = scores[key];
                const detail = parameterDetails[key];
                const percentage = ((value + 10) / 20) * 100;
                const isHigh = value >= 2;
                const isLow = value <= -2;

                return (
                  <div key={key} className="bg-black/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{detail.icon}</span>
                      <span className="font-medium flex-1">{detail.name}</span>
                      <span className={`text-sm ${value >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {value >= 0 ? '+' : ''}{value}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 w-16">{detail.lowLabel}</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{detail.highLabel}</span>
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{detail.description}</p>
                    <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
                      {isHigh ? detail.highAdvice : isLow ? detail.lowAdvice : 'バランスが取れています。状況に応じて柔軟に対応できるタイプです。'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 取扱説明書 */}
          <div className="bg-teal-900/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <span className="text-teal-400/80">あなたの取扱説明書</span>
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-purple-300 font-medium mb-2">🔧 調子が悪い時の対処法</p>
                <ul className="space-y-1 text-gray-300">
                  {energy.charging.length > 0 && (
                    <li>• {ENERGY_ACTIVITIES.find(a => a.id === energy.charging[0])?.name}をする</li>
                  )}
                  {maskingCost.avgGap >= 2 && <li>• 一人の時間を確保する</li>}
                  {scores.creation >= 2 && <li>• 創作活動に没頭する時間を作る</li>}
                  <li>• 水を飲む、深呼吸する、少し歩く</li>
                </ul>
              </div>

              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-purple-300 font-medium mb-2">⚠️ 避けた方がいい状況</p>
                <ul className="space-y-1 text-gray-300">
                  {energy.draining.length > 0 && (
                    <li>• {ENERGY_ACTIVITIES.find(a => a.id === energy.draining[0])?.name}の連続</li>
                  )}
                  {scores.boundary <= -2 && <li>• 断れない状況での頼み事ラッシュ</li>}
                  {scores.impulse >= 2 && <li>• 疲れている時の重要な決定</li>}
                  {maskingCost.avgGap >= 3 && <li>• 長時間の社交的な場面</li>}
                </ul>
              </div>

              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-purple-300 font-medium mb-2">🌟 活かすべき特性</p>
                <ul className="space-y-1 text-gray-300">
                  {scores.creation >= 2 && <li>• 過集中モードを味方につける（ただし時間制限付きで）</li>}
                  {scores.empathy >= 2 && <li>• 人の気持ちを理解する力を対人関係に活かす</li>}
                  {scores.risk >= 2 && <li>• チャレンジ精神を新しい機会の獲得に使う</li>}
                  {scores.planning >= 2 && <li>• 計画力をチームの中で発揮する</li>}
                  {strengths.length === 0 && <li>• バランス感覚を活かして調整役になる</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <a
              href="/os/feedback"
              className="inline-block px-8 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl transition-all font-medium text-white"
            >
              📝 診断の感想を教える
            </a>
            <div>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-medium"
              >
                もう一度診断する
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
