'use client';

import type { Pitch } from '@/types/score';

interface CurrentBatterInfoProps {
  battingOrder: number;
  batterName: string;
  pitches: Pitch[];
}

export function CurrentBatterInfo({ battingOrder, batterName, pitches }: CurrentBatterInfoProps) {
  const balls = pitches.filter((p) => p.type === 'ball').length;
  const strikes = pitches.filter(
    (p) => p.type === 'strike_swinging' || p.type === 'strike_looking',
  ).length;
  const fouls = pitches.filter((p) => p.type === 'foul').length;

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
      <div>
        <span className="text-xs text-zinc-500 mr-2">{battingOrder}番</span>
        <span className="text-lg font-bold text-zinc-900">{batterName}</span>
      </div>
      <div className="flex gap-3 text-sm font-medium">
        <span className="text-green-700">B: {balls}</span>
        <span className="text-red-600">S: {strikes}</span>
        <span className="text-zinc-500">F: {fouls}</span>
        <span className="text-zinc-400 text-xs self-center">{pitches.length}球</span>
      </div>
    </div>
  );
}
