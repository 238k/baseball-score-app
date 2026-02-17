'use client';

import { useMemo, useState } from 'react';
import type { RunnerDestination, RunnerInfo } from '@/types/score';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RunnerAdvancePanelProps {
  runners: RunnerInfo[];
  batterName: string;
  batterDest: 1 | 2 | 3 | 4 | null; // null = 打者アウト
  onConfirm: (destinations: Record<string, RunnerDestination>) => void;
}

const BASE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '1塁',
  2: '2塁',
  3: '3塁',
  4: '得点',
};

const BATTER_DEST_OPTIONS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

export function RunnerAdvancePanel({ runners, batterName, batterDest, onConfirm }: RunnerAdvancePanelProps) {
  const initialSelections: Record<string, RunnerDestination> = {};
  // 走者が1人の場合はデフォルト選択なし（ユーザーが明示的に選ぶ）
  const [selections, setSelections] = useState<Record<string, RunnerDestination>>(initialSelections);

  // 全走者が選択済みかチェック
  const allSelected = runners.every((r) => selections[r.lineupId] !== undefined);

  // 現在選択済みの「到達塁」（重複防止用）
  // 打者の到達塁（1〜3）も占有塁として扱う
  const occupiedBases = useMemo(() => {
    const occupied = new Set<RunnerDestination>();
    if (batterDest !== null && batterDest !== 4) {
      occupied.add(batterDest);
    }
    for (const [, dest] of Object.entries(selections)) {
      occupied.add(dest);
    }
    return occupied;
  }, [batterDest, selections]);

  function handleSelect(lineupId: string, dest: RunnerDestination) {
    setSelections((prev) => ({ ...prev, [lineupId]: dest }));
  }

  function handleConfirm() {
    onConfirm(selections);
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-medium text-zinc-500">走者の進塁を確認してください</p>

      {/* 打者の到達塁（固定表示） */}
      <div className="bg-zinc-100 rounded-lg px-3 py-2 flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-400">打者</span>
          <span className="ml-2 text-sm font-medium text-zinc-800">{batterName}</span>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          batterDest === null
            ? 'bg-red-100 text-red-700'
            : batterDest === 4
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {batterDest === null ? 'アウト' : BASE_LABELS[batterDest]}
        </span>
      </div>

      {/* 各走者の移動先選択 */}
      {runners.map((runner) => {
        const selected = selections[runner.lineupId];
        return (
          <div key={runner.lineupId} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-16 flex-shrink-0">{runner.fromBase}塁走者</span>
              <span className="text-sm font-medium text-zinc-800">{runner.name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BATTER_DEST_OPTIONS.map((dest) => {
                const isSelected = selected === dest;
                // 他の走者 or 打者がすでに使っている塁は無効化（ただし自分が選択中のものは除く）
                const isOccupied = occupiedBases.has(dest) && !isSelected;
                return (
                  <Button
                    key={dest}
                    type="button"
                    onClick={() => handleSelect(runner.lineupId, dest)}
                    disabled={isOccupied}
                    className={cn(
                      'min-h-[44px] px-4 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed',
                      isSelected
                        ? dest === 4
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700',
                    )}
                  >
                    {BASE_LABELS[dest]}
                  </Button>
                );
              })}
              {/* アウトボタン */}
              <Button
                type="button"
                onClick={() => handleSelect(runner.lineupId, 'out')}
                className={cn(
                  'min-h-[44px] px-4 rounded-lg text-sm font-medium',
                  selected === 'out'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700',
                )}
              >
                アウト
              </Button>
            </div>
          </div>
        );
      })}

      {/* 走者がいない（打者のみ出塁）場合のメッセージ */}
      {runners.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-2">
          塁上に走者はいません
        </p>
      )}

      {/* 確定ボタン */}
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={!allSelected && runners.length > 0}
        className="w-full min-h-[52px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-base active:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        確定する
      </Button>
    </div>
  );
}
