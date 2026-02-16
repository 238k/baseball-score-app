'use client';

import type { ChangeEvent } from 'react';
import type { TeamInfoValues } from '@/types/game-setup';

type TeamInfoErrors = Partial<Record<keyof TeamInfoValues, string>>;

interface TeamInfoSectionProps {
  values: TeamInfoValues;
  errors: TeamInfoErrors;
  onChange: (field: keyof TeamInfoValues, value: string) => void;
}

export function TeamInfoSection({ values, errors, onChange }: TeamInfoSectionProps) {
  function handleChange(field: keyof TeamInfoValues) {
    return (e: ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-800">試合情報</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="homeTeamName" className="block text-sm font-medium text-zinc-700 mb-1">
            ホームチーム名 <span className="text-red-500">*</span>
          </label>
          <input
            id="homeTeamName"
            type="text"
            value={values.homeTeamName}
            onChange={handleChange('homeTeamName')}
            maxLength={50}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 読売ジャイアンツ"
          />
          {errors.homeTeamName && (
            <p className="mt-1 text-xs text-red-500">{errors.homeTeamName}</p>
          )}
        </div>

        <div>
          <label htmlFor="awayTeamName" className="block text-sm font-medium text-zinc-700 mb-1">
            ビジターチーム名 <span className="text-red-500">*</span>
          </label>
          <input
            id="awayTeamName"
            type="text"
            value={values.awayTeamName}
            onChange={handleChange('awayTeamName')}
            maxLength={50}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 阪神タイガース"
          />
          {errors.awayTeamName && (
            <p className="mt-1 text-xs text-red-500">{errors.awayTeamName}</p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-zinc-700 mb-1">
            試合日 <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            value={values.date}
            onChange={handleChange('date')}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500">{errors.date}</p>
          )}
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-zinc-700 mb-1">
            球場名
          </label>
          <input
            id="venue"
            type="text"
            value={values.venue}
            onChange={handleChange('venue')}
            maxLength={100}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 東京ドーム"
          />
          {errors.venue && (
            <p className="mt-1 text-xs text-red-500">{errors.venue}</p>
          )}
        </div>
      </div>
    </section>
  );
}
