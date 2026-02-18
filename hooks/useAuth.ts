'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';

interface AuthState {
  user: User | null;
  teamName: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 現在のセッションを取得
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    // 認証状態の変化を購読
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    // ローカル永続化ストアをクリアして別ユーザーのデータが残らないようにする
    useGameStore.getState().clearAll();
  };

  const teamName = (user?.user_metadata?.team_name as string | undefined) ?? null;

  return { user, teamName, isLoading, logout };
}
