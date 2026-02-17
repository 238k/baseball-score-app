'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * オンライン/オフライン状態を管理し、オンライン復帰時に Supabase へ同期するフック
 */
export function useOnlineSync(): boolean {
  // lazy initializer: SSR では navigator が存在しないため true を返す
  // クライアントでは初回レンダリング時に実際の接続状態を取得
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { user } = useAuth();

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (!user) return;
      // getState() で最新の games を取得（依存配列から除外するため）
      const { games, syncToSupabase } = useGameStore.getState();
      for (const game of games) {
        syncToSupabase(game.id).catch(() => {
          // 同期エラーは無視してローカルデータを継続利用
        });
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]); // games / syncToSupabase は getState() 経由で取得するため依存配列から除外

  return isOnline;
}
