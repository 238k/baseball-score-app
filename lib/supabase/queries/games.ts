import type { Game } from '@/types/game';
import { createClient } from '../client';

function toGame(row: {
  id: string;
  user_id: string;
  date: string;
  venue: string | null;
  home_team_name: string;
  away_team_name: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}): Game {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    venue: row.venue ?? undefined,
    homeTeamName: row.home_team_name,
    awayTeamName: row.away_team_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 認証ユーザーの試合一覧を取得する（日付降順） */
export async function fetchGames(userId: string): Promise<Game[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', userId)
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
    date: game.date,
    venue: game.venue ?? null,
    home_team_name: game.homeTeamName,
    away_team_name: game.awayTeamName,
    status: game.status,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
