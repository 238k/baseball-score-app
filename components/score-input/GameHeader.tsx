'use client';

import Link from 'next/link';

interface GameHeaderProps {
  gameId: string;
  inning: number;
  topBottom: 'top' | 'bottom';
  outs: number;
  runnersOnBase: Record<1 | 2 | 3, string | null>;
  homeTeamName: string;
  awayTeamName: string;
}

const OUT_ICONS = ['○', '○', '○'] as const;

export function GameHeader({ gameId, inning, topBottom, outs, runnersOnBase, homeTeamName, awayTeamName }: GameHeaderProps) {
  const inningLabel = `${inning}回${topBottom === 'top' ? '表' : '裏'}`;
  const battingTeam = topBottom === 'top' ? awayTeamName : homeTeamName;
  const occupiedBases = ([1, 2, 3] as const).filter((base) => runnersOnBase[base] !== null);
  const baseLabelMap = { 1: '一塁', 2: '二塁', 3: '三塁' } as const;
  const runnerSummary = occupiedBases.length === 0
    ? '走者なし'
    : `${occupiedBases.map((base) => baseLabelMap[base]).join('・')}に走者`;
  const liveSummary = `${inningLabel}、${battingTeam}の攻撃中。${outs}アウト、${runnerSummary}。`;

  return (
    <div className="bg-zinc-800 text-white px-4 py-3 flex items-center justify-between gap-4">
      <p className="sr-only" aria-live="polite">{liveSummary}</p>
      {/* イニング */}
      <div className="text-center">
        <div className="text-xl font-bold">{inningLabel}</div>
        <div className="text-xs text-zinc-300 mt-0.5 truncate max-w-[120px]">{battingTeam}</div>
      </div>

      {/* アウトカウント */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-300 mr-1">OUT</span>
        {OUT_ICONS.map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`w-5 h-5 rounded-full border-2 ${
              i < outs ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
            }`}
          />
        ))}
      </div>

      {/* 走者 */}
      <div className="relative w-12 h-12 flex-shrink-0" aria-hidden="true">
        {/* 二塁 */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 ${
            runnersOnBase[2] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
          }`}
        />
        {/* 一塁 */}
        <div
          className={`absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 rotate-45 border-2 ${
            runnersOnBase[1] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
          }`}
        />
        {/* 三塁 */}
        <div
          className={`absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 rotate-45 border-2 ${
            runnersOnBase[3] ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-zinc-500'
          }`}
        />
        {/* 本塁（固定） */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-zinc-600 border-2 border-zinc-500" />
      </div>

      {/* 成績・印刷リンク */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href={`/games/${gameId}/stats`}
          className="inline-flex items-center justify-center min-h-[44px] px-2 text-sm text-zinc-200 hover:text-white rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          成績
        </Link>
        <Link
          href={`/games/${gameId}/print`}
          className="inline-flex items-center justify-center min-h-[44px] px-2 text-sm text-zinc-200 hover:text-white rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          印刷
        </Link>
      </div>
    </div>
  );
}
