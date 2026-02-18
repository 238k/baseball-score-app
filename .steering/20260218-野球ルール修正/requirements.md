# 要件: 野球ルール修正（ファウルのストライクカウント・選手交代後のラインナップ表示）

## 概要

Issue #19 に基づき、野球のルールに沿った2つの修正を行う。

---

## 修正1: ファウルのストライクカウント表示

### 現状の問題

`GameStatusPanel.tsx` のBSOドット表示において、ファウルボールがストライクカウントに反映されていない。

- 現在の `countStrikes` はスイング三振（`strike_swinging`）と見逃し三振（`strike_looking`）のみをカウント
- ファウル（`foul`）は全く無視されている

### ルール

- ファウルはストライクカウントを1つ増やす
- ただし、**2ストライクのときはファウルでストライクは増えない**

### 修正方針

`GameStatusPanel.tsx` の `countStrikes` 関数をファウル対応に変更する。

```
非ファウルストライク数 = strike_swinging + strike_looking の数
ファウル数 = foul の数
有効ストライク数 = min(非ファウルストライク数 + ファウル数, 2)
  ただし 非ファウルストライク数 >= 2 の場合は 2
```

**注意**: `scoreStore.ts` の `recordPitch` における三振自動確定ロジック（`strikes >= 3 && type !== 'foul'`）はすでに正しく動作しており、変更不要。表示のみの修正。

---

## 修正2: 選手交代後のラインナップ表示

### 現状の問題

選手交代後、スコアシートの左側ラインナップ列から交代前の選手が消えてしまう。

- `ScoreInputPage.tsx` の `attackingLineup` は `getCurrentBatter`（最新サイクルの選手のみ）で構築
- 交代前の選手は見えなくなる

### ルール（要件）

選手交代後も、変更前の選手をラインナップ列に表示したままにする。

### 修正方針

- `ScoreInputPage.tsx` のラインナップ構築ロジックを変更し、各打順に対して全サイクルの選手を配列として渡す
- `ScoreSheet.tsx` の `attackingLineup` prop 型を `(Lineup | null)[]`（9要素）から `Lineup[][]`（各打順の全選手リスト、サイクル昇順）に変更
- スコアシートの選手列に交代前の選手を上側（灰色・小フォント）で表示し、現在の選手を下側（通常スタイル）で表示

---

## 影響ファイル

- `components/score-input/GameStatusPanel.tsx`
- `components/score-input/ScoreInputPage.tsx`
- `components/scorebook/ScoreSheet.tsx`
