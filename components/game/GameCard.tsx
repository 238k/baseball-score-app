import Link from 'next/link';
import type { Game } from '@/types/game';

interface GameCardProps {
  game: Game;
}

const STATUS_LABEL: Record<Game['status'], string> = {
  in_progress: '記録中',
  completed: '完了',
};

const STATUS_CLASS: Record<Game['status'], string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-zinc-100 text-zinc-500',
};

export function GameCard({ game }: GameCardProps) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-zinc-500">{game.date}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_CLASS[game.status]}`}>
            {STATUS_LABEL[game.status]}
          </span>
        </div>
        <p className="text-sm font-bold text-zinc-900 truncate">
          {game.awayTeamName} vs {game.homeTeamName}
        </p>
        {game.venue && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{game.venue}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/games/${game.id}/stats`}
          className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70"
        >
          成績
        </Link>
        {game.status === 'in_progress' && (
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
          >
            記録
          </Link>
        )}
      </div>
    </div>
  );
}
