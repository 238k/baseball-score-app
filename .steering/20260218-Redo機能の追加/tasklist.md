# タスクリスト: Redo機能の追加

## Phase 1: scoreStore 更新

- [x] `store/scoreStore.ts`: `ScoreState` に `redoStack: ScoreSnapshot[]` と `redo: () => void` を追加
- [x] `store/scoreStore.ts`: 初期状態と `initGame` に `redoStack: []` を追加
- [x] `store/scoreStore.ts`: `undo()` を修正し、現在のスナップショットを `redoStack` に積む
- [x] `store/scoreStore.ts`: `redo()` アクションを新規追加
- [x] `store/scoreStore.ts`: `recordPitch` で `redoStack: []` をクリア
- [x] `store/scoreStore.ts`: `recordResult` で `redoStack: []` をクリア
- [x] `store/scoreStore.ts`: `confirmRunners` で `redoStack: []` をクリア
- [x] `store/scoreStore.ts`: `advanceInning` で `redoStack: []` をクリア

## Phase 2: UI 更新

- [x] `components/score-input/ScoreInputPage.tsx`: `redo` と `redoStack` を `useScoreStore()` からデストラクチャ
- [x] `components/score-input/ScoreInputPage.tsx`: Undo/Redo ボタンを横並びに変更
- [x] `components/score-input/ScoreInputPage.tsx`: キーボードショートカット（Cmd+Shift+Z / Ctrl+Y）を `useEffect` で追加

## Phase 3: テスト追加

- [x] `store/scoreStore.test.ts`: `redo()` の基本動作テスト（undo 後に redo で状態が復元される）
- [x] `store/scoreStore.test.ts`: `redoStack` が空のときは何もしないテスト
- [x] `store/scoreStore.test.ts`: 新しい操作後に `redoStack` がクリアされるテスト

## 実装後の振り返り

**実装完了日**: 2026-02-18

**計画と実績の差分**:
- `replace_all` で `undoStack` を含む全 `set()` に `redoStack: []` を追加しようとしたが、インデント幅が異なる3箇所（`recordPitch` フォールスルーパス・`confirmRunners`・`advanceInning`）が漏れた。implementation-validator の指摘で修正
- Undo キーボードショートカット（Cmd+Z）も追加した（当初計画外だが対称性のため追加）
- `resetStore()` ヘルパーに `redoStack: []` を追加し、`partialize` コメントも更新

**学んだこと**:
- `replace_all` によるパターン置換は、同一パターンでもインデントが違うと漏れることがある。Grep で残りを確認してから `replace_all` を使うか、個別置換するべき
- `undo()` と `redo()` は対称的な実装（`undoStack` ↔ `redoStack`）になっていることが重要。現在状態のスナップショットを取ってから相手スタックに積み、取り出した状態を復元する
- 操作前に `redoStack` をクリアするのは「新しい分岐の操作」を行ったとき。undo/redo 自体はクリアしない

**テスト**: 全103テスト通過。lint・型チェックともにエラーなし。

**次回への改善提案**:
- `confirmRunners` 後・`advanceInning` 後の `redoStack` クリアに対応するテストを追加する
- 連続 Redo（複数ステップ）のテストを追加する
