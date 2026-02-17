# 要求定義書: 認証 Supabase 連携修正

## 目的

ログイン画面で新規登録・ログインが失敗する問題を解消し、Supabase 認証連携を安定化する。

## 背景

- 現在の実装は `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を前提としている。
- ドキュメントには `NEXT_PUBLIC_SUPABASE_ANON_KEY` の記載が残っており、環境変数名の不一致で認証初期化が失敗する可能性がある。
- 初期化失敗時の UI 側ハンドリングが不足しており、ユーザーに原因が伝わらない。

## 要求

### 1. 環境変数の互換対応
- Supabase 公開キーは `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を優先
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` も後方互換で受け付ける

### 2. Supabase クライアント初期化の統一
- `client.ts` / `server.ts` / `middleware.ts` で同じ env 解決ロジックを使用する
- 必須 env 欠落時は明確なエラーメッセージを返す

### 3. ログイン/新規登録 UX の改善
- 認証初期化失敗時に画面がクラッシュしない
- ユーザー向けに再設定を促すメッセージを表示する

## 受け入れ条件

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` のみ設定された環境でもログイン・新規登録が動作する
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 設定時も従来通り動作する
- [ ] `npm run type-check` が成功する
- [ ] `npm run lint` が成功する

## スコープ外

- OAuth プロバイダ追加
- メール認証フロー自体の仕様変更（確認メール必須化など）
