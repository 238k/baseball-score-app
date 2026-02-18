# タスクリスト: BSOカウント表示の重複解消

## Phase 1: GameStatusPanel.tsx の修正

- [x] `pitches` prop と関連インポートを削除
- [x] `countBalls` / `countStrikes` 内部関数を削除
- [x] BSO ドット表示のうち B・S セクションを削除（O のみ残す）
- [x] ランナーダイヤモンド周りのレイアウトを調整

## Phase 2: ScoreInputPage.tsx の修正

- [x] `GameStatusPanel` への `pitches={pitches}` prop を削除

## 実装後の振り返り

**実装完了日**: 2026-02-18

**計画と実績の差分**:
- 計画通り案Bで実装。変更はシンプルで2ファイルのみ

**学んだこと**:
- `GameStatusPanel` が `pitches` を持っていた理由（BSO ドット表示のため）が明確だったため、削除後に `liveSummary` の sr-only テキストも問題なく整理された
- `pitches` prop を削除してもコンポーネントの `liveSummary` が `outs` だけで意味をなすかを確認することが重要

**テスト**: 全103テスト通過。lint・型チェックともにエラーなし。

**次回への改善提案**:
- `GameStatusPanel` と `CurrentBatterInfo` に対するコンポーネントテストを追加すると回帰防止になる
