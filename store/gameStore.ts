import { create } from 'zustand';
import type { Game, Lineup, CreateGameInput, FieldingPosition, SubstitutionType } from '@/types/game';

export interface SubstituteOptions {
  gameId: string;
  side: 'home' | 'away';
  battingOrder: number;
  playerName: string;
  position: FieldingPosition;
  enteredInning: number;
  substitutionType: SubstitutionType;
}

interface GameState {
  games: Game[];
  lineups: Record<string, Lineup[]>;

  createGame: (input: CreateGameInput) => Game;
  addLineupsForGame: (gameId: string, newLineups: Omit<Lineup, 'id'>[]) => Lineup[];
  getGame: (gameId: string) => Game | undefined;
  getCurrentBatter: (gameId: string, side: 'home' | 'away', battingOrder: number) => Lineup | undefined;
  substitutePlayer: (options: SubstituteOptions) => void;
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

  getCurrentBatter: (gameId, side, battingOrder) => {
    const entries = (get().lineups[gameId] ?? [])
      .filter((l) => l.side === side && l.battingOrder === battingOrder);
    if (entries.length === 0) return undefined;
    return entries.reduce((max, l) => (l.cycle > max.cycle ? l : max), entries[0]);
  },

  substitutePlayer: (options) => {
    const { gameId, side, battingOrder, playerName, position, enteredInning, substitutionType } = options;
    const currentLineups = get().lineups[gameId] ?? [];

    if (substitutionType === '守備交代') {
      // 既存エントリの position を更新（新エントリは追加しない）
      const maxCycle = currentLineups
        .filter((l) => l.side === side && l.battingOrder === battingOrder)
        .reduce((m, l) => Math.max(m, l.cycle), 0);

      const updated = currentLineups.map((l) => {
        if (l.side === side && l.battingOrder === battingOrder && l.cycle === maxCycle) {
          return { ...l, position };
        }
        return l;
      });
      set({ lineups: { ...get().lineups, [gameId]: updated } });
    } else {
      // 代打・代走・投手交代: cycle+1 の新エントリを追加
      const maxCycle = currentLineups
        .filter((l) => l.side === side && l.battingOrder === battingOrder)
        .reduce((m, l) => Math.max(m, l.cycle), 0);

      const newEntry: Lineup = {
        id: crypto.randomUUID(),
        gameId,
        side,
        battingOrder,
        cycle: maxCycle + 1,
        playerName,
        position,
        isStarter: false,
        enteredInning,
        substitutionType,
      };
      set({
        lineups: {
          ...get().lineups,
          [gameId]: [...currentLineups, newEntry],
        },
      });
    }
  },
}));
