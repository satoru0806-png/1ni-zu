-- 週次振り返り機能用テーブル
-- Supabase の SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL, -- 振り返り対象週の開始日（YYYY-MM-DD）
  ai_summary TEXT, -- Step 1: AI が生成する週サマリー
  user_text TEXT, -- Step 2: ユーザーが書く・話す内容
  ai_feedback TEXT, -- Step 3: AI からの気づき
  next_week_dialogue JSONB, -- Step 4: 来週決める時の対話ログ [{role, content}]
  next_week_mits JSONB, -- 来週の MIT 3つ + 重点テーマ {mit1, mit2, mit3, theme}
  applied BOOLEAN DEFAULT FALSE, -- 来週 MIT を /today に反映済みか
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week
  ON weekly_reflections(user_id, week_start DESC);

-- RLS 有効化
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみアクセス可能
CREATE POLICY "own rows only"
ON weekly_reflections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 設定項目を profiles に追加（既存テーブルに列追加）
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS week_start_day INT DEFAULT 1, -- 0=日曜, 1=月曜, ..., 6=土曜
  ADD COLUMN IF NOT EXISTS weekly_review_day INT DEFAULT 0, -- 振り返り曜日（デフォルト: 日曜）
  ADD COLUMN IF NOT EXISTS weekly_review_hour INT DEFAULT 21, -- 振り返り時刻（デフォルト: 21時）
  ADD COLUMN IF NOT EXISTS weekly_review_remind BOOLEAN DEFAULT FALSE; -- リマインド通知ON/OFF

-- 確認用クエリ（実行後に実行して結果を確認）
-- SELECT column_name, data_type, column_default FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name LIKE 'week%';
