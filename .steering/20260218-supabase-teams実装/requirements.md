# 要件定義: Supabase CLIを使ったチームテーブル実装

## 背景

現在の実装では `user.user_metadata.team_name` にチーム名を文字列として保存している。
これは暫定的な実装であり、将来的に複数メンバーのチームをサポートするためには
DBレベルでチームを管理する必要がある。

## 目的

- `teams` テーブル / `team_members` テーブルを新設し、チームをDB管理に移行する
- `games.team_id` を追加し、試合をチーム単位で管理する
- RLS をチームメンバーベースに更新する
- サインアップ時に自動でチームを作成するトリガーを設置する

## 機能要件

### データベース

1. `teams(id, name, created_by, created_at)` テーブルを作成する
2. `team_members(team_id, user_id, role, joined_at)` テーブルを作成する
3. `games` テーブルに `team_id uuid references teams(id)` カラムを追加する（nullable）
4. `handle_new_user()` DB トリガーを設置し、ユーザー登録時に自動でチーム＋メンバー作成
   - チーム名は `new.raw_user_meta_data->>'team_name'` から取得

### RLS ポリシー

- `teams`: チームメンバーのみ参照可能
- `team_members`: 自分のメンバーシップのみ参照可能
- `games`: `team_id` があればチームメンバーが、`team_id` がなければ `user_id` オーナーが操作可能

### アプリケーション

1. `lib/supabase/types.ts` に `teams`/`team_members` の型定義を追加
2. `lib/supabase/queries/teams.ts` を新規作成（`fetchCurrentTeam` 関数）
3. `types/game.ts` の `Game` 型に `teamId?: string` を追加
4. `lib/supabase/queries/games.ts` を更新（`team_id` を含む upsert、RLS 依存の fetch）
5. `store/gameStore.ts` を更新（`teamId` を `createGame` / `addGame` に追加）
6. `hooks/useAuth.ts` を更新（DB からチーム情報を取得・`teamId` を返す）
7. `app/page.tsx` の `loadFromSupabase` 呼び出しを更新（userId → 引数なし）
8. `components/game-setup/GameSetupForm.tsx` を更新（`teamId` を `createGame` に渡す）

## 非機能要件

- 後方互換性: `team_id` は nullable のため既存データが壊れない
- セキュリティ: RLS で自分のチームのデータのみアクセス可能
- 将来拡張: `team_members` テーブルにより複数メンバー追加が可能な構造
