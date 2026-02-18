'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (teamName.trim().length === 0) {
      setError('チーム名を入力してください');
      return;
    }
    if (teamName.trim().length > 50) {
      setError('チーム名は50文字以内で入力してください');
      return;
    }
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { team_name: teamName.trim() } },
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'このメールアドレスは既に登録されています'
          : '登録に失敗しました。もう一度お試しください'
        );
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      const isEnvError = error instanceof Error && error.message.includes('Missing');
      setError(
        isEnvError
          ? '認証設定の読み込みに失敗しました。環境変数を確認してください。'
          : '登録処理に失敗しました。時間をおいて再度お試しください。'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">チームアカウント登録</h1>
        <p className="text-sm text-zinc-500 mb-8">野球スコアブックのチームアカウントを作成</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="team-name" className="text-zinc-700">チーム名</Label>
            <Input
              id="team-name"
              type="text"
              required
              autoComplete="organization"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="例: 東京ベースボールクラブ"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-zinc-700">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-zinc-700">パスワード（6文字以上）</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password-confirm" className="text-zinc-700">パスワード（確認）</Label>
            <Input
              id="password-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            {isLoading ? '登録中...' : 'チームアカウントを作成'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
