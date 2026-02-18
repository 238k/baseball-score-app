'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useScoreStore } from '@/store/scoreStore';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { GameStatusPanel } from './GameStatusPanel';
import { Button } from '@/components/ui/button';
import { CurrentBatterInfo } from './CurrentBatterInfo';
import { PitchInputPanel } from './PitchInputPanel';
import { ResultInputPanel } from './ResultInputPanel';
import { RunnerAdvancePanel } from './RunnerAdvancePanel';
import { ScoreLog } from './ScoreLog';
import { SubstitutionPanel } from './SubstitutionPanel';
import { ScoreSheet } from '@/components/scorebook/ScoreSheet';
import type { PitchType, PlateResult, RunnerDestination, RunnerInfo } from '@/types/score';

interface ScoreInputPageProps {
  gameId: string;
}

export function ScoreInputPage({ gameId }: ScoreInputPageProps) {
  const { getGame, lineups, getCurrentBatter, syncToSupabase } = useGameStore();
  const { user } = useAuth();
  const isOnline = useOnlineSync();
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
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
    homeScore,
    awayScore,
    recordPitch,
    recordResult,
    confirmRunners,
    advanceInning,
    undo,
    redo,
    undoStack,
    redoStack,
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

  // マウント時に Supabase へ同期（認証済み・オンライン時のみ）
  useEffect(() => {
    if (!user || !isOnline) return;
    syncToSupabase(gameId).catch(() => {});
  }, [gameId, user, isOnline, syncToSupabase]);

  // キーボードショートカット: Cmd+Z=Undo, Cmd+Shift+Z / Ctrl+Y=Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  // 現在の攻撃チーム
  const attackingSide: 'home' | 'away' = currentTopBottom === 'top' ? 'away' : 'home';

  // スコアシートで閲覧中のチーム（デフォルト: 攻撃中チーム）
  const [viewingSide, setViewingSide] = useState<'home' | 'away'>(attackingSide);

  // 攻守交代時に閲覧チームを自動リセット
  useEffect(() => {
    setViewingSide(attackingSide);
  }, [attackingSide]);

  const gameLineups = useMemo(() => lineups[gameId] ?? [], [lineups, gameId]);

  // 各打順の全選手（サイクル昇順）を取得（攻撃チーム）
  const attackingLineup = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const battingOrder = i + 1;
      return gameLineups
        .filter((l) => l.side === attackingSide && l.battingOrder === battingOrder)
        .sort((a, b) => a.cycle - b.cycle);
    });
  }, [gameId, attackingSide, gameLineups]); // eslint-disable-line react-hooks/exhaustive-deps

  // スコアシートで閲覧中のチームのラインナップ
  const viewingLineup = useMemo(() => {
    if (viewingSide === attackingSide) return attackingLineup;
    return Array.from({ length: 9 }, (_, i) => {
      const battingOrder = i + 1;
      return gameLineups
        .filter((l) => l.side === viewingSide && l.battingOrder === battingOrder)
        .sort((a, b) => a.cycle - b.cycle);
    });
  }, [gameId, viewingSide, attackingSide, attackingLineup, gameLineups]); // eslint-disable-line react-hooks/exhaustive-deps

  // 現在の打者（ラインナップが空の場合はダミー）
  const currentBatterLineup = getCurrentBatter(gameId, attackingSide, currentBatterIndex + 1) ?? null;
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
    <div className="h-screen overflow-hidden flex flex-col bg-zinc-50">
      {/* オフラインバナー */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs text-center py-1 px-3 flex-shrink-0">
          オフラインで動作中 · 入力はローカルに保存されます
        </div>
      )}

      {/* メインコンテンツ: 左右2ペイン */}
      <div className="flex flex-1 min-h-0">
        {/* 左ペイン: スコアシート */}
        <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-hidden bg-white flex flex-col">
          {/* チーム切り替えトグル */}
          <div className="flex border-b border-zinc-200 bg-white flex-shrink-0">
            <button
              type="button"
              aria-pressed={viewingSide === 'away'}
              onClick={() => setViewingSide('away')}
              className={`flex-1 min-h-[36px] py-2 text-xs font-medium transition-colors ${
                viewingSide === 'away'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {game.awayTeamName}（表）
            </button>
            <button
              type="button"
              aria-pressed={viewingSide === 'home'}
              onClick={() => setViewingSide('home')}
              className={`flex-1 min-h-[36px] py-2 text-xs font-medium transition-colors ${
                viewingSide === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {game.homeTeamName}（裏）
            </button>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <ScoreSheet
              attackingSide={viewingSide}
              attackingLineup={viewingLineup}
              plateAppearances={plateAppearances}
              currentInning={currentInning}
              currentTopBottom={currentTopBottom}
              currentBatterIndex={currentBatterIndex}
              currentPitches={pitches}
            />
          </div>
        </div>

        {/* 右ペイン: 試合状況 + 操作UI */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-zinc-200">
          {/* 右上: 試合状況パネル */}
          <GameStatusPanel
            inning={currentInning}
            topBottom={currentTopBottom}
            outs={outs}
            runnersOnBase={runnersOnBase}
            homeTeamName={game.homeTeamName}
            awayTeamName={game.awayTeamName}
            homeScore={homeScore}
            awayScore={awayScore}
            pitches={pitches}
          />

          {/* 右下: 操作UI */}
          <div className="flex-1 overflow-y-auto bg-zinc-50">
            {/* 現在打者情報 */}
            <CurrentBatterInfo
              battingOrder={battingOrder}
              batterName={batterName}
            />

            {/* 交代ボタン（pitching フェーズのみ） */}
            {phase === 'pitching' && (
              <div className="px-4 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubstitutionOpen(true)}
                  className="min-h-[40px] px-4 rounded-lg text-zinc-600 text-sm font-medium"
                >
                  選手交代
                </Button>
              </div>
            )}

            {/* 入力パネル */}
            {phase === 'inning_end' ? (
              <div className="p-6 flex flex-col items-center gap-4">
                <p className="text-lg font-bold text-zinc-700">3アウト — 攻守交代</p>
                <Button
                  type="button"
                  onClick={advanceInning}
                  className="min-h-[56px] px-10 rounded-lg bg-zinc-800 text-white font-bold text-lg hover:bg-zinc-700 active:opacity-70 transition-colors"
                >
                  攻守交代
                </Button>
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

            {/* Undo / Redo ボタン */}
            <div className="px-4 pb-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={undo}
                disabled={undoStack.length === 0}
                className="flex-1 min-h-[44px] rounded-lg text-zinc-600 text-sm font-medium hover:bg-zinc-100 disabled:opacity-30"
              >
                ↩ 取り消し
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={redo}
                disabled={redoStack.length === 0}
                className="flex-1 min-h-[44px] rounded-lg text-zinc-600 text-sm font-medium hover:bg-zinc-100 disabled:opacity-30"
              >
                ↪ やり直し
              </Button>
            </div>

            {/* 打席ログ */}
            <div className="border-t border-zinc-200">
              <ScoreLog plateAppearances={plateAppearances} />
            </div>
          </div>
        </div>
      </div>

      {/* 選手交代パネル */}
      <SubstitutionPanel
        isOpen={isSubstitutionOpen}
        onClose={() => setIsSubstitutionOpen(false)}
        gameId={gameId}
        attackingSide={attackingSide}
        currentInning={currentInning}
      />
    </div>
  );
}
