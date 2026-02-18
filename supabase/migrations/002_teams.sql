-- チームテーブル追加マイグレーション
-- teams テーブルおよび team_members テーブルを新設し、
-- games に team_id を追加してチーム単位の試合管理に対応する

-- teams テーブル
create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 50),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- team_members テーブル（将来の複数メンバー対応）
create table if not exists team_members (
  team_id   uuid not null references teams(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'owner' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- games テーブルに team_id カラム追加（nullable: 既存データとの後方互換性）
alter table games add column if not exists team_id uuid references teams(id) on delete cascade;

-- インデックス
create index if not exists teams_created_by_idx on teams(created_by);
create index if not exists team_members_user_id_idx on team_members(user_id);
create index if not exists games_team_id_idx on games(team_id);

-- RLS 有効化
alter table teams enable row level security;
alter table team_members enable row level security;

-- teams RLS ポリシー: チームメンバーのみ参照可能
create policy "teams_member_select" on teams
  for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

create policy "teams_member_insert" on teams
  for insert with check (created_by = auth.uid());

-- team_members RLS ポリシー: 自分のメンバーシップのみ参照可能
create policy "team_members_self_select" on team_members
  for select using (user_id = auth.uid());

create policy "team_members_self_insert" on team_members
  for insert with check (user_id = auth.uid());

-- games の既存 RLS ポリシーを削除して team_id 対応ポリシーに置き換え
drop policy if exists "games_owner_select" on games;
drop policy if exists "games_owner_insert" on games;
drop policy if exists "games_owner_update" on games;
drop policy if exists "games_owner_delete" on games;

-- games RLS: team_id がある場合はチームメンバー、ない場合は user_id オーナー（後方互換）
create policy "games_team_select" on games
  for select using (
    (team_id is not null and exists (
      select 1 from team_members
      where team_members.team_id = games.team_id
        and team_members.user_id = auth.uid()
    ))
    or
    (team_id is null and auth.uid() = user_id)
  );

create policy "games_team_insert" on games
  for insert with check (
    auth.uid() = user_id
    and (
      team_id is null
      or exists (
        select 1 from team_members
        where team_members.team_id = games.team_id
          and team_members.user_id = auth.uid()
      )
    )
  );

create policy "games_team_update" on games
  for update
  using (
    (team_id is not null and exists (
      select 1 from team_members
      where team_members.team_id = games.team_id
        and team_members.user_id = auth.uid()
    ))
    or
    (team_id is null and auth.uid() = user_id)
  )
  with check (
    (team_id is not null and exists (
      select 1 from team_members
      where team_members.team_id = games.team_id
        and team_members.user_id = auth.uid()
    ))
    or
    (team_id is null and auth.uid() = user_id)
  );

create policy "games_team_delete" on games
  for delete using (
    (team_id is not null and exists (
      select 1 from team_members
      where team_members.team_id = games.team_id
        and team_members.user_id = auth.uid()
    ))
    or
    (team_id is null and auth.uid() = user_id)
  );

-- lineups RLS: チームゲームにもチームメンバーがアクセスできるよう既存ポリシーを更新
drop policy if exists "lineups_owner_select" on lineups;
drop policy if exists "lineups_owner_insert" on lineups;
drop policy if exists "lineups_owner_update" on lineups;
drop policy if exists "lineups_owner_delete" on lineups;

create policy "lineups_team_select" on lineups
  for select using (
    exists (
      select 1 from games
      where games.id = lineups.game_id
        and (
          (games.team_id is not null and exists (
            select 1 from team_members
            where team_members.team_id = games.team_id
              and team_members.user_id = auth.uid()
          ))
          or (games.team_id is null and games.user_id = auth.uid())
        )
    )
  );

create policy "lineups_team_insert" on lineups
  for insert with check (
    exists (
      select 1 from games
      where games.id = lineups.game_id
        and (
          (games.team_id is not null and exists (
            select 1 from team_members
            where team_members.team_id = games.team_id
              and team_members.user_id = auth.uid()
          ))
          or (games.team_id is null and games.user_id = auth.uid())
        )
    )
  );

create policy "lineups_team_update" on lineups
  for update using (
    exists (
      select 1 from games
      where games.id = lineups.game_id
        and (
          (games.team_id is not null and exists (
            select 1 from team_members
            where team_members.team_id = games.team_id
              and team_members.user_id = auth.uid()
          ))
          or (games.team_id is null and games.user_id = auth.uid())
        )
    )
  );

create policy "lineups_team_delete" on lineups
  for delete using (
    exists (
      select 1 from games
      where games.id = lineups.game_id
        and (
          (games.team_id is not null and exists (
            select 1 from team_members
            where team_members.team_id = games.team_id
              and team_members.user_id = auth.uid()
          ))
          or (games.team_id is null and games.user_id = auth.uid())
        )
    )
  );

-- ユーザー登録時に自動でチームとメンバーシップを作成するトリガー
create or replace function handle_new_user()
returns trigger as $$
declare
  new_team_id uuid;
begin
  -- チームを作成（チーム名は user_metadata.team_name、なければメールのローカル部分）
  insert into public.teams (name, created_by)
  values (
    coalesce(
      new.raw_user_meta_data->>'team_name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'マイチーム'
    ),
    new.id
  )
  returning id into new_team_id;

  -- オーナーとしてチームメンバーに追加
  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- auth.users への INSERT 後にトリガーを実行
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
