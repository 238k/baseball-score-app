import { describe, it, expect, beforeEach } from 'vitest';
import { useScoreStore } from './scoreStore';

const BATTER = { batterLineupId: 'batter-1', batterName: '田中', battingOrder: 1 };
const RUNNER_1 = 'runner-1st';
const RUNNER_2 = 'runner-2nd';
const RUNNER_3 = 'runner-3rd';

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
    pendingBatterLineupId: null,
    pendingBatterDestination: null,
    undoStack: [],
    redoStack: [],
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

    it('1塁走者がいる状態で四球を取るとフォースアドバンスが適用される', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: null, 3: null } });
      for (let i = 0; i < 4; i++) {
        useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.runnersOnBase[2]).toBe(RUNNER_1);              // 元1塁走者が2塁へ
      expect(s.runnersOnBase[3]).toBeNull();                  // 3塁は空
    });

    it('満塁で四球を取ると3塁走者が得点してフォースアドバンスが適用される', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: RUNNER_2, 3: RUNNER_3 } });
      for (let i = 0; i < 4; i++) {
        useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.runnersOnBase[2]).toBe(RUNNER_1);              // 元1塁走者が2塁へ
      expect(s.runnersOnBase[3]).toBe(RUNNER_2);              // 元2塁走者が3塁へ
      // 元3塁走者は得点（塁から消える）
    });
  });

  describe('recordPitch: 死球', () => {
    it('死球で1塁走者がいるとフォースアドバンスが適用される', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: null, 3: null } });
      useScoreStore.getState().recordPitch('hbp', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId);
      expect(s.runnersOnBase[2]).toBe(RUNNER_1);
      expect(s.phase).toBe('pitching');
    });
  });

  describe('満塁四球・死球の得点計算', () => {
    it('表イニングに満塁四球で awayScore が +1 される', () => {
      useScoreStore.setState({
        currentTopBottom: 'top',
        runnersOnBase: { 1: RUNNER_1, 2: RUNNER_2, 3: RUNNER_3 },
        awayScore: 0,
        homeScore: 0,
      });
      for (let i = 0; i < 4; i++) {
        useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.awayScore).toBe(1);
      expect(s.homeScore).toBe(0);
    });

    it('裏イニングに満塁死球で homeScore が +1 される', () => {
      useScoreStore.setState({
        currentTopBottom: 'bottom',
        runnersOnBase: { 1: RUNNER_1, 2: RUNNER_2, 3: RUNNER_3 },
        awayScore: 0,
        homeScore: 0,
      });
      useScoreStore.getState().recordPitch('hbp', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.homeScore).toBe(1);
      expect(s.awayScore).toBe(0);
    });

    it('満塁でない四球・死球ではスコアが変わらない', () => {
      useScoreStore.setState({
        currentTopBottom: 'top',
        runnersOnBase: { 1: RUNNER_1, 2: null, 3: null },
        awayScore: 2,
        homeScore: 1,
      });
      for (let i = 0; i < 4; i++) {
        useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      }
      const s = useScoreStore.getState();
      expect(s.awayScore).toBe(2);
      expect(s.homeScore).toBe(1);

      // 死球も同様
      useScoreStore.setState({
        currentBatterIndex: useScoreStore.getState().currentBatterIndex,
        runnersOnBase: { 1: null, 2: RUNNER_2, 3: null },
        awayScore: 2,
        homeScore: 1,
        pitches: [],
        phase: 'pitching',
      });
      useScoreStore.getState().recordPitch('hbp', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s2 = useScoreStore.getState();
      expect(s2.awayScore).toBe(2);
      expect(s2.homeScore).toBe(1);
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

  describe('recordResult: runner_advance フェーズ遷移', () => {
    it('単打後に runner_advance フェーズへ遷移し pendingBatterDestination が 1 になる', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.phase).toBe('runner_advance');
      expect(s.pendingBatterDestination).toBe(1);
      expect(s.pendingBatterLineupId).toBe(BATTER.batterLineupId);
      // 次打者へはまだ移行していない
      expect(s.currentBatterIndex).toBe(0);
    });

    it('走者なし・アウトの場合は runner_advance をスキップして次打者へ移行する', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('ゴロ', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.phase).toBe('pitching');
      expect(s.currentBatterIndex).toBe(1);
    });

    it('走者がいてアウトになった場合も runner_advance フェーズへ遷移する', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: null, 3: null } });
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('フライ', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.phase).toBe('runner_advance');
    });
  });

  describe('confirmRunners', () => {
    it('confirmRunners で runnersOnBase が更新され次打者へ移行する', () => {
      // 単打 → runner_advance フェーズへ
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);

      // 走者なし・打者のみ1塁へ（空のdestinations）
      useScoreStore.getState().confirmRunners({});
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.currentBatterIndex).toBe(1);
      expect(s.phase).toBe('pitching');
      expect(s.pendingBatterLineupId).toBeNull();
      expect(s.pendingBatterDestination).toBeNull();
    });

    it('走者が移動先に正しく配置される', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: null, 3: null } });
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);

      // RUNNER_1 は2塁へ
      useScoreStore.getState().confirmRunners({ [RUNNER_1]: 2 });
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.runnersOnBase[2]).toBe(RUNNER_1);              // 走者が2塁
      expect(s.runnersOnBase[3]).toBeNull();
    });

    it('走者がアウトになった場合は塁から消えアウトカウントが増加する', () => {
      useScoreStore.setState({ runnersOnBase: { 1: RUNNER_1, 2: null, 3: null } });
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);

      // RUNNER_1 はアウト
      useScoreStore.getState().confirmRunners({ [RUNNER_1]: 'out' });
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.runnersOnBase[2]).toBeNull();                  // アウトになったので消える
      expect(s.outs).toBe(1);                                 // アウトカウント増加
    });

    it('走者が得点した場合は塁から消える', () => {
      useScoreStore.setState({ runnersOnBase: { 1: null, 2: null, 3: RUNNER_3 } });
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);

      // RUNNER_3 は得点
      useScoreStore.getState().confirmRunners({ [RUNNER_3]: 4 });
      const s = useScoreStore.getState();
      expect(s.runnersOnBase[1]).toBe(BATTER.batterLineupId); // 打者が1塁
      expect(s.runnersOnBase[3]).toBeNull();                  // 得点したので消える
    });
  });

  describe('recordResult: 野選・エラーはアウトにならない', () => {
    it('野選はアウトカウントが増加せず打者が1塁に出塁する', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('野選', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.outs).toBe(0);
      expect(s.phase).toBe('runner_advance');
      expect(s.pendingBatterDestination).toBe(1);
    });

    it('エラーはアウトカウントが増加せず打者が1塁に出塁する', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('エラー', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      const s = useScoreStore.getState();
      expect(s.outs).toBe(0);
      expect(s.pendingBatterDestination).toBe(1);
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

    it('runner_advance フェーズから undo で result フェーズに戻る', () => {
      useScoreStore.getState().recordPitch('in_play', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().recordResult('単打', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().phase).toBe('runner_advance');
      useScoreStore.getState().undo();
      expect(useScoreStore.getState().phase).toBe('result');
    });
  });

  describe('redo', () => {
    it('undo した操作を redo で復元できる', () => {
      useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().pitches).toHaveLength(1);
      useScoreStore.getState().undo();
      expect(useScoreStore.getState().pitches).toHaveLength(0);
      useScoreStore.getState().redo();
      expect(useScoreStore.getState().pitches).toHaveLength(1);
    });

    it('redoStack が空のときは何もしない', () => {
      expect(() => useScoreStore.getState().redo()).not.toThrow();
    });

    it('新しい操作を行うと redoStack がクリアされる', () => {
      useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().undo();
      expect(useScoreStore.getState().redoStack).toHaveLength(1);
      // 新しい操作
      useScoreStore.getState().recordPitch('strike_looking', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      expect(useScoreStore.getState().redoStack).toHaveLength(0);
    });

    it('undo → redo で undoStack に現在の状態が積まれる', () => {
      useScoreStore.getState().recordPitch('ball', BATTER.batterLineupId, BATTER.batterName, BATTER.battingOrder);
      useScoreStore.getState().undo();
      const undoLenBefore = useScoreStore.getState().undoStack.length;
      useScoreStore.getState().redo();
      expect(useScoreStore.getState().undoStack).toHaveLength(undoLenBefore + 1);
      expect(useScoreStore.getState().redoStack).toHaveLength(0);
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
