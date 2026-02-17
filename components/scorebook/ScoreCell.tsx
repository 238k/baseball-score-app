'use client';

import { Diamond } from './Diamond';
import type { PlateAppearance, PlateResult } from '@/types/score';
import { OUT_RESULTS } from '@/types/score';

// PlateResult → 到達塁の変換
export function getReachedBase(result: PlateResult): 0 | 1 | 2 | 3 | 4 {
  switch (result) {
    case '単打':
    case '四球':
    case '死球':
    case '野選':
    case 'エラー':
    case '振り逃げ':
      return 1;
    case '二塁打':
      return 2;
    case '三塁打':
      return 3;
    case '本塁打':
      return 4;
    default:
      // ゴロ・フライ・ライナー・三振振り・三振見・犠打・犠飛・併殺打
      return 0;
  }
}

// PlateResult → アウト判定（types/score.ts の OUT_RESULTS を使用）
export function isOutResult(result: PlateResult): boolean {
  return OUT_RESULTS.includes(result);
}

// PlateResult → 短縮ラベル
export function getResultLabel(result: PlateResult): string {
  const labels: Record<PlateResult, string> = {
    '単打': 'H',
    '二塁打': '2B',
    '三塁打': '3B',
    '本塁打': 'HR',
    '三振振り': 'K',
    '三振見': 'Kc',
    '四球': 'BB',
    '死球': 'HBP',
    'ゴロ': 'G',
    'フライ': 'F',
    'ライナー': 'L',
    '犠打': 'S',
    '犠飛': 'SF',
    '野選': 'FC',
    'エラー': 'E',
    '併殺打': 'DP',
    '振り逃げ': 'KS',
  };
  return labels[result] ?? result;
}

export interface ScoreCellProps {
  /** 打席データ（null = まだ打席が来ていない） */
  plateAppearance: PlateAppearance | null;
  /** 現在打席中の打者かどうか */
  isCurrent: boolean;
  /** 現在のイニングのセルかどうか */
  isCurrentInning: boolean;
}

export function ScoreCell({ plateAppearance, isCurrent, isCurrentInning }: ScoreCellProps) {
  const hasPa = plateAppearance !== null;
  const reachedBase = hasPa ? getReachedBase(plateAppearance.result) : null;
  const isOut = hasPa ? isOutResult(plateAppearance.result) : false;
  const label = hasPa ? getResultLabel(plateAppearance.result) : '';

  // セルの背景色
  let bgClass = 'bg-white';
  if (isCurrent) {
    bgClass = 'bg-blue-50 ring-2 ring-blue-400 ring-inset';
  } else if (!isCurrentInning && !hasPa) {
    bgClass = 'bg-zinc-50';
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-20 h-20 border border-zinc-200 ${bgClass} flex-shrink-0`}
    >
      {hasPa ? (
        <>
          {/* ダイヤモンド */}
          <Diamond reachedBase={reachedBase} isOut={isOut} size={36} />

          {/* 結果ラベル（左下） */}
          <span
            className={`absolute bottom-0.5 left-1 text-[10px] font-bold leading-none ${
              isOut ? 'text-red-600' : 'text-blue-700'
            }`}
          >
            {label}
          </span>

          {/* 投球数（右下） */}
          <span className="absolute bottom-0.5 right-1 text-[9px] text-zinc-400 leading-none">
            {plateAppearance.pitchCount}
          </span>
        </>
      ) : isCurrent ? (
        /* 現在打席中（結果未確定） */
        <Diamond reachedBase={null} isOut={false} size={36} />
      ) : null}
    </div>
  );
}
