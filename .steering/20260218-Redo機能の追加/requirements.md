# 要件定義: Redo機能の追加

## 背景

現在は `scoreStore` に `undoStack` を持ち `undo()` で直前の操作を取り消すことができる。
Undo した操作を Redo（やり直し）できるようにしたい。

## 機能要件

1. **Redo スタック**: `redoStack: ScoreSnapshot[]` を `ScoreState` に追加
2. **Undo 連携**: `undo()` 実行時に現在の状態を `redoStack` にプッシュ
3. **Redo アクション**: `redo()` を新規追加し、`redoStack` から状態を復元して `undoStack` に積む
4. **Redo クリア**: 新しい操作（`recordPitch` / `recordResult` / `confirmRunners` / `advanceInning`）実行時に `redoStack` をクリア
5. **UI**: Undo ボタンの隣に Redo ボタンを追加
6. **キーボードショートカット**: Cmd+Shift+Z（Mac）/ Ctrl+Y（Windows）

## 受入条件

- Undo 後に Redo ボタンが有効になる
- Redo で Undo した操作が正確に復元される
- 新しい操作を行うと Redo スタックがクリアされる（Undo→新操作→Redo不可）
- スコア・走者・イニングが正しく復元される

## 影響範囲

- `store/scoreStore.ts`: `redoStack` 追加・`undo`/`redo` アクション修正
- `components/score-input/ScoreInputPage.tsx`: Redo ボタン追加・キーボードショートカット
- `store/scoreStore.test.ts`: Redo のテスト追加
