'use client';

import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useScoreStore } from '@/store/scoreStore';
import { GameHeader } from './GameHeader';
import { CurrentBatterInfo } from './CurrentBatterInfo';
import { PitchInputPanel } from './PitchInputPanel';
import { ResultInputPanel } from './ResultInputPanel';
import { RunnerAdvancePanel } from './RunnerAdvancePanel';
import { ScoreLog } from './ScoreLog';
import type { PitchType, PlateResult, RunnerDestination, RunnerInfo } from '@/types/score';

interface ScoreInputPageProps {
  gameId: string;
}

export function ScoreInputPage({ gameId }: ScoreInputPageProps) {
  const { getGame, lineups } = useGameStore();
  const {
    initGame,
    gameId: storeGameId,
    currentInning,
    currentTopBottom,
    currentBatterIndex,
    outs,
    runnersOnBase,
    pitches,
    plateAppearances,
    phase,
    recordPitch,
    recordResult,
    confirmRunners,
    advanceInning,
    undo,
    undoStack,
    pendingBatterDestination,
  } = useScoreStore();

  const game = getGame(gameId);

  // 試合開始時に scoreStore を初期化（試合が存在する場合のみ）
  useEffect(() => {
    if (!game) return;
    if (storeGameId !== gameId) {
      initGame(gameId);
    }
  }, [game, gameId, storeGameId, initGame]);

  // 現在の攻撃チーム
  const attackingSide: 'home' | 'away' = currentTopBottom === 'top' ? 'away' : 'home';
  const gameLineups = useMemo(() => lineups[gameId] ?? [], [lineups, gameId]);
  const attackingLineup = gameLineups
    .filter((l) => l.side === attackingSide && l.isStarter)
    .sort((a, b) => a.battingOrder - b.battingOrder);

  // 現在の打者（ラインナップが空の場合はダミー）
  const currentBatterLineup = attackingLineup[currentBatterIndex] ?? null;
  const batterName = currentBatterLineup?.playerName ?? `打者${currentBatterIndex + 1}`;
  const battingOrder = currentBatterLineup?.battingOrder ?? currentBatterIndex + 1;
  const batterLineupId = currentBatterLineup?.id ?? `dummy-${currentBatterIndex}`;

  // ラインナップIDから選手名を解決するヘルパー
  const resolveRunnerName = useCallback(
    (lineupId: string, fromBase: 1 | 2 | 3): string => {
      const found = gameLineups.find((l) => l.id === lineupId);
      return found?.playerName ?? `${fromBase}塁走者`;
    },
    [gameLineups],
  );

  // runner_advance フェーズで表示する走者リスト
  const runnersForAdvancePanel: RunnerInfo[] = ([1, 2, 3] as const)
    .filter((base) => runnersOnBase[base] !== null)
    .map((base) => ({
      lineupId: runnersOnBase[base] as string,
      name: resolveRunnerName(runnersOnBase[base] as string, base),
      fromBase: base,
    }));

  const handlePitch = useCallback(
    (type: PitchType) => {
      recordPitch(type, batterLineupId, batterName, battingOrder);
    },
    [recordPitch, batterLineupId, batterName, battingOrder],
  );

  const handleResult = useCallback(
    (result: PlateResult) => {
      recordResult(result, batterLineupId, batterName, battingOrder);
    },
    [recordResult, batterLineupId, batterName, battingOrder],
  );

  const handleConfirmRunners = useCallback(
    (destinations: Record<string, RunnerDestination>) => {
      confirmRunners(destinations);
    },
    [confirmRunners],
  );

  // 試合データが見つからない場合
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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* ヘッダー */}
      <GameHeader
        inning={currentInning}
        topBottom={currentTopBottom}
        outs={outs}
        runnersOnBase={runnersOnBase}
        homeTeamName={game.homeTeamName}
        awayTeamName={game.awayTeamName}
      />

      {/* 現在打者情報 */}
      <CurrentBatterInfo
        battingOrder={battingOrder}
        batterName={batterName}
        pitches={pitches}
      />

      {/* 入力パネル */}
      <div className="flex-1 overflow-auto">
        {phase === 'inning_end' ? (
          <div className="p-6 flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-zinc-700">3アウト — 攻守交代</p>
            <button
              type="button"
              onClick={advanceInning}
              className="min-h-[56px] px-10 rounded-lg bg-zinc-800 text-white font-bold text-lg hover:bg-zinc-700 active:opacity-70 transition-colors"
            >
              攻守交代
            </button>
          </div>
        ) : phase === 'runner_advance' ? (
          <RunnerAdvancePanel
            runners={runnersForAdvancePanel}
            batterName={batterName}
            batterDest={pendingBatterDestination}
            onConfirm={handleConfirmRunners}
          />
        ) : phase === 'result' ? (
          <ResultInputPanel onResult={handleResult} />
        ) : (
          <PitchInputPanel onPitch={handlePitch} />
        )}

        {/* Undo ボタン */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="w-full min-h-[44px] rounded-lg border border-zinc-300 text-zinc-600 text-sm font-medium hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ↩ 取り消し（Undo）
          </button>
        </div>

        {/* 打席ログ */}
        <div className="border-t border-zinc-200">
          <ScoreLog plateAppearances={plateAppearances} />
        </div>
      </div>
    </div>
  );
}
