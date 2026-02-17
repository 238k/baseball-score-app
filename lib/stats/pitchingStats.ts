import type { PlateAppearance, PlateResult } from '@/types/score';
import type { Lineup } from '@/types/game';
import type { PitchingStats } from './statsTypes';

const HIT_RESULTS: PlateResult[] = ['単打', '二塁打', '三塁打', '本塁打'];
const NON_AB_RESULTS: PlateResult[] = ['四球', '死球', '犠打', '犠飛'];

/** 指定サイドの投手一覧をenteredInning順に返す（position===1） */
export function getPitchersForSide(lineups: Lineup[], side: 'home' | 'away'): Lineup[] {
  return lineups
    .filter((l) => l.side === side && l.position === 1)
    .sort((a, b) => (a.enteredInning ?? 1) - (b.enteredInning ?? 1));
}

/**
 * 投手が担当するイニング範囲を計算する
 * @returns [fromInning, toInning] (両端含む)
 */
export function getPitcherInningRange(
  pitcher: Lineup,
  allPitchers: Lineup[],
  currentInning: number,
): [number, number] {
  const fromInning = pitcher.enteredInning ?? 1;
  // 同サイドの次の投手（enteredInning が大きい最初の投手）
  const nextPitcher = allPitchers
    .filter((p) => p.side === pitcher.side && (p.enteredInning ?? 1) > fromInning)
    .sort((a, b) => (a.enteredInning ?? 1) - (b.enteredInning ?? 1))[0];
  const toInning = nextPitcher ? (nextPitcher.enteredInning ?? 1) - 1 : currentInning;
  return [fromInning, toInning];
}

/**
 * 投球回を数値（小数）とDisplay文字列で返す
 * 簡略化: イニング単位（アウト数の端数は省略）
 */
export function computeIp(fromInning: number, toInning: number): { ip: number; ipDisplay: string } {
  const innings = Math.max(0, toInning - fromInning + 1);
  return { ip: innings, ipDisplay: String(innings) };
}

/** 1投手の成績を計算する */
export function computePitchingStats(
  pitcher: Lineup,
  opponentPas: PlateAppearance[],
  allPitchers: Lineup[],
  currentInning: number,
): PitchingStats {
  const [fromInning, toInning] = getPitcherInningRange(pitcher, allPitchers, currentInning);

  // 担当イニング内の相手打席を抽出
  const pitcherPas = opponentPas.filter(
    (p) => p.inning >= fromInning && p.inning <= toInning,
  );

  const bfp = pitcherPas.length;
  const pitches = pitcherPas.reduce((sum, p) => sum + p.pitchCount, 0);
  const h = pitcherPas.filter((p) => HIT_RESULTS.includes(p.result)).length;
  const so = pitcherPas.filter((p) => p.result === '三振振り' || p.result === '三振見').length;
  const bb = pitcherPas.filter((p) => p.result === '四球').length;
  const hbp = pitcherPas.filter((p) => p.result === '死球').length;
  const ab = pitcherPas.filter((p) => !NON_AB_RESULTS.includes(p.result)).length;

  const { ip, ipDisplay } = computeIp(fromInning, toInning);

  const oppAvg = ab > 0 ? round3(h / ab) : null;
  const whip = ip > 0 ? round2((h + bb + hbp) / ip) : null;
  const k9 = ip > 0 ? round1(so * 9 / ip) : null;
  const bb9 = ip > 0 ? round1(bb * 9 / ip) : null;
  const kbb = bb > 0 ? round2(so / bb) : null;

  return {
    lineupId: pitcher.id,
    playerName: pitcher.playerName,
    bfp,
    pitches,
    ip,
    ipDisplay,
    h,
    so,
    bb,
    hbp,
    oppAvg,
    whip,
    k9,
    bb9,
    kbb,
  };
}

/**
 * 指定サイドの全投手成績を計算する
 * @param lineups 全ラインナップ
 * @param side 投手のサイド（守備側）
 * @param opponentPas 相手チームの打席（topBottom フィルタ済み）
 * @param currentInning 現在のイニング
 */
export function computeAllPitchingStats(
  lineups: Lineup[],
  side: 'home' | 'away',
  opponentPas: PlateAppearance[],
  currentInning: number,
): PitchingStats[] {
  const pitchers = getPitchersForSide(lineups, side);
  if (pitchers.length === 0) return [];
  return pitchers.map((p) =>
    computePitchingStats(p, opponentPas, pitchers, currentInning),
  );
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
