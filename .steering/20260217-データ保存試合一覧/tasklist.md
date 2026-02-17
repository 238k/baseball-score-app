# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: Zustand Persist（localStorage永続化）

- [x] `gameStore.ts` に `persist` ミドルウェアを追加
  - [x] `zustand/middleware` から `persist` をインポート
  - [x] `games` と `lineups` を localStorage に保存
- [x] `scoreStore.ts` に `persist` ミドルウェアを追加
  - [x] `plateAppearances`, `currentInning`, `currentTopBottom` を保存

## フェーズ2: Supabase 基盤セットアップ

- [x] `@supabase/supabase-js` と `@supabase/ssr` をインストール
- [x] `.env.local.example` を作成（URL と ANON_KEY テンプレート）
- [x] `lib/supabase/client.ts` を作成（ブラウザ用クライアント）
- [x] `lib/supabase/server.ts` を作成（サーバーサイド用クライアント）
- [x] `lib/supabase/types.ts` を作成（DB テーブル型）

## フェーズ3: 認証 UI

- [x] `app/(auth)/login/page.tsx` を作成
  - [x] メール・パスワード入力フォーム
  - [x] Supabase Auth でログイン処理
  - [x] サインアップページへのリンク
- [x] `app/(auth)/signup/page.tsx` を作成
  - [x] メール・パスワード入力フォーム（確認パスワードあり）
  - [x] Supabase Auth でサインアップ処理
  - [x] ログインページへのリンク
- [x] `middleware.ts` を作成
  - [x] `/games/**` を認証保護（未認証→`/login`）
  - [x] `/auth/**` は保護しない
- [x] `hooks/useAuth.ts` を作成
  - [x] 認証状態（user, loading）を提供
  - [x] logout 関数を提供

## フェーズ4: Supabase CRUD

- [x] `lib/supabase/queries/games.ts` を作成
  - [x] `fetchGames(userId): Promise<Game[]>` 実装
  - [x] `upsertGame(game): Promise<void>` 実装
- [x] `lib/supabase/queries/lineups.ts` を作成
  - [x] `fetchLineups(gameId): Promise<Lineup[]>` 実装
  - [x] `upsertLineups(gameId, lineups): Promise<void>` 実装
- [x] `gameStore.ts` に Supabase 同期を統合
  - [x] `syncToSupabase(gameId): Promise<void>` アクション追加
  - [x] `loadFromSupabase(userId): Promise<void>` アクション追加

## フェーズ5: ホームページ試合一覧

- [x] `components/game/GameCard.tsx` を作成
  - [x] 試合日・チーム名・ステータスを表示
  - [x] スコア入力ページへのリンク（`/games/[id]`）
  - [x] 成績ページへのリンク（`/games/[id]/stats`）
- [x] `app/page.tsx` を更新
  - [x] `useGameStore` から games を取得
  - [x] 試合一覧を GameCard で表示
  - [x] 新規作成ボタンを保持

## フェーズ6: SQL マイグレーション

- [x] `supabase/migrations/001_initial.sql` を作成
  - [x] `games` テーブル定義
  - [x] `lineups` テーブル定義
  - [x] RLS ポリシー（user_id ベース）

## フェーズ7: テスト追加

- [x] `lib/supabase/queries/games.test.ts` を作成
  - [x] Supabase クライアントのモック
  - [x] `fetchGames` のテスト
  - [x] `upsertGame` のテスト

## フェーズ8: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run type-check`

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `Database` インターフェースの型定義で、`supabase-js` の `GenericTable` が `Relationships: GenericRelationship[]` を必須とすること、`GenericSchema` が `Views`・`Functions`・`Enums`・`CompositeTypes` を必要とすることが実装時に判明。`types.ts` を Supabase auto-gen と同じ形式（`{ [_ in never]: never }`）に合わせる必要があった。
- `CreateGameInput` に `userId` フィールドの追加が必要と判明。`createGame` 呼び出し側（`GameSetupForm`・`QuickStartButton`）を `useAuth()` を使用して修正。
- `app/page.tsx` での `loadFromSupabase` の呼び出しが計画段階では曖昧だったが、`useEffect` + `useAuth` でマウント時に同期する実装を追加。
- `loadFromSupabase` のラインナップ取得を直列ループから `Promise.all` 並列取得に変更。

**新たに必要になったタスク**:
- `app/page.test.tsx` に `useAuth` のモックを追加（`Home` が `useAuth` を使用するようになったため）
- `store/gameStore.test.ts` の全 `createGame` 呼び出しに `userId` パラメータを追加

### 学んだこと

**技術的な学び**:
- `@supabase/supabase-js` の型システムは `GenericTable`・`GenericSchema` という型制約を持つ。手書きの `Database` 型はこれに厳密に準拠しないと `upsert()` の引数が `never` に解決される。Supabase CLI の `gen types typescript` が出力する形式（`{ [_ in never]: never }` 等）に合わせるのが安全。
- `createGame` のような State 生成関数に認証情報が必要な場合、呼び出し元（UI コンポーネント）から渡す設計が clean。Store 内で `useAuth` を呼ぶことは React Hooks のルール違反になる。
- Vitest で `useAuth` フックを使うコンポーネントをテストする際、`vi.mock('@/hooks/useAuth', ...)` でモック化が必要。

### 次回への改善提案
- `lib/supabase/types.ts` は将来的に Supabase CLI の `supabase gen types typescript --local` で自動生成に切り替えることで、スキーマ変更時の型ズレを防止できる。
- `syncToSupabase` の呼び出し箇所（ゲーム作成直後・スコア入力完了時）を実装し、Supabase への保存タイミングを明確にすること。
- `lib/supabase/queries/lineups.ts` のユニットテスト（`lineups.test.ts`）がまだ未作成。次回追加推奨。
