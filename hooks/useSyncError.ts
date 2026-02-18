'use client';

import { useCallback, useRef, useState } from 'react';

interface UseSyncErrorReturn {
  syncError: string | null;
  clearSyncError: () => void;
  syncWithNotification: (fn: () => Promise<void>) => Promise<void>;
}

/**
 * Supabase 同期エラーを管理するフック。
 * - オンライン時のエラーのみ通知する（オフライン時は無視）
 * - 開発環境ではコンソールにエラーログを出力する
 * - 5秒後に自動クリア（タイマーはアンマウント時・手動クリア時にキャンセル）
 */
export function useSyncError(): UseSyncErrorReturn {
  const [syncError, setSyncError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSyncError = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSyncError(null);
  }, []);

  const syncWithNotification = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[SyncError]', err);
        }
        // 既存タイマーをキャンセルしてから再設定（連続エラー時の積み重なり防止）
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
        setSyncError('クラウド同期に失敗しました。データはローカルに保存されています。');
        timerRef.current = setTimeout(() => {
          setSyncError(null);
          timerRef.current = null;
        }, 5000);
      }
    }
  }, []);

  return { syncError, clearSyncError, syncWithNotification };
}
