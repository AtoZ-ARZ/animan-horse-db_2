-- ============================================
-- Supabase スキーマ定義
-- ============================================
-- Supabase ダッシュボード > SQL Editor で実行してください

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS posts (
  id            BIGSERIAL PRIMARY KEY,
  horse_name    VARCHAR(255) NOT NULL,
  club          VARCHAR(100) NOT NULL,
  race_date     DATE NOT NULL,
  racecourse    VARCHAR(100) NOT NULL,
  race_number   INTEGER NOT NULL,
  race_name     VARCHAR(255) DEFAULT '',
  conditions    VARCHAR(255) NOT NULL,
  confidence    INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
  poster_name   VARCHAR(255) DEFAULT '',
  comment       TEXT DEFAULT '',
  likes         INTEGER NOT NULL DEFAULT 0,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_race_date ON posts(race_date);

-- いいねカウンタ用RPC関数
CREATE OR REPLACE FUNCTION increment_like(post_id BIGINT, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts SET likes = GREATEST(likes + delta, 0)
  WHERE id = post_id
  RETURNING likes INTO new_count;
  RETURN new_count;
END;
$$;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全員 SELECT 可能
DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);

-- 全員 INSERT 可能（password_hash が必須なのでクライアント側でハッシュ化済みであること）
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (
  password_hash IS NOT NULL AND length(password_hash) > 20
);

-- UPDATE/DELETE はパスワード照合をクライアント側で行うため anon で許可
-- ※簡易的なPW保護なので、悪意ある第三者は理論上全削除可能
--   気になる場合は edge function で照合する形に変更可能
DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (true);

-- RPC は anon でも実行可能（デフォルトでOK）
GRANT EXECUTE ON FUNCTION increment_like TO anon;
