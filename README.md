# Render脱却 → Supabase + Cloudflare Pages 移行手順書

このリポジトリは、現状 Render の永続Webサービス（FastAPI + Neon Postgres）で運用しています。これを **静的サイト + Supabase** 構成に移行することで、サーバー代を実質0円に、コールドスタートを無くします。

---

## 全体像

```
[Before]                              [After]
ブラウザ                              ブラウザ
   ↓                                     ↓
Render (FastAPI Webサービス)          Cloudflare Pages (静的HTML)
   ↓                                     ↓ (REST API直接)
Neon Postgres                         Supabase (Postgres + Storage)
```

- **ホスティング:** Render → Cloudflare Pages（GitHub連携で自動デプロイ）
- **DB:** Neon Postgres → Supabase Postgres
- **バックエンド:** FastAPI → 廃止（フロントから直接Supabase REST API）
- **認証:** 投稿パスワードはbcrypt (クライアント側でハッシュ化)

---

## 作業手順

### Step 1: Supabaseプロジェクト作成

1. [supabase.com](https://supabase.com/) でアカウント作成 → 新規プロジェクト作成
2. リージョンは `Northeast Asia (Tokyo)` 推奨
3. プロジェクトのDBパスワードは控えておく
4. プロジェクト作成完了後、**Settings > API** から以下をメモ：
   - `Project URL` → 例: `https://xxxxx.supabase.co`
   - `anon public` キー（長い文字列）

### Step 2: スキーマ作成

1. Supabaseダッシュボード > **SQL Editor** を開く
2. 同梱の `supabase-schema.sql` の中身を貼り付けて **Run**
3. **Table Editor** で `posts` テーブルが作成されたことを確認

### Step 3: 既存データの移行

#### 3-A. Neonからエクスポート

Renderのコンソール、またはローカルから Neon Postgres に接続して：

```bash
# psql で接続後
\copy posts TO '/tmp/posts.csv' WITH CSV HEADER
```

または Neon のダッシュボード > Tables > posts > Export CSV

#### 3-B. Supabaseへインポート

1. Supabaseダッシュボード > **Table Editor** > `posts` テーブル
2. 右上の `Insert` > `Import data from CSV`
3. 旧CSVをアップロード。カラムマッピング画面で：
   - `password` → `password_hash` にマッピング
   - `likes` カラムは旧データに無いので未マッピングのまま（DEFAULT 0が入る）

> 旧 `password` カラムが既にbcryptハッシュなら、そのまま `password_hash` に入れて問題なく動きます。

### Step 4: フロント設定

このプロジェクトの `出走予定タイムライン (Supabase版).html` を開き、以下の箇所を **Step 1で控えた値** に書き換えます：

```html
<script>
  window.SUPABASE_CONFIG = {
    url: "https://YOUR-PROJECT.supabase.co",       // ← 書き換え
    anonKey: "YOUR_ANON_KEY"                       // ← 書き換え
  };
</script>
```

> `anon` キーは公開しても問題ありません（RLSで保護されています）。ただし `service_role` キーは絶対に貼らないでください。

### Step 5: GitHubリポジトリ準備

新しいGitHubリポジトリを作って、以下のファイルだけコミット：

```
出走予定タイムライン (Supabase版).html  ← index.html にリネーム推奨
styles.css
mock-data.js
utils.js
supabase-api.js
tweaks-panel.jsx
components-card.jsx
components-form.jsx
app-supabase.jsx
```

> `index.html` にリネームしておくと、Cloudflare Pagesのルートで自動的に表示されます。

### Step 6: Cloudflare Pagesにデプロイ

1. [dash.cloudflare.com](https://dash.cloudflare.com/) にアカウント作成
2. **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
3. Step 5 のリポジトリを選択
4. ビルド設定：
   - Framework preset: `None`
   - Build command: 空欄
   - Build output directory: `/`
5. **Save and Deploy**

数十秒で `https://xxx.pages.dev` のURLが発行されます。

### Step 7: 動作確認

1. デプロイURLにアクセス → タイムラインが表示されることを確認
2. 新規投稿 → 投稿後リロードしても残っていることを確認
3. 編集・削除（投稿時のパスワードを使用）が動くことを確認
4. いいねが他端末でも反映されることを確認

### Step 8: Render停止

すべて動作確認できたら：

1. Render ダッシュボード > 旧サービス > **Settings** > **Suspend** （まずは一時停止）
2. 1週間ほど様子見 → 問題なければ **Delete**
3. Neon Postgres も同様に停止 → 削除

---

## カスタムドメイン（任意）

Cloudflare Pages > プロジェクト > **Custom domains** から、お好みのドメインを設定できます。Cloudflareでドメインを管理していれば数クリックで完了。

---

## 運用上の注意点

### セキュリティ
- 投稿パスワードはbcryptハッシュで保存されます
- ただし `anon` キーで誰でも書き込みできるので、悪意のある第三者が大量投稿する可能性は理論上あります（10〜50人の身内コミュニティなら実質問題なし）
- 心配な場合は Supabase の **Auth** を有効化して、招待制ログインに変更することも可能（別途実装が必要）

### データバックアップ
- Supabase無料プランは7日間の自動バックアップ付き
- 心配なら定期的に Table Editor から CSV エクスポートしておく

### コスト
| サービス | 無料枠 | 50人規模での見込み |
|---|---|---|
| Cloudflare Pages | 無制限リクエスト | 0円 |
| Supabase Database | 500MB | 数年は0円 |
| Supabase Storage | 1GB（画像用） | 0円 |
| Supabase帯域 | 5GB/月 | 0円 |

---

## ロールバック方法

万一問題が起きた場合、Render側を再開すればすぐ戻せます：
1. Render > Suspended のサービスを **Resume**
2. DNSやブックマークを旧URLに戻す

データはSupabaseとNeonに二重で残っているので、どちらに戻しても大丈夫です。

---

## トラブルシューティング

**Q. ページを開いても「読込エラー」と表示される**
A. ブラウザの開発者ツール > Console を確認。`SUPABASE_CONFIG` の値が正しいか、CORSエラーが無いか確認してください。

**Q. 投稿はできるが、リロードすると消える**
A. RLS (Row Level Security) ポリシーが効きすぎている可能性。`supabase-schema.sql` の最後のポリシー部分を再実行してください。

**Q. パスワードが照合できない**
A. 旧Renderのbcrypt版数と互換性がない可能性。新規投稿の編集は問題ないはず。旧データの編集だけ問題が出るなら、旧データの `password_hash` をリセット（一律で同じパスワードに更新）する手もあります。

---

質問があればいつでも聞いてください。
