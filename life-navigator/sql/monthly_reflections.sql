-- 月次振り返り機能用テーブル
-- Supabase の SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS monthly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_start DATE NOT NULL, -- 月初日（YYYY-MM-01）
  ai_summary TEXT,
  user_text TEXT,
  ai_feedback TEXT,
  next_month_dialogue JSONB,
  next_month_theme TEXT, -- 来月の重点テーマ
  next_month_goals JSONB, -- 来月のゴール（複数）
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reflections_user_month
  ON monthly_reflections(user_id, month_start DESC);

ALTER TABLE monthly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows only"
ON monthly_reflections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
