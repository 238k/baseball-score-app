import { describe, it, expect } from 'vitest';
import {
  getPitchersForSide,
  getPitcherInningRange,
  computeIp,
  computePitchingStats,
} from './pitchingStats';
import type { PlateAppearance } from '@/types/score';
import type { Lineup } from '@/types/game';

function makePitcher(id: string, enteredInning: number, side: 'home' | 'away' = 'home'): Lineup {
  return {
    id,
    gameId: 'g1',
    side,
    battingOrder: 1,
    playerName: `投手${id}`,
    position: 1,
    cycle: 1,
    enteredInning,
    isStarter: enteredInning === 1,
  };
}

function pa(result: PlateAppearance['result'], inning: number, pitchCount = 4): PlateAppearance {
  return {
    id: `pa-${Math.random()}`,
    gameId: 'g1',
    inning,
    topBottom: 'top',
    batterLineupId: 'batter1',
    batterName: '打者',
    battingOrder: 1,
    result,
    pitchCount,
    sequenceInGame: 1,
  };
}

describe('getPitchersForSide', () => {
  it('指定サイドかつposition===1のみ返す', () => {
    const lineups: Lineup[] = [
      makePitcher('p1', 1, 'home'),
      makePitcher('p2', 3, 'home'),
      { ...makePitcher('p3', 1, 'home'), position: 8 }, // 野手
      makePitcher('p4', 1, 'away'),
    ];
    const result = getPitchersForSide(lineups, 'home');
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('enteredInning順にソートされる', () => {
    const lineups: Lineup[] = [
      makePitcher('p2', 5, 'away'),
      makePitcher('p1', 1, 'away'),
      makePitcher('p3', 7, 'away'),
    ];
    const result = getPitchersForSide(lineups, 'away');
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('getPitcherInningRange', () => {
  it('後続投手がいない場合はcurrentInningまで', () => {
    const pitcher = makePitcher('p1', 1, 'home');
    const [from, to] = getPitcherInningRange(pitcher, [pitcher], 7);
    expect(from).toBe(1);
    expect(to).toBe(7);
  });

  it('後続投手の1イニング前まで担当', () => {
    const p1 = makePitcher('p1', 1, 'home');
    const p2 = makePitcher('p2', 5, 'home');
    const [from, to] = getPitcherInningRange(p1, [p1, p2], 9);
    expect(from).toBe(1);
    expect(to).toBe(4);
  });

  it('2番手は自分の登板回から現在まで', () => {
    const p1 = makePitcher('p1', 1, 'home');
    const p2 = makePitcher('p2', 5, 'home');
    const [from, to] = getPitcherInningRange(p2, [p1, p2], 9);
    expect(from).toBe(5);
    expect(to).toBe(9);
  });
});

describe('computeIp', () => {
  it('1〜3回 → 3回', () => {
    expect(computeIp(1, 3)).toEqual({ ip: 3, ipDisplay: '3' });
  });

  it('同一イニング → 1回', () => {
    expect(computeIp(5, 5)).toEqual({ ip: 1, ipDisplay: '1' });
  });
});

describe('computePitchingStats', () => {
  const pitcherHome = makePitcher('ph1', 1, 'home');
  const allPitchers = [pitcherHome];

  it('被安打・奪三振・与四球を正しく集計', () => {
    const pas = [
      pa('単打', 1),
      pa('三振振り', 1),
      pa('四球', 2),
      pa('死球', 2),
      pa('ゴロ', 3),
    ];
    const stats = computePitchingStats(pitcherHome, pas, allPitchers, 3);
    expect(stats.bfp).toBe(5);
    expect(stats.h).toBe(1);
    expect(stats.so).toBe(1);
    expect(stats.bb).toBe(1);
    expect(stats.hbp).toBe(1);
  });

  it('担当イニング外の打席は除外', () => {
    const p1 = makePitcher('p1', 1, 'home');
    const p2 = makePitcher('p2', 4, 'home');
    const pas = [
      pa('単打', 1),
      pa('単打', 3),
      pa('本塁打', 4), // p2 担当
      pa('本塁打', 5), // p2 担当
    ];
    const stats = computePitchingStats(p1, pas, [p1, p2], 5);
    expect(stats.bfp).toBe(2); // イニング1〜3のみ
    expect(stats.h).toBe(2);
  });

  it('WHIP計算: (被安打+与四球+与死球) / 投球回', () => {
    // 3回で安打1、四球1、死球1 → WHIP = 3/3 = 1.00
    const pas = [pa('単打', 1), pa('四球', 2), pa('死球', 3)];
    const stats = computePitchingStats(pitcherHome, pas, allPitchers, 3);
    expect(stats.whip).toBeCloseTo(1.0, 2);
  });

  it('投球回0の場合 WHIP=null', () => {
    // currentInning < enteredInning のケースは通常発生しないが、fromInning > toInningで0になる
    const pitcher = makePitcher('p_late', 9, 'home');
    const stats = computePitchingStats(pitcher, [], [pitcher], 9);
    expect(stats.ip).toBe(1); // 9〜9 = 1
  });

  it('打数0の場合 被打率=null', () => {
    // 四球・死球のみ
    const pas = [pa('四球', 1), pa('死球', 1)];
    const stats = computePitchingStats(pitcherHome, pas, allPitchers, 3);
    expect(stats.oppAvg).toBeNull();
  });
});
