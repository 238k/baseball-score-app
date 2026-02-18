import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, Lineup, CreateGameInput, FieldingPosition, SubstitutionType } from '@/types/game';
import { fetchGames, upsertGame } from '@/lib/supabase/queries/games';
import { fetchLineups, upsertLineups } from '@/lib/supabase/queries/lineups';

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
  addGame: (game: Game) => void;
  syncToSupabase: (gameId: string) => Promise<void>;
  loadFromSupabase: (userId: string) => Promise<void>;
  clearAll: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: [],
      lineups: {},

      createGame: (input) => {
        const now = new Date().toISOString();
        const game: Game = {
          id: crypto.randomUUID(),
          userId: input.userId,
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

      // Supabase から取得したゲームをローカルストアに追加
      addGame: (game) => {
        set((state) => {
          const exists = state.games.some((g) => g.id === game.id);
          if (exists) return state;
          return { games: [...state.games, game] };
        });
      },

      // 指定試合のデータを Supabase に同期する
      syncToSupabase: async (gameId) => {
        const state = get();
        const game = state.games.find((g) => g.id === gameId);
        if (!game) return;

        try {
          await upsertGame(game);
          const lineups = state.lineups[gameId] ?? [];
          if (lineups.length > 0) {
            await upsertLineups(gameId, lineups);
          }
        } catch (error) {
          throw error;
        }
      },

      // ローカルストアを全クリア（ログアウト時に呼び出す）
      clearAll: () => {
        set({ games: [], lineups: {} });
      },

      // Supabase から全試合を取得してローカルストアに統合する
      loadFromSupabase: async (userId) => {
        const remoteGames = await fetchGames(userId);
        set((state) => {
          const localIds = new Set(state.games.map((g) => g.id));
          const newGames = remoteGames.filter((g) => !localIds.has(g.id));
          return { games: [...state.games, ...newGames] };
        });

        // 各試合のラインナップを並列取得
        const lineupResults = await Promise.all(
          remoteGames.map((game) =>
            fetchLineups(game.id).then((lineups) => ({ gameId: game.id, lineups }))
          )
        );

        for (const { gameId, lineups: remoteLineups } of lineupResults) {
          if (remoteLineups.length > 0) {
            set((state) => {
              const existing = state.lineups[gameId] ?? [];
              const existingIds = new Set(existing.map((l) => l.id));
              const newLineups = remoteLineups.filter((l) => !existingIds.has(l.id));
              return {
                lineups: {
                  ...state.lineups,
                  [gameId]: [...existing, ...newLineups],
                },
              };
            });
          }
        }
      },
    }),
    {
      name: 'baseball-score-game-store',
      // アクション関数は永続化しない（データのみ）
      partialize: (state) => ({ games: state.games, lineups: state.lineups }),
    }
  )
);
