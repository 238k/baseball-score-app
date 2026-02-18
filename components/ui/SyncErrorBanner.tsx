'use client';

interface SyncErrorBannerProps {
  message: string;
  onClose: () => void;
}

/**
 * Supabase 同期失敗時に表示する非破壊的なエラーバナー
 */
export function SyncErrorBanner({ message, onClose }: SyncErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-xs px-3 py-2 rounded"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="通知を閉じる"
        className="flex-shrink-0 text-amber-600 hover:text-amber-900 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
