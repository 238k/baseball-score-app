'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { FieldingPosition } from '@/types/game';
import type { LineupRow, LineupValues } from '@/types/game-setup';

// 守備位置の名称マップ
const FIELDING_POSITION_LABELS: Record<FieldingPosition, string> = {
  1: '投手 (P)',
  2: '捕手 (C)',
  3: '一塁 (1B)',
  4: '二塁 (2B)',
  5: '三塁 (3B)',
  6: '遊撃 (SS)',
  7: '左翼 (LF)',
  8: '中堅 (CF)',
  9: '右翼 (RF)',
  10: '指名打者 (DH)',
};

const FIELDING_POSITIONS: FieldingPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 先発9名の初期値を生成
export function createInitialLineup(): LineupRow[] {
  return Array.from({ length: 9 }, () => ({
    playerName: '',
    position: '' as const,
    isStarter: true,
  }));
}

interface LineupSectionProps {
  values: LineupValues;
  errors: { home: string[]; away: string[] };
  onChange: (side: 'home' | 'away', index: number, field: keyof LineupRow, value: string | FieldingPosition | boolean) => void;
  onAddBench: (side: 'home' | 'away') => void;
}

export function LineupSection({ values, errors, onChange, onAddBench }: LineupSectionProps) {
  const [activeSide, setActiveSide] = useState<'home' | 'away'>('home');
  const currentLineup = values[activeSide];
  const currentErrors = errors[activeSide];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-800">オーダー</h2>

      {/* ホーム/ビジタータブ */}
      <div className="flex gap-2 border-b border-zinc-200">
        {(['home', 'away'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setActiveSide(side)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSide === side
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {side === 'home' ? 'ホーム' : 'ビジター'}
          </button>
        ))}
      </div>

      {/* 打順ヘッダー */}
      <div className="grid grid-cols-[40px_1fr_160px] gap-2 px-1 text-xs font-medium text-zinc-500">
        <span>打順</span>
        <span id="lineup-col-player">選手名</span>
        <span id="lineup-col-position">守備位置</span>
      </div>

      {/* 打順行 */}
      <div className="space-y-2">
        {currentLineup.map((row, index) => (
          <LineupRowItem
            key={index}
            index={index}
            side={activeSide}
            row={row}
            error={currentErrors[index]}
            onChange={(field, value) => onChange(activeSide, index, field, value)}
          />
        ))}
      </div>

      {/* 控え追加ボタン */}
      <button
        type="button"
        onClick={() => onAddBench(activeSide)}
        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 min-h-[44px] px-2"
      >
        <span className="text-lg leading-none">+</span>
        <span>控え選手を追加</span>
      </button>
    </section>
  );
}

interface LineupRowItemProps {
  index: number;
  side: 'home' | 'away';
  row: LineupRow;
  error?: string;
  onChange: (field: keyof LineupRow, value: string | FieldingPosition | '') => void;
}

function LineupRowItem({ index, side, row, error, onChange }: LineupRowItemProps) {
  const isStarter = index < 9;
  const battingOrder = isStarter ? index + 1 : null;
  const sideLabel = side === 'home' ? 'ホーム' : 'ビジター';
  const playerInputId = `${side}-lineup-player-${index}`;
  const positionSelectId = `${side}-lineup-position-${index}`;
  const rowLabel = `${sideLabel} ${battingOrder ?? '控え'} ${isStarter ? '番打者' : '選手'}`;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[40px_1fr_160px] gap-2 items-center">
        <span className="text-sm font-medium text-zinc-600 text-center">
          {battingOrder ?? '控'}
        </span>

        <input
          id={playerInputId}
          type="text"
          value={row.playerName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('playerName', e.target.value)}
          aria-label={`${rowLabel} 選手名`}
          aria-describedby="lineup-col-player"
          placeholder={isStarter ? `${battingOrder}番打者` : '選手名'}
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          id={positionSelectId}
          value={row.position}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            onChange('position', value === '' ? '' : (Number(value) as FieldingPosition));
          }}
          aria-label={`${rowLabel} 守備位置`}
          aria-describedby="lineup-col-position"
          className="min-h-[44px] rounded-md border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">選択</option>
          {FIELDING_POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {FIELDING_POSITION_LABELS[pos]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="ml-10 text-xs text-red-500">{error}</p>}
    </div>
  );
}
