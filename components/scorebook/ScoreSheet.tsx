'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ScoreCell } from './ScoreCell';
import type { PlateAppearance } from '@/types/score';
import type { Lineup, FieldingPosition } from '@/types/game';

// 守備位置の略称
const POSITION_LABELS: Record<FieldingPosition, string> = {
  1: '投', 2: '捕', 3: '一', 4: '二', 5: '三',
  6: '遊', 7: '左', 8: '中', 9: '右', 10: 'DH',
};

export interface ScoreSheetProps {
  /** 攻撃チームの側（表=away, 裏=home） */
  attackingSide: 'home' | 'away';
  /** 各打順の現在の選手（9人分、null は未登録） */
  attackingLineup: (Lineup | null)[];
  /** 完了した打席の一覧（全打席を渡す。内部でフィルタリング） */
  plateAppearances: PlateAppearance[];
  /** 現在のイニング */
  currentInning: number;
  /** 現在の表/裏 */
  currentTopBottom: 'top' | 'bottom';
  /** 現在の打者インデックス（0〜8） */
  currentBatterIndex: number;
}

export function ScoreSheet({
  attackingSide,
  attackingLineup,
  plateAppearances,
  currentInning,
  currentTopBottom,
  currentBatterIndex,
}: ScoreSheetProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentInningRef = useRef<HTMLDivElement>(null);

  // このチームが攻撃する時の表/裏
  const sideTopBottom: 'top' | 'bottom' = attackingSide === 'away' ? 'top' : 'bottom';

  // このチームの打席のみ抽出し、(battingOrder, inning) でインデックス化
  // 同一打順×イニングに複数打席がある場合、最後のものを使用
  const paMap = useMemo(() => {
    const map = new Map<string, PlateAppearance>();
    for (const pa of plateAppearances) {
      if (pa.topBottom !== sideTopBottom) continue;
      const key = `${pa.battingOrder}-${pa.inning}`;
      map.set(key, pa);
    }
    return map;
  }, [plateAppearances, sideTopBottom]);

  // 現在このチームが攻撃中かどうか
  const isAttacking = currentTopBottom === sideTopBottom;

  // 表示するイニング数（最低9、現在イニングまで）
  const displayInnings = Math.max(9, currentInning);

  // 現在のイニング列へ自動スクロール
  useEffect(() => {
    if (currentInningRef.current && scrollContainerRef.current) {
      currentInningRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    }
  }, [currentInning]);

  return (
    <div className="bg-white border-b border-zinc-200">
      <div className="flex">
        {/* 左固定列: 打順・選手名・守備位置 */}
        <div className="flex-shrink-0 sticky left-0 z-10 bg-white border-r border-zinc-300">
          {/* ヘッダー行 */}
          <div className="h-7 flex items-center px-2 border-b border-zinc-200 bg-zinc-50">
            <span className="text-[10px] text-zinc-500 font-medium">選手</span>
          </div>

          {/* 選手行 */}
          {attackingLineup.map((player, index) => {
            const order = index + 1;
            const isCurrent = isAttacking && index === currentBatterIndex;
            return (
              <div
                key={order}
                className={`h-20 flex items-center px-2 gap-1.5 border-b border-zinc-100 ${
                  isCurrent ? 'bg-blue-50' : ''
                }`}
              >
                {/* 打順番号 */}
                <span className={`text-xs font-bold w-4 text-right flex-shrink-0 ${
                  isCurrent ? 'text-blue-600' : 'text-zinc-500'
                }`}>
                  {order}
                </span>

                {/* 守備位置 */}
                <span className="text-[10px] text-zinc-400 w-5 flex-shrink-0 text-center">
                  {player ? POSITION_LABELS[player.position] : '-'}
                </span>

                {/* 選手名 */}
                <span className={`text-xs font-medium truncate max-w-[80px] ${
                  isCurrent ? 'text-blue-700' : 'text-zinc-700'
                }`}>
                  {player?.playerName ?? `打者${order}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 横スクロールエリア: イニング列 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto"
        >
          <div className="flex min-w-max">
            {Array.from({ length: displayInnings }, (_, inningIdx) => {
              const inningNum = inningIdx + 1;
              const isCurrentInningCol = isAttacking && inningNum === currentInning;

              return (
                <div
                  key={inningNum}
                  ref={isCurrentInningCol ? currentInningRef : undefined}
                  className={isCurrentInningCol ? 'bg-blue-50/30' : ''}
                >
                  {/* イニングヘッダー */}
                  <div className={`h-7 w-20 flex items-center justify-center border-b border-r border-zinc-200 ${
                    isCurrentInningCol ? 'bg-blue-100' : 'bg-zinc-50'
                  }`}>
                    <span className={`text-[10px] font-bold ${
                      isCurrentInningCol ? 'text-blue-700' : 'text-zinc-500'
                    }`}>
                      {inningNum}回
                    </span>
                  </div>

                  {/* 各打順のセル */}
                  {attackingLineup.map((_, orderIdx) => {
                    const battingOrder = orderIdx + 1;
                    const pa = paMap.get(`${battingOrder}-${inningNum}`) ?? null;
                    const isCurrent = isCurrentInningCol && orderIdx === currentBatterIndex;

                    return (
                      <div key={battingOrder} className="border-b border-r border-zinc-100">
                        <ScoreCell
                          plateAppearance={pa}
                          isCurrent={isCurrent}
                          isCurrentInning={isCurrentInningCol}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
