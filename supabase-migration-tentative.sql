-- ============================================
-- 仮予定機能の追加マイグレーション
-- ============================================
-- Supabase SQL Editor で実行してください

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_tentative BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tentative_month VARCHAR(7) DEFAULT NULL;
-- tentative_month は "YYYY-MM" 形式（例: "2026-03"）

-- 仮予定の場合、日付やコース等は実在する値である必要が無いので、
-- 既存テーブルの NOT NULL 制約を緩めます（仮予定行は埋まらないので）
ALTER TABLE posts ALTER COLUMN race_date DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN racecourse DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN race_number DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN conditions DROP NOT NULL;

-- 仮予定インデックス
CREATE INDEX IF NOT EXISTS idx_posts_tentative_month ON posts(tentative_month) WHERE is_tentative = TRUE;
