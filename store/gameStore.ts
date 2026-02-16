import { create } from 'zustand';
import type { Game, Lineup, CreateGameInput } from '@/types/game';

interface GameState {
  games: Game[];
  lineups: Record<string, Lineup[]>;

  createGame: (input: CreateGameInput) => Game;
  addLineupsForGame: (gameId: string, newLineups: Omit<Lineup, 'id'>[]) => Lineup[];
  getGame: (gameId: string) => Game | undefined;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  lineups: {},

  createGame: (input) => {
    const now = new Date().toISOString();
    const game: Game = {
      id: crypto.randomUUID(),
      // Supabase未接続のため userId は仮値
      userId: 'local',
      date: input.date,
      venue: input.venue,
      homeTeamName: input.homeTeamName,
      awayTeamName: input.awayTeamName,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ games: [...state.games, game] }));
    return game;
  },

  addLineupsForGame: (gameId, newLineups) => {
    const created: Lineup[] = newLineups.map((l) => ({
      ...l,
      id: crypto.randomUUID(),
    }));
    set((state) => ({
      lineups: {
        ...state.lineups,
        [gameId]: [...(state.lineups[gameId] ?? []), ...created],
      },
    }));
    return created;
  },

  getGame: (gameId) => {
    return get().games.find((g) => g.id === gameId);
  },
}));
