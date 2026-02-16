import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">野球スコアブック</h1>
        <p className="text-zinc-500 mb-8">NPB準拠のデジタルスコアブック</p>

        <Link
          href="/games/new"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          新しい試合を作成
        </Link>
      </div>
    </div>
  );
}
