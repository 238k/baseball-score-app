# 実装設計: データ保存・試合一覧（Supabase連携）

## 実装方針

### フェーズ1: Zustand Persist（優先度最高）
- `zustand/middleware` の `persist` でローカルストレージ永続化
- `gameStore` と `scoreStore` に適用
- ページリフレッシュ後もデータが維持される

### フェーズ2: Supabase 基盤セットアップ
- `npm install @supabase/supabase-js`
- `.env.local.example` でenv vars テンプレートを提供
- `lib/supabase/client.ts` - ブラウザ用シングルトンクライアント
- `lib/supabase/types.ts` - DB テーブルの型定義

### フェーズ3: 認証 UI
- `app/(auth)/login/page.tsx` - メール/パスワード ログイン
- `app/(auth)/signup/page.tsx` - サインアップ
- `middleware.ts` - 認証チェック（`/games/**` を保護）
- `hooks/useAuth.ts` - 認証状態管理フック

### フェーズ4: Supabase CRUD
- `lib/supabase/queries/games.ts` - games テーブル CRUD
- `lib/supabase/queries/lineups.ts` - lineups テーブル CRUD
- `gameStore` から Supabase 操作を呼び出す

### フェーズ5: ホームページ試合一覧
- `components/game/GameCard.tsx` - 試合カードコンポーネント
- `app/page.tsx` を更新: 試合一覧表示（ローカルストア優先）

### フェーズ6: SQL マイグレーション
- `supabase/migrations/001_initial.sql`
- games, lineups, innings テーブル
- RLS ポリシー

## アーキテクチャ方針

```
app/(auth)/login  → lib/supabase/client.ts → Supabase Auth
app/page.tsx      → useGameStore (persist) → localStorage
                  ↘ lib/supabase/queries/games.ts → Supabase DB
```

## Zustand Persist の設計

```typescript
// gameStore に persist を追加
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ... 既存の実装
    }),
    {
      name: 'baseball-score-game-store',
      partialize: (state) => ({ games: state.games, lineups: state.lineups }),
    }
  )
);
```

## 認証フロー
1. `/games/**` へのアクセス → middleware.ts でセッション確認
2. 未認証 → `/auth/login` にリダイレクト
3. ログイン成功 → `/` にリダイレクト
4. 認証済み → 試合データを Supabase から取得してストアに追加

## Supabase クライアント

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

注: @supabase/ssr が必要（Next.js App Router 推奨パターン）

## 依存関係追加
- `@supabase/supabase-js` - Supabase クライアント
- `@supabase/ssr` - Next.js SSR/App Router 対応
