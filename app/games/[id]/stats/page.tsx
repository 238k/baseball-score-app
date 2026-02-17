'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useScoreStore } from '@/store/scoreStore';
import { computeAllBattingStats } from '@/lib/stats/battingStats';
import { computeAllPitchingStats } from '@/lib/stats/pitchingStats';
import { BattingStatsTable } from '@/components/stats/BattingStatsTable';
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable';

export default function StatsPage() {
  const params = useParams();
  const gameId = typeof params.id === 'string' ? params.id : '';

  const { getGame, lineups: allLineups } = useGameStore();
  const { plateAppearances, currentInning } = useScoreStore();

  const game = getGame(gameId);
  const lineups = useMemo(() => allLineups[gameId] ?? [], [allLineups, gameId]);

  // ビジター（表攻撃）打者成績
  const awayBattingStats = useMemo(
    () => computeAllBattingStats(
      plateAppearances,
      lineups.filter((l) => l.side === 'away'),
      'top',
    ),
    [plateAppearances, lineups],
  );

  // ホーム（裏攻撃）打者成績
  const homeBattingStats = useMemo(
    () => computeAllBattingStats(
      plateAppearances,
      lineups.filter((l) => l.side === 'home'),
      'bottom',
    ),
    [plateAppearances, lineups],
  );

  // ホーム投手成績（ビジターの打席に対して）
  const homePitchingStats = useMemo(
    () => computeAllPitchingStats(
      lineups,
      'home',
      plateAppearances.filter((p) => p.topBottom === 'top'), // ビジターの打席
      currentInning,
    ),
    [plateAppearances, lineups, currentInning],
  );

  // ビジター投手成績（ホームの打席に対して）
  const awayPitchingStats = useMemo(
    () => computeAllPitchingStats(
      lineups,
      'away',
      plateAppearances.filter((p) => p.topBottom === 'bottom'), // ホームの打席
      currentInning,
    ),
    [plateAppearances, lineups, currentInning],
  );

  if (!game) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">試合データが見つかりません</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
            試合一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <div className="bg-zinc-800 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-bold">
            {game.awayTeamName} vs {game.homeTeamName}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">{game.date} 成績集計</div>
        </div>
        <Link
          href={`/games/${gameId}`}
          className="text-sm text-zinc-300 hover:text-white transition-colors"
        >
          ← 記録に戻る
        </Link>
      </div>

      {/* コンテンツ */}
      <div className="divide-y divide-zinc-200">
        {/* ビジター打者成績 */}
        <section className="bg-white">
          <BattingStatsTable stats={awayBattingStats} teamName={game.awayTeamName} />
        </section>

        {/* ホーム投手成績 */}
        <section className="bg-white">
          <PitchingStatsTable stats={homePitchingStats} teamName={game.homeTeamName} />
        </section>

        {/* ホーム打者成績 */}
        <section className="bg-white">
          <BattingStatsTable stats={homeBattingStats} teamName={game.homeTeamName} />
        </section>

        {/* ビジター投手成績 */}
        <section className="bg-white">
          <PitchingStatsTable stats={awayPitchingStats} teamName={game.awayTeamName} />
        </section>
      </div>
    </div>
  );
}
