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

  describe('getGame', () => {
    it('存在しないIDはundefinedを返す', () => {
      expect(useGameStore.getState().getGame('not-found')).toBeUndefined();
    });

    it('作成したゲームを取得できる', () => {
      const game = useGameStore.getState().createGame({
        homeTeamName: 'A',
        awayTeamName: 'B',
        date: '2026-02-17',
      });

      expect(useGameStore.getState().getGame(game.id)).toEqual(game);
    });
  });
});
