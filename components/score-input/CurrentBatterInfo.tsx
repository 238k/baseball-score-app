'use client';

interface CurrentBatterInfoProps {
  battingOrder: number;
  batterName: string;
}

export function CurrentBatterInfo({ battingOrder, batterName }: CurrentBatterInfoProps) {
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center">
      <span className="text-xs text-zinc-500 mr-2">{battingOrder}番</span>
      <span className="text-lg font-bold text-zinc-900">{batterName}</span>
    </div>
  );
}
