'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { FIXTURE_GAME } from '@/lib/fixtures';

export function QuickStartButton() {
  const router = useRouter();
  const { createGame, addLineupsForGame, syncToSupabase } = useGameStore();
  const { user } = useAuth();

  function handleQuickStart() {
    const game = createGame({ ...FIXTURE_GAME.game, userId: user?.id ?? 'local' });

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

    // Supabase に非同期で同期（認証済み時のみ・オフライン時はローカル保存で継続）
    if (user) {
      syncToSupabase(game.id).catch(() => {});
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
