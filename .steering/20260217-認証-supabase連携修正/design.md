# 設計書: 認証 Supabase 連携修正

## 方針

Supabase の URL / 公開キー解決を `lib/supabase/env.ts` に集約し、すべての Supabase クライアント生成処理が同じ設定を参照する。

## 変更ファイル

- `lib/supabase/env.ts`（新規）: env 解決とバリデーション
- `lib/supabase/client.ts`: 共通 env ヘルパー利用
- `lib/supabase/server.ts`: 共通 env ヘルパー利用
- `middleware.ts`: 共通 env ヘルパー利用
- `app/(auth)/login/page.tsx`: 初期化失敗時の例外ハンドリング
- `app/(auth)/signup/page.tsx`: 初期化失敗時の例外ハンドリング
- `.env.local.example`: 環境変数説明の整合
- `docs/architecture.md`: 環境変数名の整合

## 実装詳細

### 1. Env 解決

- `NEXT_PUBLIC_SUPABASE_URL` は必須
- 公開キーは以下の優先順で解決
  1. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`（後方互換）
- いずれも未設定なら、設定例を含むエラーを throw

### 2. 認証 UI の失敗ハンドリング

- `createClient` 失敗も `try/catch` で捕捉
- ユーザー向けには内部詳細を隠し、再設定案内メッセージを表示
- 既存の認証失敗メッセージ（メール/パスワード不一致など）は維持

### 3. 互換性

- 既存の `PUBLISHABLE_KEY` 利用環境には影響なし
- 既存ドキュメントの `ANON_KEY` 設定環境でも動作する
