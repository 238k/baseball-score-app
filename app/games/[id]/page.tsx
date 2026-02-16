import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'スコア入力 | 野球スコアブック',
};

// スコア入力画面（今後実装予定）
export default function ScorePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center text-zinc-500">
        <p className="text-lg font-medium">スコア入力画面</p>
        <p className="text-sm mt-1">（実装予定）</p>
      </div>
    </div>
  );
}
