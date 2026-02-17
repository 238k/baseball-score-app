'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { FIXTURE_GAME } from '@/lib/fixtures';

export function QuickStartButton() {
  const router = useRouter();
  const { createGame, addLineupsForGame } = useGameStore();

  function handleQuickStart() {
    const game = createGame(FIXTURE_GAME.game);

    for (const side of ['home', 'away'] as const) {
      const entries = FIXTURE_GAME[side].map((row, index) => ({
        gameId: game.id,
        side,
        battingOrder: index + 1,
        cycle: 1,
        playerName: row.playerName,
        position: row.position,
        isStarter: true,
      }));
      addLineupsForGame(game.id, entries);
    }

    router.push(`/games/${game.id}`);
  }

  return (
    <button
      type="button"
      onClick={handleQuickStart}
      className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-md border border-zinc-300 bg-white text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors"
    >
      テスト試合を開始
    </button>
  );
}
