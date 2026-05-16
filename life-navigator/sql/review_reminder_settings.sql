-- 月次振り返りリマインド設定列を追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_review_remind BOOLEAN DEFAULT FALSE;
