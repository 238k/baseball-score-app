# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: パッケージインストール

- [x] `@serwist/next` をインストール
  - [x] `npm install @serwist/next serwist`

## フェーズ2: Serwist 設定

- [x] `tsconfig.json` を更新
  - [x] `lib` に `"webworker"` を追加
  - [x] `types` に `"@serwist/next/typings"` を追加
  - [x] `exclude` に `"public/sw.js"` を追加
- [x] `next.config.ts` を `withSerwistInit` でラップ
  - [x] `swSrc: "app/sw.ts"`, `swDest: "public/sw.js"` を設定
  - [x] `additionalPrecacheEntries` に `/~offline` を追加
- [x] `app/sw.ts` を作成（Service Worker エントリポイント）
  - [x] `defaultCache`, `Serwist`, 型定義のインポート
  - [x] `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`
  - [x] `fallbacks` に `/~offline` を設定

## フェーズ3: PWA アセット

- [x] `public/manifest.json` を作成
  - [x] `name: "野球スコアブック"`
  - [x] `short_name: "スコアブック"`
  - [x] `display: "standalone"`
  - [x] `background_color: "#ffffff"`, `theme_color: "#18181b"`
  - [x] `start_url: "/"`
  - [x] `icons` (192x192, 512x512) を設定
- [x] `public/icons/` にアイコン用プレースホルダーSVGを作成
  - [x] `icon-192.svg`（baseball emoji ベースの SVG）
  - [x] `icon-512.svg`

## フェーズ4: レイアウト更新

- [x] `app/serwist.ts` を作成（SerwistProvider の re-export）
- [x] `app/~offline/page.tsx` を作成（オフラインフォールバックページ）
  - [x] シンプルな「オフラインです」メッセージ
  - [x] 再試行ボタン
- [x] `app/layout.tsx` を更新
  - [x] PWA metadata を追加（applicationName, appleWebApp, themeColor）
  - [x] `<link rel="manifest">` を追加
  - [x] `SerwistProvider` でラップ（`swUrl="/sw.js"`）

## フェーズ5: Supabase 自動同期

- [x] `hooks/useOnlineSync.ts` を作成
  - [x] `isOnline` state（`navigator.onLine` 初期値）
  - [x] `online` / `offline` イベントリスナーを登録
  - [x] オンライン復帰時に全 games を `syncToSupabase` でアップロード
  - [x] `isOnline` を返す
- [x] `components/game-setup/GameSetupForm.tsx` を更新
  - [x] `createGame` 後に `syncToSupabase(game.id)` を呼び出す（catch でエラー無視）
- [x] `components/dev/QuickStartButton.tsx` を更新
  - [x] `createGame` 後に `syncToSupabase(game.id)` を呼び出す（catch でエラー無視）
- [x] `components/score-input/ScoreInputPage.tsx` を更新
  - [x] マウント時の `useEffect` で `syncToSupabase(gameId)` を呼び出す（認証済み時のみ）

## フェーズ6: オフラインインジケーター

- [x] `components/score-input/ScoreInputPage.tsx` を更新
  - [x] `useOnlineSync` を呼び出して `isOnline` を取得
  - [x] `isOnline === false` のとき、ヘッダー下に「オフラインで動作中 · 入力はローカルに保存されます」バナーを表示

## フェーズ7: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test` → 92 passed
- [x] リントエラーがないことを確認
  - [x] `npm run lint` → エラーなし
- [x] 型エラーがないことを確認
  - [x] `npm run type-check` → エラーなし（app/sw.ts を tsconfig exclude に追加）

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `tsconfig.json` に `"lib": ["webworker"]` を追加しようとしたが、DOM 型と競合して全体の型チェックが壊れた。`app/sw.ts` 自体が `/// <reference lib="webworker" />` を持っているため、メインの tsconfig には不要。代わりに `app/sw.ts` を `exclude` に追加して解決。
- `tsconfig.json` に `"types": ["@serwist/next/typings"]` を追加したことで TypeScript が標準 `@types/*` を無視し、全 DOM 型が消えた。`types` フィールドは削除し、`window.serwist` の型は `@serwist/next/typings` が自動的に挿入されることを確認。
- `public/sw.js`（Serwist のビルド成果物）が ESLint の対象になり lint エラーが発生。`eslint.config.mjs` の `globalIgnores` に `public/sw.js` を追加して対処。
- validator 指摘により `useOnlineSync.ts` の `setIsOnline` を `useEffect` 内で同期呼び出しするのが lint エラーになることが判明。`useState` の lazy initializer で `navigator.onLine` を初期値として渡す方式に変更。
- validator 指摘により `GameSetupForm` / `QuickStartButton` の `syncToSupabase` 呼び出しに `if (user)` ガードを追加し、設計書の「非認証時スキップ」方針を徹底。
- validator 指摘により `useOnlineSync` の依存配列から `games` と `syncToSupabase` を除去し、`useGameStore.getState()` で最新状態を取得するよう変更。

**新たに必要になったタスク**:
- `eslint.config.mjs` への `public/sw.js` 除外設定（計画外）
- バリデーター指摘の3点修正

### 学んだこと

**技術的な学び**:
- `/// <reference no-default-lib="true" />` を含む `.ts` ファイルをメインの `tsconfig.json` の `include` 対象にすると、TypeScript コンパイラ全体のデフォルトライブラリが無効化される。Service Worker ファイルは必ず `exclude` するか、専用の `tsconfig.sw.json` を使う。
- Serwist の `swDest: "public/sw.js"` は開発時にも `public/sw.js` を生成する。この成果物は lint と tsconfig の `exclude` 両方に追加が必要。
- `useState` の lazy initializer（`useState(() => ...)` の形式）は `useEffect` 内の同期 `setState` を回避できる正しいパターン。初回レンダリング時に一度だけ実行され、SSR と Client の差異も安全に吸収できる。
- Zustand ストアの `getState()` を `useEffect` クロージャ内で使うと、`games` 配列を依存配列から除外しつつ常に最新状態を取得できる。`useCallback` での memoization より簡潔。

### 次回への改善提案
- `useOnlineSync` のユニットテストを追加する（`online`/`offline` イベント発火 → `syncToSupabase` 呼び出し → `user` ガードの動作確認）
- 将来的に plate_appearances / pitches の Supabase 同期を実装する際は、`syncToSupabase` の対象テーブルをマイグレーションと合わせて拡張する
- PWA インストールプロンプト UI（`SerwistProvider` の `onNeedRefresh` コールバック）で新しい SW の更新をユーザーに通知することを検討
