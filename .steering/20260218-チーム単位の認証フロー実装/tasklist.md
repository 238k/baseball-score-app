# タスクリスト: チーム単位の認証フロー実装

## タスク

### Phase 1: middleware 更新
- [x] `/` を認証必須ルートに追加（未認証 → `/login`）
- [x] 認証済みユーザーが `/login` `/signup` にアクセスした場合 `/` にリダイレクト

### Phase 2: useAuth 拡張
- [x] `teamName` を `user.user_metadata.team_name` から返すように追加

### Phase 3: サインアップフォーム更新
- [x] チーム名フィールド（Input + Label）を追加（メールの上に配置）
- [x] チーム名のバリデーション（必須、1文字以上）を追加
- [x] `supabase.auth.signUp` に `options.data.team_name` を渡す

### Phase 4: ログインページのテキスト変更
- [x] サブタイトルを「チームアカウントでサインイン」に変更

### Phase 5: ホームページ更新
- [x] ヘッダーにチーム名（またはメールアドレス）とログアウトボタンを追加
- [x] `sortedGames` を `game.userId === user?.id` でフィルタリング

## 実装後の振り返り

- **実装完了日**: 2026-02-18
- **計画と実績の差分**:
  - `teams` テーブル新設・`game.team_id` 追加は Supabase CLI なしにマイグレーションが実行できないため見送り。代わりに `user.user_metadata.team_name` にチーム名を保存する方式を採用（issue 本文にも「Organization 概念を利用するか teams テーブルを新設するか」と選択肢として記載されていたため許容範囲）
  - implementation-validator の指摘を受け、2件の修正を追加実施:
    1. middleware.ts でリダイレクト時にリフレッシュ済みクッキーを引き継ぐ
    2. logout 時に `gameStore.clearAll()` を呼び出してローカルストアを初期化
  - チーム名の50文字上限バリデーションも追加
- **学んだこと**:
  - Supabase middleware でリダイレクト時は `supabaseResponse.cookies.getAll()` をリダイレクトレスポンスにも付与する必要がある（JWT リフレッシュ結果を失わないため）
  - `zustand/middleware persist` はユーザーをまたいでデータが残るため、logout 時にストアクリアが必須
  - `user.user_metadata` は `Record<string, unknown>` 型のため、`as string | undefined` で型を絞ってから `?? null` でフォールバック
- **テスト**: 全98テスト通過。lint・typecheck ともにエラーなし
- **次回への改善提案**:
  - `hooks/useAuth.ts` と auth ページのユニットテスト追加（現在カバレッジゼロ）
  - `app/page.tsx` で `isLoading` 中のスケルトン UI 表示を追加してちらつき防止
  - チーム名バリデーションを Zod スキーマに統合する（他フォームとの一貫性）
  - 将来的に複数メンバーをサポートする場合は `teams` / `team_members` テーブルの追加が必要
