# 設計書: 試合記録UI改善

## 方針

既存の画面構造は維持し、コンポーネント内部の実装改善で段階的に品質を上げる。  
外部 API は変更せず、入力処理・ARIA・スタイルに限定して修正する。

## 変更対象

- `components/game-setup/LineupSection.tsx`
- `components/game-setup/GameSetupForm.tsx`
- `components/score-input/GameHeader.tsx`
- `components/score-input/SubstitutionPanel.tsx`
- `components/score-input/ScoreLog.tsx`
- `components/game/GameCard.tsx`
- `app/globals.css`
- `components/game-setup/LineupSection.test.tsx`（新規）

## 実装詳細

### 1. LineupSection の入力安全性とラベル

- `select` の `onChange` で `e.target.value === '' ? '' : Number(...)` とし、空選択を `''` で保持
- `LineupRowItem` に `side` を渡し、行番号を含む `id` と `aria-label` を付与
- 列ヘッダーに `id` を付け、入力欄に `aria-describedby` を付与

### 2. GameHeader の状態要約

- `outs` と `runnersOnBase` から日本語要約を生成
- 画面表示を変えず `sr-only` で読み上げ情報を提供
- 成績/印刷リンクにタップ領域を追加し、フォーカスリングを明示

### 3. SubstitutionPanel のキーボード対応

- パネルルートに `ref` を付与し、開いた時に先頭フォーカス可能要素へフォーカス
- `keydown` で Escape 閉じ、Tab/Shift+Tab のフォーカストラップを実装
- 既存のクリックオーバーレイ閉じは維持

### 4. 視覚整理

- `body` の `font-family` を `var(--font-geist-sans), sans-serif` に変更
- `ScoreLog` と `GameCard` の低コントラスト文字色を調整
- 小型リンクの `min-h-[44px]` と `inline-flex` を適用

### 5. テスト

- `LineupSection.test.tsx` を追加し、以下を検証:
  - 守備位置未選択時に `onChange` が `''` を返す
  - 位置選択時に数値を返す
  - 入力欄に `aria-label` が付与される
