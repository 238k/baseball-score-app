# 設計書: 走者進塁・アウト記録

## 全体フロー変更

### Before（現在）

```
recordPitch(四球/死球) → pitching フェーズ（runnersOnBase変更なし）
recordPitch(in_play) → result フェーズ
recordResult(any) → pitching or inning_end（runnersOnBase変更なし）
```

### After（今回）

```
recordPitch(四球/死球) → pitching フェーズ + フォースアドバンス適用（runnersOnBase更新）
recordPitch(in_play) → result フェーズ（変更なし）
recordResult(打者アウト, 走者なし) → pitching or inning_end（スキップ）
recordResult(打者出塁 or 走者あり) → runner_advance フェーズ
confirmRunners(移動先Map) → pitching or inning_end（runnersOnBase更新）
```

---

## 型定義変更 (`types/score.ts`)

### ScorePhase に `'runner_advance'` を追加

```typescript
export type ScorePhase =
  | 'pitching'
  | 'result'
  | 'runner_advance'  // 追加: 打席結果後、走者移動入力待ち
  | 'inning_end';
```

### RunnerDestination 型を追加

```typescript
// 走者の移動先（4=得点、'out'=アウト）
export type RunnerDestination = 1 | 2 | 3 | 4 | 'out';
```

### ScoreSnapshot にフィールド追加

```typescript
export interface ScoreSnapshot {
  // ... 既存フィールド ...
  pendingBatterLineupId: string | null;
  pendingBatterDestination: 1 | 2 | 3 | 4 | null;
}
```

---

## scoreStore 変更 (`store/scoreStore.ts`)

### ScoreState にフィールド追加

```typescript
pendingBatterLineupId: string | null;       // runner_advance中の打者ID
pendingBatterDestination: 1|2|3|4|null;    // null=アウト
```

### 新ヘルパー関数

#### `getBatterDestination(result: PlateResult): 1|2|3|4|null`

| 結果 | 返り値 |
|-----|--------|
| 単打・野選・エラー・振り逃げ・四球・死球 | 1 |
| 二塁打 | 2 |
| 三塁打 | 3 |
| 本塁打 | 4 |
| それ以外（アウト系） | null |

#### `applyForceAdvances(runners, batterLineupId): Record<1|2|3, string|null>`

フォースアドバンスロジック（四球・死球時）:
1. 1塁が空 → 打者だけ1塁。2塁・3塁は変わらず
2. 1塁のみ占有 → 1塁走者→2塁、打者→1塁。3塁は変わらず
3. 1・2塁占有 → 2塁走者→3塁、1塁走者→2塁、打者→1塁
4. 満塁 → 3塁走者得点（塁から除去）、2塁→3塁、1塁→2塁、打者→1塁

#### `needsRunnerAdvance(state, batterDest): boolean`

runner_advanceフェーズが必要か判定:
- `batterDest !== null` → true（打者が出塁）
- `state.runnersOnBase[1] !== null || [2] !== null || [3] !== null` → true（走者あり）
- 上記いずれでもなく、かつ `newOuts >= 3` ではない → false

### `recordResult` の変更

```
既存のアウト計算はそのまま
↓
getBatterDestination(result) で batterDest を計算
↓
if (newOuts >= 3): 既存通り inning_end
elif (needsRunnerAdvance): runner_advance フェーズへ
   - pendingBatterLineupId = batterLineupId
   - pendingBatterDestination = batterDest
   - currentBatterIndex は変えない（confirmRunnersで変える）
else: 既存通り pitching フェーズへ（currentBatterIndex++）
```

### 新アクション: `confirmRunners`

```typescript
confirmRunners: (destinations: Record<string, RunnerDestination>) => void;
// destinations: { [lineupId]: 1|2|3|4|'out' }
```

処理:
1. スナップショット保存（Undo用）
2. 新runners構築:
   - 打者: pendingBatterDestination が 1|2|3 なら対応する塁に配置
   - 各走者: destinations に基づいて配置（4または'out'は塁から除去）
3. `runnersOnBase = newRunners`
4. `currentBatterIndex = (current + 1) % 9`
5. `phase = outs >= 3 ? 'inning_end' : 'pitching'`
6. `pitches = []`
7. `pendingBatterLineupId = null`, `pendingBatterDestination = null`

---

## UIコンポーネント (`RunnerAdvancePanel.tsx`)

### Props

```typescript
interface RunnerInfo {
  lineupId: string;
  name: string;    // 表示名（ラインナップ未登録時は「1塁走者」等のfallback）
  fromBase: 1 | 2 | 3;
}

interface RunnerAdvancePanelProps {
  runners: RunnerInfo[];           // 打席前の塁上走者リスト
  batterName: string;              // 打者名
  batterDest: 1|2|3|4|null;       // null=打者アウト
  onConfirm: (destinations: Record<string, RunnerDestination>) => void;
}
```

### UI レイアウト

```
走者の進塁を確認してください
--------------------------------
打者: 田中 → 1塁（固定表示）

1塁走者: 鈴木
  [ 1塁 ]  [ 2塁 ]  [ 3塁 ]  [ 得点 ]  [ アウト ]
             ^^^選択中^^^

2塁走者: 佐藤
  [ 1塁 ]  [ 2塁 ]  [ 3塁 ]  [ 得点 ]  [ アウト ]
                              ^^^選択中^^^

[確定する]
```

### バリデーション

- 同じ塁に2人の走者は選択不可（選択済みの塁は他の走者のボタンを無効化）
- 打者の到達塁と重複する選択肢は無効化
- 全走者の選択が完了するまで「確定」ボタンは無効

---

## ScoreInputPage への統合

`phase === 'runner_advance'` 時に `RunnerAdvancePanel` を表示:
- ラインナップから走者名を解決するヘルパー関数を追加
- `handleConfirmRunners` コールバックを追加

---

## テスト追加 (`store/scoreStore.test.ts`)

1. 四球→フォースアドバンス（1塁走者あり）
2. 四球→フォースアドバンス（満塁）
3. 死球→フォースアドバンス（1塁走者あり）
4. 安打（走者なし）→runner_advanceフェーズへ遷移
5. 安打（走者あり）→runner_advanceフェーズへ遷移
6. アウト（走者なし）→runner_advanceスキップ
7. `confirmRunners`→runnersOnBase更新
8. `confirmRunners`→次打者移行
9. `undo` from runner_advance フェーズ
