'use client';

import type { PitchingStats } from '@/lib/stats/statsTypes';

interface PitchingStatsTableProps {
  stats: PitchingStats[];
  teamName: string;
}

function fmt(n: number | null, digits = 2): string {
  if (n === null) return '-';
  return n.toFixed(digits);
}

function fmtAvg(n: number | null): string {
  if (n === null) return '-';
  return '.' + Math.round(n * 1000).toString().padStart(3, '0');
}

export function PitchingStatsTable({ stats, teamName }: PitchingStatsTableProps) {
  if (stats.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-zinc-400">
        投手記録がありません
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-zinc-700 px-4 py-2 bg-zinc-100 border-b border-zinc-200">
        {teamName} 投手成績
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-max text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="sticky left-0 bg-zinc-50 z-10 text-left px-2 py-1.5 font-medium text-zinc-500 min-w-[80px]">投手</th>
              {['IP','P','H','SO','BB','HBP','OPP','WHIP','K/9','BB/9','K/BB'].map((h) => (
                <th key={h} className="text-right px-2 py-1.5 font-medium text-zinc-500 min-w-[40px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.lineupId} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="sticky left-0 bg-white hover:bg-zinc-50 z-10 text-left px-2 py-1.5 font-medium text-zinc-800 truncate max-w-[80px]">{s.playerName}</td>
                <td className="text-right px-2 py-1.5 font-bold text-zinc-800">{s.ipDisplay}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.pitches}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.h}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.so}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.bb}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.hbp}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmtAvg(s.oppAvg)}</td>
                <td className="text-right px-2 py-1.5 font-bold text-zinc-800">{fmt(s.whip)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmt(s.k9, 1)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmt(s.bb9, 1)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmt(s.kbb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
