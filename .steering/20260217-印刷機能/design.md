# 設計書: 印刷機能

## アーキテクチャ方針

既存コンポーネント（ScoreSheet, BattingStatsTable, PitchingStatsTable）を再利用し、印刷専用のラッパーコンポーネントで包む。

## ファイル構成

```
app/games/[id]/print/
└── page.tsx              # Server Component シェル（params → PrintView）

components/print/
└── PrintView.tsx         # Client Component（印刷レイアウト本体）
```

## 変更ファイル

- `components/score-input/GameHeader.tsx` — 「印刷」リンクを追加

## PrintView コンポーネント設計

```
PrintView
├── 画面専用ヘッダー（print:hidden）
│   ├── ← 記録に戻る リンク
│   └── 印刷ボタン（window.print() 呼び出し）
├── 試合情報見出し（teams, date, venue）
├── ビジター スコアシート（ScoreSheet）
├── ホーム スコアシート（ScoreSheet）
├── 打者成績（BattingStatsTable × 2）
└── 投手成績（PitchingStatsTable × 2）
```

## 印刷 CSS 戦略

Tailwind CSS の `print:` バリアントと `@media print` を使う。

| 課題 | 解決策 |
|------|--------|
| スコアシートの横スクロール | ラッパーに `print:overflow-x-visible` + `<style>` タグで `@media print { overflow: visible }` |
| ボタン・ナビの非表示 | `print:hidden` クラス |
| スティッキーポジション | `@media print` で `position: static` に上書き |
| A4 収まり | `@page { size: A4 landscape; margin: 1cm; }` を `<style>` タグで挿入 |

## データ取得

stats/page.tsx と同じパターンで Zustand ストアから読み込む：
- `useGameStore()` → `getGame`, `lineups`, `getCurrentBatter`
- `useScoreStore()` → `plateAppearances`, `currentInning`
- `computeAllBattingStats`, `computeAllPitchingStats` を呼び出す

## ナビゲーション

- GameHeader の「成績」リンク横に「印刷」リンクを追加する
- `/games/${gameId}/print` へのリンク
