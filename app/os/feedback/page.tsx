'use client';

import { useState } from 'react';
import { submitFeedback } from '@/lib/supabase';

const RATING_OPTIONS = [
  { value: 5, label: 'とても当たってる', emoji: '🎯' },
  { value: 4, label: 'まあまあ当たってる', emoji: '👍' },
  { value: 3, label: 'どちらとも言えない', emoji: '🤔' },
  { value: 2, label: 'あまり当たってない', emoji: '😕' },
  { value: 1, label: '全然当たってない', emoji: '❌' },
];

export default function FeedbackPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [accurateParts, setAccurateParts] = useState('');
  const [inaccurateParts, setInaccurateParts] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null) {
      setError('評価を選択してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        accuracy_rating: rating,
        accurate_parts: accurateParts || undefined,
        inaccurate_parts: inaccurateParts || undefined,
        overall_comment: overallComment || undefined,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 送信完了画面
  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-stone-800/30 rounded-2xl p-8 border border-stone-700/50 text-center">
            <div className="text-6xl mb-4">🙏</div>
            <h1 className="text-2xl font-bold mb-4">ありがとうございました！</h1>
            <p className="text-stone-400 mb-6">
              貴重なフィードバックをいただきありがとうございます。<br />
              今後の改善に活かしていきます。
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/os"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all font-medium"
              >
                診断ページへ戻る
              </a>
              <a
                href="/os/feedback/results"
                className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-all font-medium"
              >
                みんなの回答を見る
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📝 診断の感想を教えてください</h1>
          <p className="text-stone-400">あなたの声が診断の改善に役立ちます</p>
        </div>

        <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 space-y-8">
          {/* Q1: 当たっていたか */}
          <div>
            <label className="block text-lg font-medium mb-4">
              Q1. 診断結果は当たっていましたか？ <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRating(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    rating === option.value
                      ? 'border-teal-500/50 bg-teal-900/30 text-stone-100'
                      : 'border-stone-700/50 hover:border-stone-600 hover:bg-stone-800/30 text-stone-300'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q2: 当たっていた部分 */}
          <div>
            <label className="block text-lg font-medium mb-2">
              Q2. 特に当たっていた部分は？
              <span className="text-stone-500 text-sm ml-2">（任意）</span>
            </label>
            <textarea
              value={accurateParts}
              onChange={(e) => setAccurateParts(e.target.value)}
              placeholder="例: 擬態コストの部分が自分のことを言われているみたいだった..."
              className="w-full p-4 bg-stone-900/50 border border-stone-700/50 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-teal-500/50 resize-none"
              rows={3}
            />
          </div>

          {/* Q3: 違うと思った部分 */}
          <div>
            <label className="block text-lg font-medium mb-2">
              Q3. 違うと思った部分は？
              <span className="text-stone-500 text-sm ml-2">（任意）</span>
            </label>
            <textarea
              value={inaccurateParts}
              onChange={(e) => setInaccurateParts(e.target.value)}
              placeholder="例: 衝動性は高くないと思う..."
              className="w-full p-4 bg-stone-900/50 border border-stone-700/50 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-teal-500/50 resize-none"
              rows={3}
            />
          </div>

          {/* Q4: 全体の感想 */}
          <div>
            <label className="block text-lg font-medium mb-2">
              Q4. 全体の感想・改善点など
              <span className="text-stone-500 text-sm ml-2">（任意）</span>
            </label>
            <textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="例: もう少し質問数が少ないと嬉しい..."
              className="w-full p-4 bg-stone-900/50 border border-stone-700/50 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-teal-500/50 resize-none"
              rows={3}
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === null}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isSubmitting || rating === null
                ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </div>

        {/* 戻るリンク */}
        <div className="text-center mt-6">
          <a href="/os" className="text-stone-500 hover:text-stone-300 transition-all">
            ← 診断ページへ戻る
          </a>
        </div>
      </div>
    </main>
  );
}

