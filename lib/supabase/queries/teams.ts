import { createClient } from '../client';

export interface TeamInfo {
  teamId: string;
  teamName: string;
}

/** 認証ユーザーが所属するチームを取得する（team_members JOIN teams） */
export async function fetchCurrentTeam(userId: string): Promise<TeamInfo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams(id, name)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !data) return null;

  const teams = data.teams as unknown as { id: string; name: string } | null;
  if (!teams) return null;

  return {
    teamId: teams.id,
    teamName: teams.name,
  };
}
