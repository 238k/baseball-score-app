import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

// 各テスト前にストアをリセット
beforeEach(() => {
  useGameStore.setState({ games: [], lineups: {} });
});

describe('gameStore', () => {
  describe('createGame', () => {
    it('正しいGame オブジェクトを返す', () => {
      const input = {
        userId: 'user-1',
        homeTeamName: '読売ジャイアンツ',
        awayTeamName: '阪神タイガース',
        date: '2026-02-17',
        venue: '東京ドーム',
      };

      const game = useGameStore.getState().createGame(input);

      expect(game.homeTeamName).toBe(input.homeTeamName);
      expect(game.awayTeamName).toBe(input.awayTeamName);
      expect(game.date).toBe(input.date);
      expect(game.venue).toBe(input.venue);
      expect(game.status).toBe('in_progress');
      expect(game.id).toBeTruthy();
    });

    it('games 配列に追加される', () => {
      useGameStore.getState().createGame({
        userId: 'user-1',
        homeTeamName: 'A',
        awayTeamName: 'B',
        date: '2026-02-17',
      });

      expect(useGameStore.getState().games).toHaveLength(1);
    });
  });

  describe('addLineupsForGame', () => {
    it('ラインナップを登録できる', () => {
      const game = useGameStore.getState().createGame({
        userId: 'user-1',
        homeTeamName: 'A',
        awayTeamName: 'B',
        date: '2026-02-17',
      });

      const created = useGameStore.getState().addLineupsForGame(game.id, [
        {
          gameId: game.id,
          side: 'home',
          battingOrder: 1,
          cycle: 1,
          playerName: '田中一',
          position: 7,
          isStarter: true,
        },
      ]);

      expect(created).toHaveLength(1);
      expect(created[0].playerName).toBe('田中一');
      expect(created[0].id).toBeTruthy();
      expect(useGameStore.getState().lineups[game.id]).toHaveLength(1);
    });
  });

  describe('substitutePlayer', () => {
    function setupGame() {
      const game = useGameStore.getState().createGame({
        userId: 'user-1',
        homeTeamName: 'A',
        awayTeamName: 'B',
        date: '2026-02-17',
      });
      useGameStore.getState().addLineupsForGame(game.id, [
        {
          gameId: game.id,
          side: 'home',
          battingOrder: 3,
          cycle: 1,
          playerName: '先発三番',
          position: 9,
          isStarter: true,
        },
      ]);
      return game;
    }

    it('代打: cycle+1 の新エントリが追加される', () => {
      const game = setupGame();
      useGameStore.getState().substitutePlayer({
        gameId: game.id,
        side: 'home',
        battingOrder: 3,
        playerName: '代打選手',
        position: 7,
        enteredInning: 5,
        substitutionType: '代打',
      });

      const lineups = useGameStore.getState().lineups[game.id];
      const substitutes = lineups.filter((l) => l.battingOrder === 3 && l.side === 'home');
      expect(substitutes).toHaveLength(2);

      const newEntry = substitutes.find((l) => l.cycle === 2);
      expect(newEntry).toBeDefined();
      expect(newEntry?.playerName).toBe('代打選手');
      expect(newEntry?.substitutionType).toBe('代打');
      expect(newEntry?.isStarter).toBe(false);
    });

    it('守備交代: 既存エントリの position が更新される', () => {
      const game = setupGame();
      useGameStore.getState().substitutePlayer({
        gameId: game.id,
        side: 'home',
        battingOrder: 3,
        playerName: '先発三番',
        position: 4,
        enteredInning: 5,
        substitutionType: '守備交代',
      });

      const lineups = useGameStore.getState().lineups[game.id];
      const entries = lineups.filter((l) => l.battingOrder === 3 && l.side === 'home');
      // 新エントリは追加されない
      expect(entries).toHaveLength(1);
      expect(entries[0].position).toBe(4);
    });

    it('2回目の代打: cycle が正しく 3 になる', () => {
      const game = setupGame();
      useGameStore.getState().substitutePlayer({
        gameId: game.id,
        side: 'home',
        battingOrder: 3,
        playerName: '代打A',
        position: 7,
        enteredInning: 5,
        substitutionType: '代打',
      });
      useGameStore.getState().substitutePlayer({
        gameId: game.id,
        side: 'home',
        battingOrder: 3,
        playerName: '代打B',
        position: 8,
        enteredInning: 7,
        substitutionType: '代打',
      });

      const lineups = useGameStore.getState().lineups[game.id];
      const entries = lineups.filter((l) => l.battingOrder === 3 && l.side === 'home');
      expect(entries).toHaveLength(3);
      expect(entries.find((l) => l.cycle === 3)?.playerName).toBe('代打B');
    });

    it('getCurrentBatter が最新 cycle を返す', () => {
      const game = setupGame();
      useGameStore.getState().substitutePlayer({
        gameId: game.id,
        side: 'home',
        battingOrder: 3,
        playerName: '代打選手',
        position: 7,
        enteredInning: 5,
        substitutionType: '代打',
      });

      const current = useGameStore.getState().getCurrentBatter(game.id, 'home', 3);
      expect(current?.playerName).toBe('代打選手');
      expect(current?.cycle).toBe(2);
    });
  });

  describe('getGame', () => {
    it('存在しないIDはundefinedを返す', () => {
      expect(useGameStore.getState().getGame('not-found')).toBeUndefined();
    });

    it('作成したゲームを取得できる', () => {
      const game = useGameStore.getState().createGame({
        userId: 'user-1',
        homeTeamName: 'A',
        awayTeamName: 'B',
        date: '2026-02-17',
      });

      expect(useGameStore.getState().getGame(game.id)).toEqual(game);
    });
  });
});
