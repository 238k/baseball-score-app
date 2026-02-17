'use client';

import type { PlateAppearance } from '@/types/score';

const MAX_DISPLAY = 20;

interface ScoreLogProps {
  plateAppearances: PlateAppearance[];
}

export function ScoreLog({ plateAppearances }: ScoreLogProps) {
  const recent = plateAppearances.slice(-MAX_DISPLAY).reverse();

  if (recent.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-zinc-500">
        まだ打席記録がありません
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-zinc-500 mb-2">打席ログ</p>
      <div className="space-y-1">
        {recent.map((pa) => (
          <div key={pa.id} className="flex items-baseline gap-2 text-sm">
            <span className="text-zinc-500 w-24 flex-shrink-0">
              {pa.inning}回{pa.topBottom === 'top' ? '表' : '裏'}
            </span>
            <span className="font-medium text-zinc-700 w-6 text-right">{pa.battingOrder}</span>
            <span className="text-zinc-700">{pa.batterName}</span>
            <span className="text-zinc-500">→</span>
            <span className="font-medium text-zinc-800">{pa.result}</span>
            <span className="text-xs text-zinc-500">({pa.pitchCount}球)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
