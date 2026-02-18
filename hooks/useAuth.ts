'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';
import { fetchCurrentTeam } from '@/lib/supabase/queries/teams';

interface AuthState {
  user: User | null;
  teamId: string | null;
  teamName: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

async function resolveTeam(user: User): Promise<{ teamId: string | null; teamName: string | null }> {
  try {
    const team = await fetchCurrentTeam(user.id);
    if (team) {
      return { teamId: team.teamId, teamName: team.teamName };
    }
  } catch {
    // チーム取得失敗時はフォールバックへ
  }
  // トリガー未適用の既存ユーザー向けフォールバック
  const metaName = user.user_metadata?.team_name as string | undefined;
  return { teamId: null, teamName: metaName ?? null };
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 現在のセッションを取得
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        resolveTeam(data.user).then(({ teamId: id, teamName: name }) => {
          setTeamId(id);
          setTeamName(name);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 認証状態の変化を購読
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setIsLoading(true);
        resolveTeam(newUser).then(({ teamId: id, teamName: name }) => {
          setTeamId(id);
          setTeamName(name);
          setIsLoading(false);
        });
      } else {
        setTeamId(null);
        setTeamName(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setTeamId(null);
    setTeamName(null);
    // ローカル永続化ストアをクリアして別ユーザーのデータが残らないようにする
    useGameStore.getState().clearAll();
  };

  return { user, teamId, teamName, isLoading, logout };
}
