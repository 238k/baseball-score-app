# タスクリスト: 走者進塁・アウト記録

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: 型定義更新 (`types/score.ts`)

- [x] `ScorePhase` に `'runner_advance'` を追加する
- [x] `RunnerDestination` 型を追加する（`1 | 2 | 3 | 4 | 'out'`）
- [x] `ScoreSnapshot` に `pendingBatterLineupId` と `pendingBatterDestination` フィールドを追加する

## フェーズ2: scoreStore 更新 (`store/scoreStore.ts`)

- [x] `ScoreState` に `pendingBatterLineupId` と `pendingBatterDestination` を追加する
- [x] `getBatterDestination(result)` ヘルパー関数を実装する
- [x] `applyForceAdvances(runners, batterLineupId)` ヘルパー関数を実装する
- [x] `snapshot()` 関数に新フィールドを追加する
- [x] `initGame()` に新フィールドのリセットを追加する
- [x] `recordPitch` の四球・死球処理に `applyForceAdvances` を適用する
- [x] `recordResult` を更新する
  - [x] `getBatterDestination` で打者の到達塁を計算する
  - [x] 3アウト時は既存通り `inning_end`
  - [x] 走者あり or 打者出塁時は `'runner_advance'` フェーズへ
  - [x] 走者なし + 打者アウト時は既存通り `'pitching'` フェーズへ
- [x] `confirmRunners(destinations: Record<string, RunnerDestination>)` アクションを追加する
  - [x] スナップショット保存
  - [x] 新しい `runnersOnBase` を構築する
  - [x] 打者の到達塁を `runnersOnBase` に反映する
  - [x] 各走者の移動先を `runnersOnBase` に反映する
  - [x] `currentBatterIndex` を進める
  - [x] `phase` を次フェーズに設定する
  - [x] `pendingBatterLineupId`, `pendingBatterDestination` をリセットする
- [x] `undo()` に新フィールドの復元を追加する

## フェーズ3: UIコンポーネント実装

- [x] `components/score-input/RunnerAdvancePanel.tsx` を新規作成する
  - [x] `RunnerInfo` + `RunnerAdvancePanelProps` インターフェースを定義する
  - [x] 各走者の移動先選択ボタン（1塁/2塁/3塁/得点/アウト）を実装する
  - [x] 打者の到達塁を固定表示する
  - [x] 同一塁への重複選択を防ぐバリデーションを実装する
  - [x] 全走者選択完了まで「確定」ボタンを無効化する
  - [x] 「確定する」ボタンで `onConfirm` を呼び出す
- [x] `components/score-input/ScoreInputPage.tsx` を更新する
  - [x] `runner_advance` フェーズ時に `RunnerAdvancePanel` を表示する
  - [x] ラインナップから走者名を解決するヘルパーを追加する
  - [x] `handleConfirmRunners` コールバックを追加する

## フェーズ4: テスト追加 (`store/scoreStore.test.ts`)

- [x] 四球後のフォースアドバンス（1塁走者あり）テスト
- [x] 四球後のフォースアドバンス（満塁）テスト
- [x] 死球後のフォースアドバンス（1塁走者あり）テスト
- [x] 安打後に `runner_advance` フェーズへ遷移するテスト
- [x] アウト（走者なし）で `runner_advance` をスキップするテスト
- [x] `confirmRunners` が `runnersOnBase` を正しく更新するテスト
- [x] `confirmRunners` 後に次打者へ移行するテスト
- [x] `runner_advance` からのUndoテスト

## フェーズ5: 品質チェック

- [x] `npm test` が通ること（26テスト全パス）
- [x] `npm run lint` が通ること（useMemo追加でwarning解消）
- [x] `npm run type-check` が通ること

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分
- `OUT_RESULTS` に `野選`・`エラー` を誤って含めていた（NPBルール違反）。実装バリデーターが指摘し、修正済み。
- `confirmRunners` でアウトになった走者のアウトカウント加算を実装漏れ。`additionalOuts` の集計ロジックを追加して修正。
- `RunnerInfo` を `RunnerAdvancePanel.tsx` 内で定義していたが、`types/score.ts` に移動した（再利用性向上）。
- `occupiedBases` の `useMemo` を最初の実装で省略していたが、バリデーターの指摘で追加。

### 学んだこと
- NPBルールの正確な理解が重要: 野選・エラーは出塁結果であり、アウトではない。`OUT_RESULTS` の定義は野球ルールに基づいて慎重に設計する必要がある。
- Zustand の `pendingXxx` パターンが効果的: フェーズをまたいで状態を引き継ぐ場合、`pending` プレフィックスで一時状態を明示すると可読性が高い。
- `ScoreSnapshot` に `pending` フィールドを含めることで Undo が完全に機能する。

### 次回への改善提案
- 得点数（イニング別スコア）のカウントを追加する。`confirmRunners` でデスティネーション `4` になった走者を得点として記録する。
- 犠飛（sac fly）は走者なしでも選択できる結果だが、得点との関係を明示するUIが必要かもしれない。
- `RunnerAdvancePanel` の走者選択UIに「そのまま（進塁なし）」オプションが現時点ではない。けん制アウトや盗塁失敗との組み合わせで必要になる可能性がある。
