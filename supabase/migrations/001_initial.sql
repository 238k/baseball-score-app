-- 野球スコアブック 初期スキーマ
-- Supabase ダッシュボード > SQL Editor で実行する

-- games テーブル
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  venue text,
  home_team_name text not null check (char_length(home_team_name) between 1 and 50),
  away_team_name text not null check (char_length(away_team_name) between 1 and 50),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- games インデックス
create index if not exists games_user_id_idx on games(user_id);
create index if not exists games_date_idx on games(date desc);

-- lineups テーブル
create table if not exists lineups (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  batting_order int not null check (batting_order between 1 and 9),
  cycle int not null default 1,
  player_name text not null check (char_length(player_name) between 1 and 50),
  position int not null check (position between 1 and 10),
  is_starter boolean not null default true,
  entered_inning int,
  substitution_type text check (substitution_type in ('代打', '代走', '守備交代', '投手交代')),
  unique (game_id, side, batting_order, cycle)
);

-- lineups インデックス
create index if not exists lineups_game_id_idx on lineups(game_id);

-- Row Level Security を有効化
alter table games enable row level security;
alter table lineups enable row level security;

-- games RLS ポリシー: 自分の試合のみ操作可能
create policy "games_owner_select" on games
  for select using (auth.uid() = user_id);

create policy "games_owner_insert" on games
  for insert with check (auth.uid() = user_id);

create policy "games_owner_update" on games
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "games_owner_delete" on games
  for delete using (auth.uid() = user_id);

-- lineups RLS ポリシー: 自分の試合のラインナップのみ操作可能
create policy "lineups_owner_select" on lineups
  for select using (
    exists (select 1 from games where games.id = lineups.game_id and games.user_id = auth.uid())
  );

create policy "lineups_owner_insert" on lineups
  for insert with check (
    exists (select 1 from games where games.id = lineups.game_id and games.user_id = auth.uid())
  );

create policy "lineups_owner_update" on lineups
  for update using (
    exists (select 1 from games where games.id = lineups.game_id and games.user_id = auth.uid())
  );

create policy "lineups_owner_delete" on lineups
  for delete using (
    exists (select 1 from games where games.id = lineups.game_id and games.user_id = auth.uid())
  );

-- updated_at の自動更新トリガー
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_games_updated_at
  before update on games
  for each row execute function update_updated_at_column();
