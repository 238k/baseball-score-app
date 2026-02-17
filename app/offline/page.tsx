'use client';

import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-5xl mb-4">⚾</div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">オフラインです</h1>
        <p className="text-zinc-500 text-sm mb-6">
          ネットワーク接続を確認してください。
          <br />
          スコア入力中のデータはローカルに保存されています。
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-6 bg-blue-600 text-white hover:bg-blue-700"
        >
          再試行
        </Button>
      </div>
    </div>
  );
}
