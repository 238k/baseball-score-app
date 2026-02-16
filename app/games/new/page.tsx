import type { Metadata } from 'next';
import { GameSetupForm } from '@/components/game-setup/GameSetupForm';

export const metadata: Metadata = {
  title: '試合設定 | 野球スコアブック',
};

export default function GameNewPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">試合設定</h1>
        <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
          <GameSetupForm />
        </div>
      </div>
    </div>
  );
}
