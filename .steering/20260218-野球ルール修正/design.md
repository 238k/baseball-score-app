# 設計: 野球ルール修正

## 修正1: GameStatusPanel.tsx のファウル対応

### 変更箇所

`components/score-input/GameStatusPanel.tsx` の `countStrikes` 関数

### 変更内容

```ts
// Before
function countStrikes(pitches: Pitch[]): number {
  return pitches.filter(
    (p) => p.type === 'strike_swinging' || p.type === 'strike_looking',
  ).length;
}

// After
function countStrikes(pitches: Pitch[]): number {
  const nonFoulStrikes = pitches.filter(
    (p) => p.type === 'strike_swinging' || p.type === 'strike_looking',
  ).length;
  if (nonFoulStrikes >= 2) return 2;
  const fouls = pitches.filter((p) => p.type === 'foul').length;
  return Math.min(nonFoulStrikes + fouls, 2);
}
```

ポイント:
- 非ファウルストライクが2以上の場合は即 `2` を返す（ファウルでカウントが増えない）
- 非ファウルストライクが2未満の場合、ファウルを加算して最大2に制限
- レンダリング側の `Math.min(countStrikes(pitches), 2)` は既に存在するが、関数内でも上限を保証

---

## 修正2: ラインナップ表示（選手交代対応）

### 型変更

`ScoreSheet.tsx` の `attackingLineup` prop:

```ts
// Before
attackingLineup: (Lineup | null)[];  // 9要素、各打順の現在の選手

// After
attackingLineup: Lineup[][];  // 9要素、各打順の全選手（サイクル昇順）
// 空の場合は []（未登録打順）
```

### ScoreInputPage.tsx の変更

```tsx
// Before
const attackingLineup = useMemo(() => {
  return Array.from({ length: 9 }, (_, i) => {
    return getCurrentBatter(gameId, attackingSide, i + 1) ?? null;
  });
}, [...]);

// After
const attackingLineup = useMemo(() => {
  return Array.from({ length: 9 }, (_, i) => {
    const battingOrder = i + 1;
    return gameLineups
      .filter((l) => l.side === attackingSide && l.battingOrder === battingOrder)
      .sort((a, b) => a.cycle - b.cycle);
  });
}, [...]);
```

`viewingLineup` も同様に変更。

`currentBatterLineup` は `getCurrentBatter` を直接使う（変更なし）。

### ScoreSheet.tsx の変更

**選手列（左固定）:**

各打順に対して `players: Lineup[]` を受け取り、複数選手を表示:
- 交代前の選手（players[0] ～ players[n-2]）: 小フォント・灰色・上部に表示
- 現在の選手（players[players.length - 1]）: 通常スタイル・下部に表示
- 選手未登録（players.length === 0）: `打者N` を表示

行全体の高さは `h-20` を維持（複数選手は小フォントで収める）。

**スコア格子（イニング列）:**

`attackingLineup.map((_, orderIdx) => ...)` のままでOK（9打順 × Nイニング）。
型変更により `(_, orderIdx)` の `_` が `Lineup[]` になるが、使っていないので影響なし。

---

## 変更しないもの

- `scoreStore.ts` の `countStrikes`・`recordPitch` ロジック（三振自動確定は正しく動作中）
- `ScoreCell.tsx`
- `CurrentBatterInfo.tsx`
- `GameStatusPanel.tsx` のランナーダイヤモンド・スコアボード部分
