'use client';

import type { Pitch } from '@/types/score';

interface GameStatusPanelProps {
  inning: number;
  topBottom: 'top' | 'bottom';
  outs: number;
  runnersOnBase: Record<1 | 2 | 3, string | null>;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  pitches: Pitch[];
}

function countBalls(pitches: Pitch[]): number {
  return pitches.filter((p) => p.type === 'ball').length;
}

function countStrikes(pitches: Pitch[]): number {
  const nonFoulStrikes = pitches.filter(
    (p) => p.type === 'strike_swinging' || p.type === 'strike_looking',
  ).length;
  if (nonFoulStrikes >= 2) return 2;
  const fouls = pitches.filter((p) => p.type === 'foul').length;
  return Math.min(nonFoulStrikes + fouls, 2);
}

export function GameStatusPanel({
  inning,
  topBottom,
  outs,
  runnersOnBase,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  pitches,
}: GameStatusPanelProps) {
  const inningLabel = `${inning}回${topBottom === 'top' ? '表' : '裏'}`;
  const balls = countBalls(pitches);
  const strikes = Math.min(countStrikes(pitches), 2); // 2ストライクまで表示（3つ目は確定）
  const occupiedBases = ([1, 2, 3] as const).filter((base) => runnersOnBase[base] !== null);
  const baseLabelMap = { 1: '一塁', 2: '二塁', 3: '三塁' } as const;
  const runnerSummary = occupiedBases.length === 0
    ? '走者なし'
    : `${occupiedBases.map((base) => baseLabelMap[base]).join('・')}に走者`;
  const liveSummary = `${inningLabel}、${outs}アウト、${runnerSummary}。`;

  return (
    <div className="bg-zinc-800 text-white px-4 py-3 flex-shrink-0">
      <p className="sr-only" aria-live="polite">{liveSummary}</p>

      {/* イニング */}
      <div className="text-center mb-3">
        <div className="text-lg font-bold">{inningLabel}</div>
      </div>

      {/* スコアボード */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="text-center min-w-0 flex-1">
          <div className="text-[10px] text-zinc-400 truncate">{awayTeamName}</div>
          <div className="text-2xl font-bold tabular-nums">{awayScore}</div>
        </div>
        <div className="text-zinc-500 text-lg font-bold flex-shrink-0">-</div>
        <div className="text-center min-w-0 flex-1">
          <div className="text-[10px] text-zinc-400 truncate">{homeTeamName}</div>
          <div className="text-2xl font-bold tabular-nums">{homeScore}</div>
        </div>
      </div>

      {/* BSO + ランナー */}
      <div className="flex items-center justify-between">
        {/* BSO カウント */}
        <div className="flex items-center gap-3">
          {/* ボール */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">B</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`w-3.5 h-3.5 rounded-full border ${
                  i < balls ? 'bg-green-400 border-green-400' : 'bg-transparent border-zinc-500'
                }`}
              />
            ))}
          </div>
          {/* ストライク */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">S</span>
            {[0, 1].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`w-3.5 h-3.5 rounded-full border ${
                  i < strikes ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
                }`}
              />
            ))}
          </div>
          {/* アウト */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">O</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`w-3.5 h-3.5 rounded-full border ${
                  i < outs ? 'bg-red-400 border-red-400' : 'bg-transparent border-zinc-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ランナーダイヤモンド */}
        <div className="relative w-10 h-10 flex-shrink-0" aria-hidden="true">
          {/* 二塁 */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-2 ${
              runnersOnBase[2] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
            }`}
          />
          {/* 一塁 */}
          <div
            className={`absolute top-1/2 right-0 -translate-y-1/2 w-3.5 h-3.5 rotate-45 border-2 ${
              runnersOnBase[1] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
            }`}
          />
          {/* 三塁 */}
          <div
            className={`absolute top-1/2 left-0 -translate-y-1/2 w-3.5 h-3.5 rotate-45 border-2 ${
              runnersOnBase[3] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
            }`}
          />
          {/* 本塁（固定） */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-zinc-600 border-2 border-zinc-500" />
        </div>
      </div>
    </div>
  );
}
