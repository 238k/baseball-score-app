'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useScoreStore } from '@/store/scoreStore';
import { computeAllBattingStats } from '@/lib/stats/battingStats';
import { computeAllPitchingStats } from '@/lib/stats/pitchingStats';
import { ScoreSheet } from '@/components/scorebook/ScoreSheet';
import { BattingStatsTable } from '@/components/stats/BattingStatsTable';
import { PitchingStatsTable } from '@/components/stats/PitchingStatsTable';

interface PrintViewProps {
  gameId: string;
}

export function PrintView({ gameId }: PrintViewProps) {
  const { getGame, lineups: allLineups, getCurrentBatter } = useGameStore();
  const { plateAppearances, currentInning } = useScoreStore();

  const game = getGame(gameId);
  const lineups = useMemo(() => allLineups[gameId] ?? [], [allLineups, gameId]);

  // 各チームの現在の打順（cycle 最大の選手）
  const awayLineup = useMemo(
    () => Array.from({ length: 9 }, (_, i) => getCurrentBatter(gameId, 'away', i + 1) ?? null),
    [gameId, getCurrentBatter, lineups], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const homeLineup = useMemo(
    () => Array.from({ length: 9 }, (_, i) => getCurrentBatter(gameId, 'home', i + 1) ?? null),
    [gameId, getCurrentBatter, lineups], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // 成績計算（stats/page.tsx と同じロジック）
  const awayBattingStats = useMemo(
    () => computeAllBattingStats(plateAppearances, lineups.filter((l) => l.side === 'away'), 'top'),
    [plateAppearances, lineups],
  );

  const homeBattingStats = useMemo(
    () => computeAllBattingStats(plateAppearances, lineups.filter((l) => l.side === 'home'), 'bottom'),
    [plateAppearances, lineups],
  );

  // ホーム投手成績（ビジターの打席に対して）
  const homePitchingStats = useMemo(
    () => computeAllPitchingStats(lineups, 'home', plateAppearances.filter((p) => p.topBottom === 'top'), currentInning),
    [plateAppearances, lineups, currentInning],
  );

  // ビジター投手成績（ホームの打席に対して）
  const awayPitchingStats = useMemo(
    () => computeAllPitchingStats(lineups, 'away', plateAppearances.filter((p) => p.topBottom === 'bottom'), currentInning),
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
    <>
      {/* 印刷用グローバルスタイル */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          .print-no-overflow { overflow: visible !important; max-height: none !important; }
          .sticky { position: static !important; }
        }
      `}</style>

      <div className="bg-white">
        {/* 画面専用ヘッダー（印刷時非表示） */}
        <div className="print:hidden bg-zinc-800 text-white px-4 py-3 flex items-center justify-between">
          <Link
            href={`/games/${gameId}`}
            className="text-sm text-zinc-300 hover:text-white transition-colors"
          >
            ← 記録に戻る
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[36px] px-4 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 transition-colors"
          >
            印刷
          </button>
        </div>

        {/* 試合情報 */}
        <div className="px-4 py-3 border-b border-zinc-300">
          <h1 className="text-lg font-bold text-zinc-900">
            {game.awayTeamName} vs {game.homeTeamName}
          </h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            {game.date}{game.venue ? ` · ${game.venue}` : ''}
          </p>
        </div>

        {/* ビジター スコアシート */}
        <section>
          <h2 className="text-sm font-bold text-zinc-700 px-4 py-2 bg-zinc-100 border-b border-zinc-200">
            {game.awayTeamName}（ビジター）
          </h2>
          {/*
            currentTopBottom="bottom" で attackingSide="away"（sideTopBottom="top"）と不一致にし、
            現在打者・現在イニングのハイライトを無効化する
          */}
          <div className="print-no-overflow overflow-x-auto">
            <ScoreSheet
              attackingSide="away"
              attackingLineup={awayLineup}
              plateAppearances={plateAppearances}
              currentInning={currentInning}
              currentTopBottom="bottom"
              currentBatterIndex={0}
            />
          </div>
        </section>

        {/* ホーム スコアシート */}
        <section>
          <h2 className="text-sm font-bold text-zinc-700 px-4 py-2 bg-zinc-100 border-b border-zinc-200">
            {game.homeTeamName}（ホーム）
          </h2>
          {/*
            currentTopBottom="top" で attackingSide="home"（sideTopBottom="bottom"）と不一致にし、
            ハイライトを無効化する
          */}
          <div className="print-no-overflow overflow-x-auto">
            <ScoreSheet
              attackingSide="home"
              attackingLineup={homeLineup}
              plateAppearances={plateAppearances}
              currentInning={currentInning}
              currentTopBottom="top"
              currentBatterIndex={0}
            />
          </div>
        </section>

        {/* 成績テーブル */}
        <div className="divide-y divide-zinc-200 mt-4">
          <section className="bg-white">
            <BattingStatsTable stats={awayBattingStats} teamName={game.awayTeamName} />
          </section>
          <section className="bg-white">
            <PitchingStatsTable stats={homePitchingStats} teamName={game.homeTeamName} />
          </section>
          <section className="bg-white">
            <BattingStatsTable stats={homeBattingStats} teamName={game.homeTeamName} />
          </section>
          <section className="bg-white">
            <PitchingStatsTable stats={awayPitchingStats} teamName={game.awayTeamName} />
          </section>
        </div>
      </div>
    </>
  );
}
