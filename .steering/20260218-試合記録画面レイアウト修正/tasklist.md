# タスクリスト: 試合記録画面レイアウト修正

## Phase 1: 点数トラッキング追加

- [x] `types/score.ts`: `ScoreSnapshot` に `homeScore`, `awayScore` を追加
- [x] `store/scoreStore.ts`: `ScoreState` に `homeScore`, `awayScore` を追加
- [x] `store/scoreStore.ts`: `initGame` で `homeScore: 0, awayScore: 0` を初期化
- [x] `store/scoreStore.ts`: `snapshot()` に `homeScore`, `awayScore` を含める
- [x] `store/scoreStore.ts`: `confirmRunners` で destination=4 の走者を得点計算に含める
- [x] `store/scoreStore.ts`: `undo` で `homeScore`, `awayScore` をスナップショットから復元

## Phase 2: PlateAppearance に投球記録追加

- [x] `types/score.ts`: `PlateAppearance` に `pitches: Pitch[]` を追加
- [x] `store/scoreStore.ts`: `confirmPlateAppearance` で `state.pitches` を `PlateAppearance` に含める

## Phase 3: GameStatusPanel 新規作成

- [x] `components/score-input/GameStatusPanel.tsx` を新規作成
  - イニング表示
  - スコアボード（アウェイ X - Y ホーム）
  - BSO カウント（pitches から計算）
  - ランナーダイヤモンド

## Phase 4: ScoreCell に投球記録表示

- [x] `components/scorebook/ScoreCell.tsx`: `PlateAppearance.pitches` から投球シーケンスを取得
- [x] `components/scorebook/ScoreCell.tsx`: 投球シーケンスを左側に縦表示
- [x] `components/scorebook/ScoreCell.tsx`: セル幅を `w-20` → `w-28` に変更
- [x] `components/scorebook/ScoreSheet.tsx`: `ScoreCell` は `PlateAppearance.pitches` を参照するため変更不要
- [x] `components/scorebook/ScoreSheet.tsx`: イニングヘッダー幅を `w-20` → `w-28` に変更

## Phase 5: ScoreInputPage レイアウト変更

- [x] `components/score-input/ScoreInputPage.tsx`: `homeScore`, `awayScore` を scoreStore から取得
- [x] `components/score-input/ScoreInputPage.tsx`: レイアウトを左右2ペイン構成に変更
- [x] `components/score-input/ScoreInputPage.tsx`: GameHeader を廃止し GameStatusPanel に置換
- [x] `components/score-input/ScoreInputPage.tsx`: ScoreSheet の高さ制限を撤廃（h-full）
- [x] `components/score-input/ScoreInputPage.tsx`: 右ペインに操作UIを配置（overflow-y-auto）

## 実装後の振り返り

**実装完了日**: 2026-02-18

**計画と実績の差分**:
- `ScoreCellProps` に `pitches?: Pitch[]` を追加する計画だったが、`PlateAppearance.pitches` から直接参照する方式に変更（Props 追加不要）
- `ScoreSheet` から `ScoreCell` に pitches を渡す手間が不要になった（PlateAppearance に含まれるため）

**学んだこと**:
- `PlateAppearance` に `pitches` を埋め込む設計にすると、ScoreSheet → ScoreCell の Props 伝搬が不要になりシンプルになる
- `confirmRunners` の得点計算: 打者の destination も含めて得点計算する必要があった（本塁打 = 打者自身も destination=4）

**変更ファイル一覧**:
- `types/score.ts`: `PlateAppearance.pitches`, `ScoreSnapshot.homeScore/awayScore` 追加
- `store/scoreStore.ts`: `homeScore/awayScore` 追加、得点計算、undo対応
- `components/score-input/GameStatusPanel.tsx`: 新規作成（BSO・スコア・ダイヤモンド）
- `components/score-input/ScoreInputPage.tsx`: 左右2ペインレイアウトに全面変更
- `components/scorebook/ScoreCell.tsx`: 投球記録を左側に表示、セル幅 w-28 に変更
- `components/scorebook/ScoreSheet.tsx`: イニングヘッダー幅 w-28 に変更
- テストファイル3件: `pitches: []` フィールド追加
