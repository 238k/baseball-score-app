import type { PlateAppearance, PlateResult } from '@/types/score';
import type { Lineup } from '@/types/game';
import type { BattingStats } from './statsTypes';

// 打数に含まれない打席結果
const NON_AB_RESULTS: PlateResult[] = ['四球', '死球', '犠打', '犠飛'];

// 安打の打席結果
const HIT_RESULTS: PlateResult[] = ['単打', '二塁打', '三塁打', '本塁打'];

/** 1選手の打席配列から打者成績を計算する */
export function computeBattingStats(
  pas: PlateAppearance[],
  lineup: Lineup,
): BattingStats {
  const pa = pas.length;

  const ab = pas.filter((p) => !NON_AB_RESULTS.includes(p.result)).length;
  const h = pas.filter((p) => HIT_RESULTS.includes(p.result)).length;
  const double_ = pas.filter((p) => p.result === '二塁打').length;
  const triple = pas.filter((p) => p.result === '三塁打').length;
  const hr = pas.filter((p) => p.result === '本塁打').length;
  const single = h - double_ - triple - hr;
  const bb = pas.filter((p) => p.result === '四球').length;
  const hbp = pas.filter((p) => p.result === '死球').length;
  const so = pas.filter((p) => p.result === '三振振り' || p.result === '三振見').length;
  const sac = pas.filter((p) => p.result === '犠打').length;
  const sf = pas.filter((p) => p.result === '犠飛').length;
  const dp = pas.filter((p) => p.result === '併殺打').length;
  const pitchesTotal = pas.reduce((sum, p) => sum + p.pitchCount, 0);

  const avg = ab > 0 ? round3(h / ab) : null;
  const obp = (ab + bb + hbp + sf) > 0
    ? round3((h + bb + hbp) / (ab + bb + hbp + sf))
    : null;
  const slg = ab > 0
    ? round3((single + 2 * double_ + 3 * triple + 4 * hr) / ab)
    : null;
  const ops = obp !== null && slg !== null ? round3(obp + slg) : null;
  const ppa = pa > 0 ? round1(pitchesTotal / pa) : null;

  return {
    lineupId: lineup.id,
    playerName: lineup.playerName,
    battingOrder: lineup.battingOrder,
    pa,
    ab,
    h,
    double: double_,
    triple,
    hr,
    bb,
    hbp,
    so,
    sac,
    sf,
    dp,
    pitchesTotal,
    avg,
    obp,
    slg,
    ops,
    ppa,
  };
}

/**
 * 指定チームの全打者成績を計算する
 * @param pas 全打席（両チーム混在可、topBottom でフィルタ済みを渡しても可）
 * @param lineups 全ラインナップ
 * @param topBottom そのチームが攻撃する表/裏
 */
export function computeAllBattingStats(
  pas: PlateAppearance[],
  lineups: Lineup[],
  topBottom: 'top' | 'bottom',
): BattingStats[] {
  // そのチームの打席のみ抽出
  const teamPas = pas.filter((p) => p.topBottom === topBottom);

  // 各打順の現在の選手（cycle 最大）を取得
  const battingOrders = Array.from(new Set(lineups.map((l) => l.battingOrder))).sort();

  const results: BattingStats[] = [];
  for (const order of battingOrders) {
    // その打順の最新 cycle の選手
    const candidates = lineups.filter((l) => l.battingOrder === order);
    if (candidates.length === 0) continue;
    const currentLineup = candidates.reduce((max, l) => (l.cycle > max.cycle ? l : max), candidates[0]);

    // その選手が打った打席（batterLineupId が一致するもの）
    // 代打・代走の場合、複数の lineupId が同打順を持つため全員分集計
    const playerPas = teamPas.filter((p) =>
      candidates.some((l) => l.id === p.batterLineupId),
    );

    if (playerPas.length === 0 && candidates.length === 1) {
      // 打席なし → 0成績を追加
      results.push(computeBattingStats([], currentLineup));
    } else {
      // 代打がいる場合は最新の選手分のみ集計
      const currentPas = teamPas.filter((p) => p.batterLineupId === currentLineup.id);
      results.push(computeBattingStats(currentPas, currentLineup));
    }
  }

  return results;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
