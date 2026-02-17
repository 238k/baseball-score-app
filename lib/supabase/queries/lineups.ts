import type { Lineup, FieldingPosition, SubstitutionType } from '@/types/game';
import { createClient } from '../client';

function toLineup(row: {
  id: string;
  game_id: string;
  side: 'home' | 'away';
  batting_order: number;
  cycle: number;
  player_name: string;
  position: number;
  is_starter: boolean;
  entered_inning: number | null;
  substitution_type: '代打' | '代走' | '守備交代' | '投手交代' | null;
}): Lineup {
  return {
    id: row.id,
    gameId: row.game_id,
    side: row.side,
    battingOrder: row.batting_order,
    cycle: row.cycle,
    playerName: row.player_name,
    position: row.position as FieldingPosition,
    isStarter: row.is_starter,
    enteredInning: row.entered_inning ?? undefined,
    substitutionType: row.substitution_type as SubstitutionType | undefined,
  };
}

/** 指定試合のラインナップ一覧を取得する */
export async function fetchLineups(gameId: string): Promise<Lineup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lineups')
    .select('*')
    .eq('game_id', gameId)
    .order('batting_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toLineup);
}

/** ラインナップを Supabase に保存（upsert） */
export async function upsertLineups(gameId: string, lineups: Lineup[]): Promise<void> {
  if (lineups.length === 0) return;

  const supabase = createClient();
  const { error } = await supabase.from('lineups').upsert(
    lineups.map((l) => ({
      id: l.id,
      game_id: gameId,
      side: l.side,
      batting_order: l.battingOrder,
      cycle: l.cycle,
      player_name: l.playerName,
      position: l.position,
      is_starter: l.isStarter,
      entered_inning: l.enteredInning ?? null,
      substitution_type: l.substitutionType ?? null,
    }))
  );

  if (error) throw error;
}
