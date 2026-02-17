'use client';

import type { BattingStats } from '@/lib/stats/statsTypes';

interface BattingStatsTableProps {
  stats: BattingStats[];
  teamName: string;
}

function fmt(n: number | null, digits = 3): string {
  if (n === null) return '-';
  return n.toFixed(digits);
}

function fmtAvg(n: number | null): string {
  if (n === null) return '-';
  // .XXX 形式（先頭の 0 を省略: .333）
  return '.' + Math.round(n * 1000).toString().padStart(3, '0');
}

export function BattingStatsTable({ stats, teamName }: BattingStatsTableProps) {
  if (stats.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-zinc-400">
        打席記録がありません
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-zinc-700 px-4 py-2 bg-zinc-100 border-b border-zinc-200">
        {teamName} 打者成績
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-max text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="sticky left-0 bg-zinc-50 z-10 text-left px-2 py-1.5 font-medium text-zinc-500 w-8">#</th>
              <th className="sticky left-8 bg-zinc-50 z-10 text-left px-2 py-1.5 font-medium text-zinc-500 min-w-[80px]">選手</th>
              {['PA','AB','H','AVG','2B','3B','HR','BB','HBP','SO','OBP','SLG','OPS','P/PA','SAC','SF','DP'].map((h) => (
                <th key={h} className="text-right px-2 py-1.5 font-medium text-zinc-500 min-w-[36px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.lineupId} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="sticky left-0 bg-white hover:bg-zinc-50 z-10 text-center px-2 py-1.5 text-zinc-500 font-medium">{s.battingOrder}</td>
                <td className="sticky left-8 bg-white hover:bg-zinc-50 z-10 text-left px-2 py-1.5 font-medium text-zinc-800 truncate max-w-[80px]">{s.playerName}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.pa}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.ab}</td>
                <td className="text-right px-2 py-1.5 font-medium text-zinc-800">{s.h}</td>
                <td className="text-right px-2 py-1.5 font-bold text-zinc-800">{fmtAvg(s.avg)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.double}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.triple}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.hr}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.bb}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.hbp}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.so}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmtAvg(s.obp)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{fmtAvg(s.slg)}</td>
                <td className="text-right px-2 py-1.5 font-bold text-zinc-800">{fmt(s.ops)}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.ppa !== null ? s.ppa.toFixed(1) : '-'}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.sac}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.sf}</td>
                <td className="text-right px-2 py-1.5 text-zinc-700">{s.dp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
