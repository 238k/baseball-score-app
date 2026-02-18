'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { GameCard } from '@/components/game/GameCard';
import { QuickStartButton } from '@/components/dev/QuickStartButton';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { games, loadFromSupabase } = useGameStore();
  const { user, teamId, teamName, logout } = useAuth();

  useEffect(() => {
    if (user) {
      loadFromSupabase().catch(() => {
        // ネットワークエラー時はローカルデータのまま表示を継続
      });
    }
  }, [user, loadFromSupabase]);

  // 現在のログインユーザー（またはチームメンバー）の試合のみ表示（日付降順）
  const sortedGames = [...games]
    .filter((game) => game.userId === user?.id || (teamId !== null && game.teamId === teamId))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">チーム</p>
          <p className="text-sm font-semibold text-zinc-900">{teamName ?? user?.email ?? ''}</p>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          ログアウト
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">野球スコアブック</h1>
        <p className="text-zinc-500 mb-6">NPB準拠のデジタルスコアブック</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/games/new"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            新しい試合を作成
          </Link>
          <QuickStartButton />
        </div>

        {sortedGames.length > 0 ? (
          <div>
            <h2 className="text-sm font-medium text-zinc-500 mb-3">試合一覧</h2>
            <div className="space-y-2">
              {sortedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400 text-sm">
            <p>試合記録がありません</p>
            <p className="mt-1">「新しい試合を作成」から始めてください</p>
          </div>
        )}
      </div>
    </div>
  );
}
