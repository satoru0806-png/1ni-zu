-- マインドムービー用テーブル + Storage 設定

CREATE TABLE IF NOT EXISTS mind_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- Phase 1: 1ユーザー1ムービー
  title TEXT DEFAULT 'My Mind Movie',
  theme TEXT, -- 例「健康で穏やかな家族の時間」
  scenes JSONB DEFAULT '[]'::jsonb, -- [{image_url, text, duration_sec}]
  bgm_id TEXT DEFAULT 'calm', -- 'calm' | 'energetic' | 'spiritual' | 'none'
  voiceover_text TEXT,
  voiceover_url TEXT, -- Phase 2 で OpenAI TTS 生成音声
  ai_images_used_this_month INTEGER DEFAULT 0,
  ai_images_reset_date DATE DEFAULT (date_trunc('month', CURRENT_DATE)::date),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mind_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows only"
ON mind_movies
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ===========================================================
-- Storage Bucket: mindmovie-images
-- ===========================================================
-- Supabase Dashboard の Storage で「mindmovie-images」というバケットを作成してください。
-- 「Public bucket」のチェックは ON（公開URL生成のため）
-- ファイルサイズ制限: 5MB 推奨
--
-- 作成後、以下のポリシーを Storage > Policies で設定（または下記SQLを実行）:

-- アップロード: 認証済みユーザーが自分のフォルダにアップロード可
CREATE POLICY "Auth users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mindmovie-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 削除: 自分のファイルのみ削除可
CREATE POLICY "Auth users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mindmovie-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 閲覧: パブリックバケットなので URL 経由で誰でも閲覧可（明示的なポリシー不要）
-- ただし URL を知らないと見られない（unguessable URL）
