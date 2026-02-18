# 設計書: Supabase CLIを使ったチームテーブル実装

## スキーマ設計

### teams テーブル

```sql
create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 50),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

### team_members テーブル

```sql
create table team_members (
  team_id   uuid not null references teams(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'owner' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
```

### games テーブル変更

```sql
alter table games add column team_id uuid references teams(id) on delete cascade;
```

- `nullable`: 既存データとの後方互換性のため
- 新規ゲームでは `team_id` を設定する

## DB トリガー設計

```sql
create or replace function handle_new_user()
returns trigger as $$
declare
  new_team_id uuid;
begin
  insert into public.teams (name, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'team_name', split_part(new.email, '@', 1)),
    new.id
  )
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**メリット**:
- サインアップ時にチームが自動作成される
- メール確認が必要な場合でも確実に作成される
- クライアントサイドのチーム作成コードが不要

## RLS ポリシー設計

### teams
- select: `team_members` に自分の `user_id` があるチームのみ

### team_members
- select: 自分の `user_id` のレコードのみ

### games（更新）
- 既存ポリシーを削除して更新
- `team_id` がある場合: `team_members` でチームメンバーシップを確認
- `team_id` が null の場合（後方互換）: `user_id = auth.uid()` で確認

## アプリケーション設計

### データフロー

```
signUp → user_metadata.team_name 設定
      → DB トリガー → teams INSERT + team_members INSERT（自動）

login → useAuth() → fetchCurrentTeam(userId)
      → teamId, teamName を返す

createGame → input.teamId を含める
          → gameStore → game.teamId 設定
          → syncToSupabase → upsertGame(game) → games.team_id 設定

fetchGames → RLS に依存（userId での filter は不要）
```

### 型定義変更

```ts
// types/game.ts
interface Game {
  teamId?: string;  // 追加
  ...
}

interface CreateGameInput {
  teamId?: string;  // 追加
  ...
}
```

### useAuth 変更

```ts
// hooks/useAuth.ts
interface AuthState {
  teamId: string | null;   // 追加
  teamName: string | null; // DB から取得（既存 user_metadata からのフォールバックも可）
  ...
}
```

`useEffect` 内で `fetchCurrentTeam(userId)` を呼び出し、DB からチーム情報を取得。
`user_metadata.team_name` はフォールバックとして保持（トリガー未適用の既存ユーザー対応）。

### fetchGames の変更

RLS に依存するため、`userId` パラメータは削除して引数なしで呼び出す:

```ts
export async function fetchGames(): Promise<Game[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('date', { ascending: false });
  ...
}
```

既存の `gameStore.loadFromSupabase(userId)` も引数なしに変更。

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `supabase/migrations/002_teams.sql` | 新規 | teams/team_members テーブル、トリガー、RLS |
| `lib/supabase/types.ts` | 更新 | teams/team_members 型追加、games に team_id 追加 |
| `lib/supabase/queries/teams.ts` | 新規 | fetchCurrentTeam 関数 |
| `lib/supabase/queries/games.ts` | 更新 | fetchGames（引数なし）、upsertGame（team_id 対応） |
| `types/game.ts` | 更新 | Game/CreateGameInput に teamId 追加 |
| `store/gameStore.ts` | 更新 | createGame/addGame に teamId 対応 |
| `hooks/useAuth.ts` | 更新 | DB からチーム情報取得、teamId 返却 |
| `app/page.tsx` | 更新 | loadFromSupabase の呼び出し変更 |
| `components/game-setup/GameSetupForm.tsx` | 更新 | teamId を createGame に渡す |
| `lib/supabase/queries/games.test.ts` | 更新 | fetchGames の引数なし対応 |
