# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: ルートページ作成

- [x] `app/games/[id]/print/page.tsx` を作成
  - [x] Server Component として `params` から `id` を取得
  - [x] `PrintView` コンポーネントを呼び出す

## フェーズ2: PrintView コンポーネント実装

- [x] `components/print/PrintView.tsx` を作成
  - [x] `useGameStore`, `useScoreStore` からデータ取得
  - [x] `getCurrentBatter` で両チームのラインナップを構築
  - [x] `computeAllBattingStats`, `computeAllPitchingStats` で成績計算
  - [x] 試合情報ヘッダー（チーム名・日付・球場）を表示
  - [x] `ScoreSheet` でビジター・ホームのスコアシートを表示
  - [x] `BattingStatsTable`, `PitchingStatsTable` で成績テーブルを表示
  - [x] 画面専用ヘッダー（「戻る」リンク・「印刷」ボタン）を `print:hidden` で表示
  - [x] `<style>` タグで `@media print` CSS（A4横、overflow修正、sticky修正）を挿入

## フェーズ3: ナビゲーション更新

- [x] `components/score-input/GameHeader.tsx` を更新
  - [x] 「成績」リンク横に「印刷」リンクを追加（`/games/${gameId}/print`）

## フェーズ4: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test` → 92 passed
- [x] リントエラーがないことを確認
  - [x] `npm run lint` → エラーなし
- [x] 型エラーがないことを確認
  - [x] `npm run type-check` → エラーなし

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画通り実装できた点**:
- `app/games/[id]/print/page.tsx` を Server Component として作成
- `components/print/PrintView.tsx` に既存の `ScoreSheet`, `BattingStatsTable`, `PitchingStatsTable` を再利用
- `GameHeader.tsx` に「印刷」リンクを追加

**validator 指摘による修正**:
- 成績テーブルの各 `<section>` に `className="bg-white"` を追加（`stats/page.tsx` との一貫性確保）

**計画と異なった点はなし**。

### 学んだこと

**技術的な学び**:
- `ScoreSheet` のハイライト無効化は `currentTopBottom` を `attackingSide` の期待値と逆の値に設定することで `isAttacking = false` になり、ハイライト・カレントイニング強調を一括無効化できる。
- 印刷時の横スクロール問題は `@media print { .custom-class { overflow: visible !important; } }` で解決できる。`overflow-x-auto` は Tailwind のユーティリティクラスなので印刷CSS で直接上書きするより、カスタムクラス（`print-no-overflow`）を使う方が安全。
- テーブルの `sticky` 列は印刷時に `position: static !important` で上書きすることで正しく印刷できる。
- Next.js クライアントコンポーネントに `<style>` タグを直接埋め込む方法は機能するが、将来的には専用 `layout.tsx` か `globals.css` への `@media print` ブロック追加が推奨。

### 次回への改善提案
- `PrintView.tsx` のユニットテスト追加（`ScoreSheet` の `currentTopBottom` プロパティ検証）
- `@page` サイズ設定のプロパティ化（B5・縦向き対応の将来的拡張）
- `app/games/[id]/print/layout.tsx` での印刷スタイル一元管理
