# 設計: 満塁四球・死球の得点計算修正

## 修正箇所

`store/scoreStore.ts` の `recordPitch` 内、四球・死球の2ブロック

## 修正方針

`applyForceAdvances` 呼び出し前に満塁判定を行い、満塁なら `scoringRuns = 1` として
攻撃チームのスコアに加算する。`confirmRunners` と同様のパターンを使用する。

```ts
const isBasesFull =
  state.runnersOnBase[1] !== null &&
  state.runnersOnBase[2] !== null &&
  state.runnersOnBase[3] !== null;
const scoringRuns = isBasesFull ? 1 : 0;

const newHomeScore = state.currentTopBottom === 'bottom'
  ? state.homeScore + scoringRuns
  : state.homeScore;
const newAwayScore = state.currentTopBottom === 'top'
  ? state.awayScore + scoringRuns
  : state.awayScore;
```

## テスト

`store/scoreStore.test.ts` に以下のケースを追加:
- 満塁四球で awayScore/homeScore が +1 される
- 満塁死球で awayScore/homeScore が +1 される
- 満塁でない四球・死球ではスコアが変わらない
