# タスクリスト: Supabase CLIを使ったチームテーブル実装

## Phase 1: マイグレーション作成

- [x] `supabase/migrations/002_teams.sql` を新規作成
  - `teams(id, name, created_by, created_at)` テーブル
  - `team_members(team_id, user_id, role, joined_at)` テーブル
  - `games` テーブルに `team_id` カラム追加（nullable）
  - インデックス追加
  - RLS 有効化と teams/team_members ポリシー設定
  - games の既存 RLS ポリシーを削除して team_id 対応ポリシーに置き換え
  - `handle_new_user()` トリガー関数とトリガー設定

## Phase 2: TypeScript 型定義更新

- [x] `lib/supabase/types.ts` に `teams`/`team_members` の型を追加
- [x] `lib/supabase/types.ts` の `GameRow`/`GameInsert` に `team_id` を追加
- [x] `types/game.ts` の `Game` 型に `teamId?: string` を追加
- [x] `types/game.ts` の `CreateGameInput` に `teamId?: string` を追加

## Phase 3: teams クエリ新規作成

- [x] `lib/supabase/queries/teams.ts` を新規作成（`fetchCurrentTeam(userId)` 関数）

## Phase 4: games クエリ更新

- [x] `lib/supabase/queries/games.ts`: `fetchGames` を引数なしに変更（RLS に依存）
- [x] `lib/supabase/queries/games.ts`: `upsertGame` に `team_id` を追加
- [x] `lib/supabase/queries/games.test.ts`: `fetchGames()` 呼び出しを引数なしに更新

## Phase 5: gameStore 更新

- [x] `store/gameStore.ts`: `loadFromSupabase(userId)` を `loadFromSupabase()` に変更（引数なし）
- [x] `store/gameStore.ts`: `createGame` で `teamId` を受け取り `game.teamId` に設定
- [x] `store/gameStore.ts`: `GameState` の `loadFromSupabase` シグネチャを更新

## Phase 6: useAuth 更新

- [x] `hooks/useAuth.ts`: `AuthState` に `teamId: string | null` を追加
- [x] `hooks/useAuth.ts`: `useEffect` 内で `fetchCurrentTeam(userId)` を呼び出す
- [x] `hooks/useAuth.ts`: `teamId` を返すように更新

## Phase 7: アプリケーション層更新

- [x] `app/page.tsx`: `loadFromSupabase()` の呼び出しを引数なしに変更
- [x] `components/game-setup/GameSetupForm.tsx`: `teamId` を `createGame` に渡す

## 実装後の振り返り

**実装完了日**: 2026-02-18

**計画と実績の差分**:
- `lineups` テーブルの RLS ポリシー更新が当初計画に含まれていなかったが、implementation-validator の指摘で追加した（チームゲームにもメンバーがアクセスできるよう必須の変更）
- `handle_new_user` トリガーで `email` が null の場合の対処（`COALESCE` の 3 段構成）を追加
- `useAuth` に `resolveTeam()` ヘルパーを切り出し、エラーハンドリングと `isLoading` 管理を一元化
- `app/page.tsx` のフィルタを `game.userId === user?.id || game.teamId === teamId` に更新（チームメンバーのゲームも表示可能に）

**学んだこと**:
- Supabase JS クライアントでリレーション JOIN (`select('team_id, teams(id, name)')`) を行う場合、`Database` 型にリレーション情報がないと型エラーになるため `as unknown as` の二段キャストが必要
- `handle_new_user()` は `auth.users` テーブルへのトリガーなので `security definer` が必須（`public.teams` への INSERT に必要な権限を関数作成者の権限で実行）
- `onAuthStateChange` コールバック内でも `isLoading` を管理しないと、再認証時にローディング状態が不整合になる
- `lineups` の RLS を `games` の RLS 変更に合わせて更新することを忘れやすい（テーブルをまたぐ RLS 変更時は JOIN 先テーブルのポリシーも確認が必要）

**テスト**: 全99テスト通過。lint・型チェックともにエラーなし。

**次回への改善提案**:
- `fetchCurrentTeam` のユニットテスト追加（正常系・チームなし・エラー系）
- `useAuth` のユニットテスト追加（`isLoading` の状態遷移、チームフォールバック動作）
- 将来メンバー追加機能を実装する際は `team_members` に UPDATE/DELETE RLS ポリシーを追加する
- `supabase gen types typescript --project-id [id]` を実行して `lib/supabase/types.ts` を自動生成に切り替えると型の手動管理が不要になる
