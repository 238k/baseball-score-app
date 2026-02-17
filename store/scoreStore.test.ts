import { describe, it, expect, beforeEach } from 'vitest';
import { useScoreStore } from './scoreStore';

const BATTER = { batterLineupId: 'batter-1', batterName: '田中', battingOrder: 1 };

function resetStore() {
  useScoreStore.setState({
    gameId: null,
    currentInning: 1,
    currentTopBottom: 'top',
    currentBatterIndex: 0,
    outs: 0,
    runnersOnBase: { 1: null, 2: null, 3: null },
    pitches: [],
    plateAppearances: [],
    phase: 'pitching',
    sequenceCounter: 0,
    undoStack: [],
  });
}

beforeEach(() => {
  resetStore();
  useScoreStore.getState().initGame('game-1');
});

describe('scoreStore', () => {
  describe('recordPitch: 四球自動確定', () => {
    it('ボール4球で四球が自動確定し次打者に移行する', () => {
      for (let i = 0; i < 4; i++) {
        useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.plateAppearances).toHaveLength(1);
      expect(s.plateAppearances[0].result).toBe('四球');
      expect(s.currentBatterIndex).toBe(1);
      expect(s.phase).toBe('pitching');
      expect(s.pitches).toHaveLength(0);
    });
  });

  describe('recordPitch: 三振自動確定', () => {
    it('3ストライクで三振振りが自動確定しアウトカウントが増える', () => {
      for (let i = 0; i < 3; i++) {
        useScoreStore.getState().recordPitch('strike_swinging', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.plateAppearances[0].result).toBe('三振振り');
      expect(s.outs).toBe(1);
    });

    it('3ストライクで三振見が自動確定する', () => {
      for (let i = 0; i < 3; i++) {
        useScoreStore.getState().recordPitch('strike_looking', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.plateAppearances[0].result).toBe('三振見');
    });
  });

  describe('recordPitch: インプレー', () => {
    it('インプレーでフェーズが result になる', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().phase).toBe('result');
    });
  });

  describe('recordResult: アウトカウント', () => {
    it('アウト結果でアウトカウントが増加する', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('ゴロ', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().outs).toBe(1);
    });

    it('3アウトで inning_end フェーズになる', () => {
      for (let i = 0; i < 3; i++) {
        useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
        useScoreStore.getState().recordResult('フライ', BATTER.batterLineupId, BATTER.batterName, i + 1);
      }
      expect(useScoreStore.getState().phase).toBe('inning_end');
      expect(useScoreStore.getState().outs).toBe(3);
    });
  });

  describe('recordResult: 次打者移行', () => {
    it('安打確定後に次の打者インデックスに移行する', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().currentBatterIndex).toBe(1);
    });
  });

  describe('undo', () => {
    it('recordPitch の直前状態に戻る', () => {
      useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().pitches).toHaveLength(1);
      useScoreStore.getState().undo();
      expect(useScoreStore.getState().pitches).toHaveLength(0);
    });

    it('undoStack が空のときは何もしない', () => {
      expect(() => useScoreStore.getState().undo()).not.toThrow();
    });
  });

  describe('advanceInning', () => {
    it('表→裏でイニング番号は変わらず topBottom が bottom になる', () => {
      // 3アウト状態を作成
      for (let i = 0; i < 3; i++) {
        useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
        useScoreStore.getState().recordResult('ゴロ', BATTER.batterLineupId, BATTER.batterName, i + 1);
      }
      useScoreStore.getState().advanceInning();
      const s = useScoreStore.getState();
      expect(s.currentInning).toBe(1);
      expect(s.currentTopBottom).toBe('bottom');
      expect(s.outs).toBe(0);
      expect(s.currentBatterIndex).toBe(0);
      expect(s.phase).toBe('pitching');
    });

    it('裏→表で次イニングの表になる', () => {
      useScoreStore.setState({ currentTopBottom: 'bottom' });
      useScoreStore.getState().advanceInning();
      const s = useScoreStore.getState();
      expect(s.currentInning).toBe(2);
      expect(s.currentTopBottom).toBe('top');
    });
  });
});
