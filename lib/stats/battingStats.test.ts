import { describe, it, expect } from 'vitest';
import { computeBattingStats, computeAllBattingStats } from './battingStats';
import type { PlateAppearance } from '@/types/score';
import type { Lineup } from '@/types/game';

const lineup: Lineup = {
  id: 'l1',
  gameId: 'g1',
  side: 'away',
  battingOrder: 1,
  playerName: '鈴木',
  position: 8,
  cycle: 1,
  enteredInning: 1,
  isStarter: true,
};

function pa(result: PlateAppearance['result'], pitchCount = 4): PlateAppearance {
  return {
    id: `pa-${Math.random()}`,
    gameId: 'g1',
    inning: 1,
    topBottom: 'top',
    batterLineupId: 'l1',
    batterName: '鈴木',
    battingOrder: 1,
    result,
    pitchCount,
    pitches: [],
    sequenceInGame: 1,
  };
}

describe('computeBattingStats', () => {
  it('打席0の場合 AVG=null', () => {
    const stats = computeBattingStats([], lineup);
    expect(stats.pa).toBe(0);
    expect(stats.ab).toBe(0);
    expect(stats.avg).toBeNull();
    expect(stats.obp).toBeNull();
    expect(stats.slg).toBeNull();
    expect(stats.ops).toBeNull();
    expect(stats.ppa).toBeNull();
  });

  it('AVG計算: 3打数1安打 → .333', () => {
    const pas = [pa('単打'), pa('ゴロ'), pa('フライ')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.ab).toBe(3);
    expect(stats.h).toBe(1);
    expect(stats.avg).toBeCloseTo(0.333, 2);
  });

  it('犠打・犠飛は打数に含まれない', () => {
    const pas = [pa('単打'), pa('犠打'), pa('犠飛')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.pa).toBe(3);
    expect(stats.ab).toBe(1); // 犠打・犠飛除く
    expect(stats.sac).toBe(1);
    expect(stats.sf).toBe(1);
  });

  it('四球は打数に含まれない', () => {
    const pas = [pa('単打'), pa('四球')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.pa).toBe(2);
    expect(stats.ab).toBe(1);
    expect(stats.bb).toBe(1);
  });

  it('OBP計算: 安打+四球+死球 / (打数+四球+死球+犠飛)', () => {
    // 4打数1安打1四球1死球1犠飛 → OBP = 3/7
    const pas = [pa('単打'), pa('四球'), pa('死球'), pa('犠飛'), pa('ゴロ'), pa('フライ'), pa('ゴロ')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.obp).toBeCloseTo(3 / 7, 2);
  });

  it('SLG計算: 単打1・二塁打1・三塁打1・本塁打1 / 4打数', () => {
    const pas = [pa('単打'), pa('二塁打'), pa('三塁打'), pa('本塁打')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.ab).toBe(4);
    expect(stats.slg).toBeCloseTo((1 + 2 + 3 + 4) / 4, 2); // 2.5
  });

  it('OPS = OBP + SLG', () => {
    const pas = [pa('単打'), pa('ゴロ'), pa('ゴロ')];
    const stats = computeBattingStats(pas, lineup);
    if (stats.obp !== null && stats.slg !== null) {
      expect(stats.ops).toBeCloseTo(stats.obp + stats.slg, 5);
    }
  });

  it('P/PA計算: 投球数合計 / 打席数', () => {
    const pas = [pa('単打', 3), pa('ゴロ', 5)]; // 8球 / 2打席 = 4.0
    const stats = computeBattingStats(pas, lineup);
    expect(stats.ppa).toBeCloseTo(4.0, 1);
  });

  it('三振(両種類)を集計', () => {
    const pas = [pa('三振振り'), pa('三振見')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.so).toBe(2);
  });

  it('複数打席の集計', () => {
    const pas = [pa('本塁打'), pa('二塁打'), pa('単打'), pa('三振振り'), pa('四球')];
    const stats = computeBattingStats(pas, lineup);
    expect(stats.pa).toBe(5);
    expect(stats.ab).toBe(4); // 四球除く
    expect(stats.h).toBe(3);
    expect(stats.hr).toBe(1);
    expect(stats.double).toBe(1);
    expect(stats.bb).toBe(1);
    expect(stats.so).toBe(1);
  });
});

describe('computeAllBattingStats', () => {
  it('topBottom フィルタが機能する', () => {
    const pas: PlateAppearance[] = [
      { ...pa('単打'), topBottom: 'top', batterLineupId: 'l1' },
      { ...pa('本塁打'), topBottom: 'bottom', batterLineupId: 'l2' },
    ];
    const lineups: Lineup[] = [{ ...lineup, id: 'l1', side: 'away' }];
    const stats = computeAllBattingStats(pas, lineups, 'top');
    expect(stats).toHaveLength(1);
    expect(stats[0].h).toBe(1);
    expect(stats[0].hr).toBe(0);
  });

  it('ラインナップが空なら空配列を返す', () => {
    const stats = computeAllBattingStats([pa('単打')], [], 'top');
    expect(stats).toHaveLength(0);
  });

  it('打席ゼロの控え事前登録選手は成績表に含まれない', () => {
    // battingOrder: 10 の控え選手(事前登録済み、未出場)
    const benchLineup: Lineup = {
      id: 'bench1',
      gameId: 'g1',
      side: 'away',
      battingOrder: 10,
      playerName: '控え太郎',
      position: 1,
      cycle: 1,
      enteredInning: 1,
      isStarter: false,
    };
    const lineups: Lineup[] = [{ ...lineup, id: 'l1' }, benchLineup];
    const pas: PlateAppearance[] = [
      { ...pa('単打'), topBottom: 'top', batterLineupId: 'l1' },
    ];
    const stats = computeAllBattingStats(pas, lineups, 'top');
    // 打席に立った l1 のみ返り、控え選手(打席ゼロ)は含まれない
    expect(stats).toHaveLength(1);
    expect(stats[0].playerName).toBe('鈴木');
  });

  it('控え選手が交代出場した場合は成績行が1行のみ表示される', () => {
    // battingOrder: 10 の控え選手が交代出場し battingOrder: 3 で打席に立つ
    const benchLineup: Lineup = {
      id: 'bench1',
      gameId: 'g1',
      side: 'away',
      battingOrder: 10,
      playerName: '控え太郎',
      position: 1,
      cycle: 1,
      enteredInning: 1,
      isStarter: false,
    };
    const substituteLineup: Lineup = {
      id: 'sub1',
      gameId: 'g1',
      side: 'away',
      battingOrder: 3,
      playerName: '控え太郎',
      position: 9,
      cycle: 2,
      enteredInning: 4,
      isStarter: false,
    };
    const starterLineup3: Lineup = {
      id: 'starter3',
      gameId: 'g1',
      side: 'away',
      battingOrder: 3,
      playerName: '田中',
      position: 7,
      cycle: 1,
      enteredInning: 1,
      isStarter: true,
    };
    const lineups: Lineup[] = [
      { ...lineup, id: 'l1' },
      starterLineup3,
      substituteLineup,
      benchLineup,
    ];
    const pas: PlateAppearance[] = [
      { ...pa('単打'), topBottom: 'top', batterLineupId: 'l1' },
      { ...pa('二塁打'), topBottom: 'top', batterLineupId: 'starter3' },
      { ...pa('ゴロ'), topBottom: 'top', batterLineupId: 'sub1' },
    ];
    const stats = computeAllBattingStats(pas, lineups, 'top');
    // 打席1(鈴木) + 打順3(代替後の控え太郎) = 2行、控え事前登録(battingOrder:10)は含まれない
    expect(stats.every((s) => s.pa > 0)).toBe(true);
    const benchStats = stats.filter((s) => s.playerName === '控え太郎' && s.battingOrder === 10);
    expect(benchStats).toHaveLength(0);
  });
});
