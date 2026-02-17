'use client';

import type { PlateResult } from '@/types/score';
import { Button } from '@/components/ui/button';

interface ResultGroup {
  label: string;
  results: PlateResult[];
  colorClass: string;
}

const RESULT_GROUPS: ResultGroup[] = [
  {
    label: '安打',
    results: ['単打', '二塁打', '三塁打', '本塁打'],
    colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    label: 'アウト',
    results: ['ゴロ', 'フライ', 'ライナー', '三振振り', '三振見'],
    colorClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  {
    label: '出塁',
    results: ['四球', '死球'],
    colorClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    label: 'その他',
    results: ['野選', 'エラー', '併殺打', '振り逃げ', '犠打', '犠飛'],
    colorClass: 'bg-zinc-600 hover:bg-zinc-700 text-white',
  },
];

interface ResultInputPanelProps {
  onResult: (result: PlateResult) => void;
}

export function ResultInputPanel({ onResult }: ResultInputPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-medium text-zinc-500">打席結果</p>
      {RESULT_GROUPS.map(({ label, results, colorClass }) => (
        <div key={label}>
          <p className="text-xs text-zinc-400 mb-1.5">{label}</p>
          <div className="flex flex-wrap gap-2">
            {results.map((result) => (
              <Button
                key={result}
                type="button"
                onClick={() => onResult(result)}
                className={`min-h-[48px] px-4 rounded-lg font-medium text-sm transition-opacity active:opacity-70 ${colorClass}`}
              >
                {result}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
