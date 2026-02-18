# 要件: BSOカウント表示の重複解消

## 概要

右パネルに BSO カウントが2箇所表示されており、画面スペースを無駄に使っている。

- `GameStatusPanel`（右上・暗背景）: B/S/O をドット表示
- `CurrentBatterInfo`（操作UI上部）: `B: 2 S: 1 F: 1 3球` のテキスト表示

## 採用方針: 案A（GameStatusPanel に統一）

`GameStatusPanel` の BSO ドット表示はそのまま維持し、`CurrentBatterInfo` のカウント表示（B/S/F）を削除する。
ファウル数（F）は不要。

理由:
- ドット表示の方が直感的で視認性が高い
- `CurrentBatterInfo` は打者名・打順の表示に専念させる

## 変更内容

- `GameStatusPanel`: BSO ドット表示・`pitches` prop を維持（変更なし）
- `CurrentBatterInfo`: B/S/F カウント表示と `pitches` prop を削除。打者名・打順のみ表示。
- `ScoreInputPage`: `CurrentBatterInfo` への `pitches` prop を削除

## 影響範囲

- `components/score-input/GameStatusPanel.tsx`
- `components/score-input/ScoreInputPage.tsx`
