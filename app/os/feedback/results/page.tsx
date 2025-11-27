'use client';

import { useEffect, useState } from 'react';
import { getFeedbackStats, type Feedback } from '@/lib/supabase';

interface FeedbackStats {
  totalCount: number;
  avgRating: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  feedbacks: Feedback[];
}

const RATING_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  5: { label: 'とても当たってる', emoji: '🎯', color: 'bg-green-500' },
  4: { label: 'まあまあ当たってる', emoji: '👍', color: 'bg-lime-500' },
  3: { label: 'どちらとも言えない', emoji: '🤔', color: 'bg-yellow-500' },
  2: { label: 'あまり当たってない', emoji: '😕', color: 'bg-orange-500' },
  1: { label: '全然当たってない', emoji: '❌', color: 'bg-red-500' },
};

export default function FeedbackResultsPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getFeedbackStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-stone-400">データを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😢</div>
          <p className="text-stone-400 mb-4">{error || 'データがありません'}</p>
          <a
            href="/os/feedback"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all font-medium"
          >
            フィードバックを送る
          </a>
        </div>
      </main>
    );
  }

  // 正の評価の割合（4以上）
  const positivePercentage = stats.totalCount > 0
    ? ((stats.ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0) / stats.totalCount) * 100).toFixed(1)
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 font-serif">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 みんなの診断フィードバック</h1>
          <p className="text-stone-400">診断を受けた人たちの感想</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 text-center">
            <p className="text-stone-400 text-sm mb-1">回答数</p>
            <p className="text-4xl font-bold text-teal-400">{stats.totalCount}</p>
          </div>
          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 text-center">
            <p className="text-stone-400 text-sm mb-1">平均評価</p>
            <p className="text-4xl font-bold text-purple-400">{stats.avgRating.toFixed(1)}</p>
            <p className="text-xs text-stone-500">/ 5.0</p>
          </div>
          <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 text-center col-span-2 md:col-span-1">
            <p className="text-stone-400 text-sm mb-1">当たってる率</p>
            <p className="text-4xl font-bold text-green-400">{positivePercentage}%</p>
            <p className="text-xs text-stone-500">評価4以上</p>
          </div>
        </div>

        {/* 評価分布 */}
        <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📈</span>
            <span className="text-teal-400/80">評価の分布</span>
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const data = stats.ratingDistribution.find(r => r.rating === rating) || { count: 0, percentage: 0 };
              const info = RATING_LABELS[rating];
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-xl w-8">{info.emoji}</span>
                  <span className="text-sm text-stone-400 w-36">{info.label}</span>
                  <div className="flex-1 h-6 bg-stone-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.color} transition-all duration-500`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-stone-400 w-16 text-right">
                    {data.count}件 ({data.percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* フィードバック一覧 */}
        <div className="bg-stone-800/30 rounded-2xl p-6 border border-stone-700/50 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>💬</span>
            <span className="text-teal-400/80">みんなのコメント</span>
          </h2>
          
          {stats.feedbacks.length === 0 ? (
            <p className="text-stone-500 text-center py-8">まだコメントがありません</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.feedbacks
                .filter(f => f.accurate_parts || f.inaccurate_parts || f.overall_comment)
                .slice(0, 20)
                .map((feedback, index) => (
                  <div key={feedback.id || index} className="bg-stone-900/50 rounded-xl p-4 border border-stone-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{RATING_LABELS[feedback.accuracy_rating]?.emoji}</span>
                      <span className="text-sm text-stone-400">
                        {RATING_LABELS[feedback.accuracy_rating]?.label}
                      </span>
                      <span className="text-xs text-stone-600 ml-auto">
                        {feedback.created_at ? new Date(feedback.created_at).toLocaleDateString('ja-JP') : ''}
                      </span>
                    </div>
                    {feedback.accurate_parts && (
                      <div className="mb-2">
                        <span className="text-xs text-green-400">当たってた部分:</span>
                        <p className="text-sm text-stone-300">{feedback.accurate_parts}</p>
                      </div>
                    )}
                    {feedback.inaccurate_parts && (
                      <div className="mb-2">
                        <span className="text-xs text-orange-400">違うと思った部分:</span>
                        <p className="text-sm text-stone-300">{feedback.inaccurate_parts}</p>
                      </div>
                    )}
                    {feedback.overall_comment && (
                      <div>
                        <span className="text-xs text-purple-400">感想:</span>
                        <p className="text-sm text-stone-300">{feedback.overall_comment}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* CTAボタン */}
        <div className="flex gap-4 justify-center">
          <a
            href="/os"
            className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-all font-medium"
          >
            診断を受ける
          </a>
          <a
            href="/os/feedback"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all font-medium"
          >
            フィードバックを送る
          </a>
        </div>
      </div>
    </main>
  );
}

