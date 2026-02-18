# 設計: チーム単位の認証フロー実装

## 方針

DB スキーマ変更（`teams` テーブル新設・`team_id` 追加）は Supabase マイグレーション実行が
必要なため、MVP では **Supabase Auth ユーザーメタデータ** にチーム名を保存する方式を採用する。

- 1 チーム = 1 Supabase Auth アカウント（チームでアカウントを共有）
- チーム名は `supabase.auth.signUp({ options: { data: { team_name: '...' } } })` で保存
- `user.user_metadata.team_name` で取得
- `games.user_id` は変更せず、既存の RLS ポリシーをそのまま利用

## 変更内容

### 1. middleware.ts

`/` (ホームページ) を認証必須ルートに追加する。

```
未認証 + `/` → `/login` にリダイレクト
未認証 + `/games/**` → `/login` にリダイレクト（既存）
認証済み + `/login` or `/signup` → `/` にリダイレクト
```

### 2. app/(auth)/signup/page.tsx

チーム名フィールドを追加:
- `teamName` state を追加
- `<Input id="team-name" ...>` を `<Label>チーム名</Label>` と共に追加（メールの上）
- `supabase.auth.signUp` に `options: { data: { team_name: teamName.trim() } }` を追加
- バリデーション: チーム名は必須、1文字以上

### 3. app/(auth)/login/page.tsx

テキスト変更:
- `"野球スコアブックにサインイン"` → `"チームアカウントでサインイン"`

### 4. hooks/useAuth.ts

`teamName` を返すように拡張:
```ts
interface AuthState {
  user: User | null;
  teamName: string | null;  // user.user_metadata.team_name
  isLoading: boolean;
  logout: () => Promise<void>;
}
```

### 5. app/page.tsx

- ヘッダーにチーム名とログアウトボタンを追加
- `sortedGames` を `user?.id` でフィルタリング（`game.userId === user?.id`）
- タイトルを `"野球スコアブック"` → チーム名表示に変更

## 画面フロー

```
/ (未認証) → /login
/login → ログイン成功 → /
/ (認証済み) → 自チームの試合一覧表示
```
