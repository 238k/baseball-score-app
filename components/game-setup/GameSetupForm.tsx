'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import type { TeamInfoValues, LineupValues, LineupRow } from '@/types/game-setup';
import { TeamInfoSection } from './TeamInfoSection';
import { LineupSection, createInitialLineup } from './LineupSection';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import type { FieldingPosition } from '@/types/game';

// バリデーションスキーマ
const CreateGameSchema = z.object({
  homeTeamName: z.string().min(1, 'ホームチーム名を入力してください').max(50, '50文字以内で入力してください'),
  awayTeamName: z.string().min(1, 'ビジターチーム名を入力してください').max(50, '50文字以内で入力してください'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '試合日を入力してください'),
  venue: z.string().max(100, '100文字以内で入力してください').optional(),
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialLineupValues(): LineupValues {
  return { home: createInitialLineup(), away: createInitialLineup() };
}

export function GameSetupForm() {
  const router = useRouter();
  const { createGame, addLineupsForGame, syncToSupabase } = useGameStore();
  const { user } = useAuth();

  const [teamInfo, setTeamInfo] = useState<TeamInfoValues>({
    homeTeamName: '',
    awayTeamName: '',
    date: todayStr(),
    venue: '',
  });

  const [teamInfoErrors, setTeamInfoErrors] = useState<Partial<Record<keyof TeamInfoValues, string>>>({});
  const [lineups, setLineups] = useState<LineupValues>(createInitialLineupValues);
  const [lineupErrors, setLineupErrors] = useState<{ home: string[]; away: string[] }>({
    home: Array(9).fill(''),
    away: Array(9).fill(''),
  });

  const handleTeamInfoChange = useCallback((field: keyof TeamInfoValues, value: string) => {
    setTeamInfo((prev) => ({ ...prev, [field]: value }));
    setTeamInfoErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleLineupChange = useCallback(
    (side: 'home' | 'away', index: number, field: keyof LineupRow, value: string | FieldingPosition | boolean) => {
      setLineups((prev) => {
        const updated = [...prev[side]];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, [side]: updated };
      });
      // エラークリア
      setLineupErrors((prev) => {
        const updated = [...prev[side]];
        updated[index] = '';
        return { ...prev, [side]: updated };
      });
    },
    [],
  );

  const handleAddBench = useCallback((side: 'home' | 'away') => {
    setLineups((prev) => ({
      ...prev,
      [side]: [...prev[side], { playerName: '', position: '', isStarter: false }],
    }));
    setLineupErrors((prev) => ({
      ...prev,
      [side]: [...prev[side], ''],
    }));
  }, []);

  // 先発9名が全員入力済みかチェック
  const isStarterComplete = (side: 'home' | 'away') => {
    return lineups[side].slice(0, 9).every(
      (row) => row.playerName.trim() !== '' && row.position !== '',
    );
  };

  const canSubmit =
    teamInfo.homeTeamName.trim() !== '' &&
    teamInfo.awayTeamName.trim() !== '' &&
    teamInfo.date !== '' &&
    isStarterComplete('home') &&
    isStarterComplete('away');

  function validate(): boolean {
    let valid = true;

    // チーム情報バリデーション
    const result = CreateGameSchema.safeParse({
      homeTeamName: teamInfo.homeTeamName,
      awayTeamName: teamInfo.awayTeamName,
      date: teamInfo.date,
      venue: teamInfo.venue || undefined,
    });

    if (!result.success) {
      const fieldErrors: Partial<TeamInfoValues> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TeamInfoValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setTeamInfoErrors(fieldErrors);
      valid = false;
    }

    // ラインナップバリデーション（先発9名）
    const newLineupErrors = { home: [...lineupErrors.home], away: [...lineupErrors.away] };
    for (const side of ['home', 'away'] as const) {
      lineups[side].slice(0, 9).forEach((row, i) => {
        if (row.playerName.trim() === '') {
          newLineupErrors[side][i] = '選手名を入力してください';
          valid = false;
        } else if (row.position === '') {
          newLineupErrors[side][i] = '守備位置を選択してください';
          valid = false;
        }
      });
    }
    setLineupErrors(newLineupErrors);

    return valid;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const game = createGame({
      userId: user?.id ?? 'local',
      homeTeamName: teamInfo.homeTeamName,
      awayTeamName: teamInfo.awayTeamName,
      date: teamInfo.date,
      venue: teamInfo.venue || undefined,
    });

    // 両チームのラインナップを登録
    for (const side of ['home', 'away'] as const) {
      const entries = lineups[side]
        .filter((row) => row.playerName.trim() !== '' && row.position !== '')
        .map((row, index) => ({
          gameId: game.id,
          side,
          battingOrder: index < 9 ? index + 1 : 9, // 控えは9打順扱い（暫定）
          cycle: 1,
          playerName: row.playerName.trim(),
          position: row.position as FieldingPosition,
          isStarter: row.isStarter,
        }));
      addLineupsForGame(game.id, entries);
    }

    // Supabase に非同期で同期（認証済み・オフライン時はローカル保存で継続）
    if (user) {
      syncToSupabase(game.id).catch(() => {});
    }

    router.push(`/games/${game.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <TeamInfoSection
        values={teamInfo}
        errors={teamInfoErrors}
        onChange={handleTeamInfoChange}
      />

      <LineupSection
        values={lineups}
        errors={lineupErrors}
        onChange={handleLineupChange}
        onAddBench={handleAddBench}
      />

      <div className="flex justify-end pt-4 border-t border-zinc-200">
        <button
          type="submit"
          disabled={!canSubmit}
          className="min-h-[44px] px-8 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          試合開始
        </button>
      </div>
    </form>
  );
}
