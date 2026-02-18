import type { Game } from '@/types/game';
import { createClient } from '../client';

function toGame(row: {
  id: string;
  user_id: string;
  team_id: string | null;
  date: string;
  venue: string | null;
  home_team_name: string;
  away_team_name: string;
  status: 'in_progress' | 'completed';
  finish_reason?: string | null;
  created_at: string;
  updated_at: string;
}): Game {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id ?? undefined,
    date: row.date,
    venue: row.venue ?? undefined,
    homeTeamName: row.home_team_name,
    awayTeamName: row.away_team_name,
    status: row.status,
    finishReason: row.finish_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 認証ユーザーがアクセスできる試合一覧を取得する（RLS で自動フィルタリング） */
export async function fetchGames(): Promise<Game[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toGame);
}

/** 試合を Supabase に保存（存在しなければ INSERT、存在すれば UPDATE） */
export async function upsertGame(game: Game): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('games').upsert({
    id: game.id,
    user_id: game.userId,
    team_id: game.teamId ?? null,
    date: game.date,
    venue: game.venue ?? null,
    home_team_name: game.homeTeamName,
    away_team_name: game.awayTeamName,
    status: game.status,
    finish_reason: game.finishReason ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
