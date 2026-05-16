-- 21日無料トライアルキー管理用

CREATE TABLE IF NOT EXISTS trial_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  issued_to_email TEXT NOT NULL,
  issued_to_name TEXT,
  issued_to_line_id TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  activated_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trial_end_date DATE,
  status TEXT DEFAULT 'issued', -- issued / activated / expired / cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_keys_email ON trial_keys(issued_to_email);
CREATE INDEX IF NOT EXISTS idx_trial_keys_key ON trial_keys(key);

-- 公開アクセスは禁止（API 経由でのみ操作）
ALTER TABLE trial_keys ENABLE ROW LEVEL SECURITY;

-- 管理者（service_role）のみアクセス可（policy 不要、RLS 有効＋policy 無し = 全拒否）

-- profiles にトライアル管理列追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_start_date DATE,
  ADD COLUMN IF NOT EXISTS trial_end_date DATE;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);
