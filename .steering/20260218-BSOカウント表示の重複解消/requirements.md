# 要件: BSOカウント表示の重複解消

## 概要

右パネルに BSO カウントが2箇所表示されており、画面スペースを無駄に使っている。

- `GameStatusPanel`（右上・暗背景）: B/S/O をドット表示
- `CurrentBatterInfo`（操作UI上部）: `B: 2 S: 1 F: 1 3球` のテキスト表示

## 採用方針: 案B（CurrentBatterInfo に統一）

`GameStatusPanel` の BSO ドット表示を廃止し、`CurrentBatterInfo` に統一する。

理由:
- `CurrentBatterInfo` はファウル数(F)・総球数も表示しており情報量が多い
- `GameStatusPanel` は試合全体状況（イニング・スコア・ランナー）に専念させる

## 変更内容

- `GameStatusPanel`: BSO ドット表示セクションを削除。`pitches` prop も不要になるため削除。
- `CurrentBatterInfo`: 変更なし（現状のまま）
- `ScoreInputPage`: `GameStatusPanel` への `pitches` prop を削除

## 影響範囲

- `components/score-input/GameStatusPanel.tsx`
- `components/score-input/ScoreInputPage.tsx`
