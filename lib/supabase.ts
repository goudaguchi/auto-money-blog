import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabaseが設定されているかどうか
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// クライアントの遅延初期化
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabaseが設定されていません。環境変数を確認してください。');
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _supabase;
}

// フィードバックの型定義
export interface Feedback {
  id?: number;
  created_at?: string;
  accuracy_rating: number; // 1-5: 当たってるか
  accurate_parts?: string; // 当たってた部分
  inaccurate_parts?: string; // 違うと思った部分
  overall_comment?: string; // 全体の感想
  os_type?: string; // 診断結果のOSタイプ
  neurotype?: string; // 神経タイプ
}

// フィードバック送信
export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'created_at'>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedbacks')
    .insert([feedback])
    .select();

  if (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }

  return data;
}

// フィードバック取得（集計用）
export async function getFeedbacks() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }

  return data as Feedback[];
}

// 集計データ取得
export async function getFeedbackStats() {
  const feedbacks = await getFeedbacks();
  
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0 
    ? feedbacks.reduce((sum, f) => sum + f.accuracy_rating, 0) / totalCount 
    : 0;
  
  // 評価の分布
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedbacks.filter(f => f.accuracy_rating === rating).length,
    percentage: totalCount > 0 
      ? (feedbacks.filter(f => f.accuracy_rating === rating).length / totalCount) * 100 
      : 0,
  }));

  return {
    totalCount,
    avgRating,
    ratingDistribution,
    feedbacks,
  };
}

