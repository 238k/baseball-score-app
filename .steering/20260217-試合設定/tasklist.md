# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

---

## フェーズ1: 依存ライブラリのインストールと型定義

- [x] zustand・zod をインストールする
  - [x] `npm install zustand zod`
  - [x] インストール後に `npm test` が通ることを確認

- [x] `types/game.ts` を作成する
  - [x] `Game` interface を定義
  - [x] `Lineup` interface を定義
  - [x] `GameStatus` type を定義
  - [x] `FieldingPosition` type（1〜9のunion）を定義
  - [x] `SubstitutionType` type を定義
  - [x] `CreateGameInput` interface を定義（ストアのアクション引数用）

## フェーズ2: Zustand Store 実装

- [x] `store/gameStore.ts` を作成する
  - [x] `games: Game[]` 状態を定義
  - [x] `lineups: Record<string, Lineup[]>` 状態を定義（gameIdキー）
  - [x] `createGame(input: CreateGameInput): Game` アクションを実装
    - [x] `crypto.randomUUID()` でIDを生成
    - [x] `status: 'in_progress'` で作成
    - [x] `games` 配列に追加して返す
  - [x] `addLineupsForGame(gameId: string, lineups: Omit<Lineup, 'id'>[]): Lineup[]` アクションを実装
  - [x] `getGame(gameId: string): Game | undefined` セレクタを実装

- [x] `store/gameStore.test.ts` を作成する
  - [x] `createGame` が正しいGame オブジェクトを返すことをテスト
  - [x] `addLineupsForGame` がラインナップを登録できることをテスト

## フェーズ3: UIコンポーネント実装

- [x] `components/game-setup/TeamInfoSection.tsx` を作成する
  - [x] チーム名入力（ホーム・ビジター）の実装（必須・1〜50文字）
  - [x] 試合日入力の実装（必須、デフォルト今日）
  - [x] 球場名入力の実装（任意・最大100文字）
  - [x] エラーメッセージをインライン表示

- [x] `components/game-setup/LineupSection.tsx` を作成する
  - [x] 打順1〜9の選手名・守備位置入力行の実装
  - [x] 守備位置セレクト（1=投手〜9=右翼）の実装
  - [x] 控え選手追加ボタン・控え入力行の実装
  - [x] ホーム/ビジタータブ切り替えの実装
  - [x] タブレット向けの最小タッチ目標44px確保

- [x] `components/game-setup/GameSetupForm.tsx` を作成する
  - [x] フォーム全体の状態管理（`useState`）
  - [x] Zodスキーマ（`CreateGameSchema`）でバリデーション実装
  - [x] 先発9名未入力時に「試合開始」ボタンをdisabled
  - [x] 「試合開始」ハンドラ: `gameStore.createGame` → `addLineupsForGame` → `router.push`

## フェーズ4: ページファイルと既存ページの更新

- [x] `app/games/new/page.tsx` を作成する
  - [x] Metadata（ページタイトル「試合設定」）を設定
  - [x] `<GameSetupForm />` を描画

- [x] `app/page.tsx` を更新する
  - [x] 「新しい試合を作成」リンク（`/games/new` へのリンク）を追加
  - [x] 既存テスト（`app/page.test.tsx`）が引き続きパスすることを確認（フェーズ5で確認）

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test`（6テストパス）
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npx tsc --noEmit`（スクリプト未登録のため直接実行）

## フェーズ6: ドキュメント更新

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `app/games/[id]/page.tsx` のプレースホルダーを追加（遷移先として必要。設計書に記載はなかったが実装上必須）
- `npm run typecheck` スクリプトが存在せず `npm run type-check` を `package.json` に追加した
- `types/game-setup.ts` を新規作成（`TeamInfoValues`・`LineupRow`・`LineupValues` をコンポーネントから移動）
- `LineupRow` 型とコンポーネントの名前衝突を解消（コンポーネントを `LineupRowItem` にリネーム）

**新たに必要になったタスク**:
- `app/games/[id]/page.tsx` の作成（試合設定後の遷移先として最低限必要）

### 学んだこと

**技術的な学び**:
- Zustand v5 の `create` はシンプルなAPIで Store 構築できる
- `crypto.randomUUID()` はブラウザ・Node.js両環境で使用可能
- Next.js App Router では `[id]` ディレクトリ作成に `mkdir` でのシェルエスケープが必要

**プロセス上の改善点**:
- 遷移先ページのプレースホルダーは機能実装タスクに最初から含めるべき

### 次回への改善提案
- 次フェーズ（スコア入力）実装時に `app/games/[id]/page.tsx` を本実装する
- Supabase 接続を追加する際は `store/gameStore.ts` のアクションをそのまま差し替え可能な設計になっている
- `npm run typecheck` スクリプトを `package.json` に追加することを検討
