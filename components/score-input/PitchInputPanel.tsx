'use client';

import type { PitchType } from '@/types/score';

interface PitchButton {
  type: PitchType;
  label: string;
  colorClass: string;
}

const PITCH_BUTTONS: PitchButton[] = [
  { type: 'ball',            label: 'B',       colorClass: 'bg-green-600 hover:bg-green-700 text-white' },
  { type: 'strike_swinging', label: 'S振',     colorClass: 'bg-red-600 hover:bg-red-700 text-white' },
  { type: 'strike_looking',  label: 'S見',     colorClass: 'bg-red-500 hover:bg-red-600 text-white' },
  { type: 'foul',            label: 'F',       colorClass: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { type: 'in_play',         label: 'インプレー', colorClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { type: 'hbp',             label: '死球',    colorClass: 'bg-purple-600 hover:bg-purple-700 text-white' },
];

interface PitchInputPanelProps {
  onPitch: (type: PitchType) => void;
}

export function PitchInputPanel({ onPitch }: PitchInputPanelProps) {
  return (
    <div className="p-4">
      <p className="text-xs font-medium text-zinc-500 mb-3">投球入力</p>
      <div className="grid grid-cols-3 gap-3">
        {PITCH_BUTTONS.map(({ type, label, colorClass }) => (
          <button
            key={type}
            type="button"
            onClick={() => onPitch(type)}
            className={`min-h-[64px] rounded-lg font-bold text-base transition-opacity active:opacity-70 ${colorClass}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
