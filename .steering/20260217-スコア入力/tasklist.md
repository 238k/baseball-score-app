# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: 型定義

- [x] `types/score.ts` を作成する
  - [x] `PitchType` type を定義（ball/strike_swinging/strike_looking/foul/in_play/hbp）
  - [x] `PlateResult` type を定義（全14種）
  - [x] `Pitch` interface を定義
  - [x] `PlateAppearance` interface を定義
  - [x] `ScorePhase` type を定義（pitching/result/inning_end）
  - [x] `ScoreSnapshot` interface を定義（Undo用）

## フェーズ2: Zustand scoreStore 実装

- [x] `store/scoreStore.ts` を作成する
  - [x] 状態の定義（gameId, currentInning, currentTopBottom, currentBatterIndex, outs, runnersOnBase, pitches, plateAppearances, undoStack）
  - [x] `initGame(gameId)` アクションを実装
  - [x] `recordPitch(type)` アクションを実装
    - [x] スナップショット保存
    - [x] pitches[] に追加
    - [x] 3ストライク（Fを除く）で三振自動確定
    - [x] 4ボールで四球自動確定
    - [x] インプレー/死球でフェーズを 'result' に変更
  - [x] `recordResult(result)` アクションを実装
    - [x] PlateAppearance を作成して配列に追加
    - [x] アウト結果でアウトカウントを +1
    - [x] outs === 3 で phase を 'inning_end' に変更
    - [x] 次打者へ移行（currentBatterIndex, pitches リセット）
  - [x] `advanceInning()` アクションを実装
    - [x] イニングカウンター更新（裏→次のイニングの表）
    - [x] outs・pitches・runnersOnBase をリセット
  - [x] `undo()` アクションを実装
    - [x] undoStack の末尾を取り出して状態を復元

- [x] `store/scoreStore.test.ts` を作成する
  - [x] `recordPitch`: ボール4球で四球自動確定をテスト
  - [x] `recordPitch`: 3ストライクで三振自動確定をテスト
  - [x] `recordPitch`: インプレーでフェーズが 'result' になるをテスト
  - [x] `recordResult`: アウトカウント増加をテスト
  - [x] `recordResult`: 3アウトで 'inning_end' になるをテスト
  - [x] `recordResult`: 次打者移行をテスト
  - [x] `undo`: 直前のスナップショットに戻るをテスト
  - [x] `advanceInning`: イニング・アウト・走者リセットをテスト

## フェーズ3: UIコンポーネント実装

- [x] `components/score-input/GameHeader.tsx` を作成する
  - [x] イニング表示（例: `1回表`）
  - [x] アウトカウント表示（●○○ 形式）
  - [x] 走者インジケーター（一・二・三塁の文字ハイライト）

- [x] `components/score-input/CurrentBatterInfo.tsx` を作成する
  - [x] 打者名・打順番号の表示
  - [x] カウント表示（ボール数・ストライク数・ファウル数）

- [x] `components/score-input/PitchInputPanel.tsx` を作成する
  - [x] B/S振/S見/F/インプレー/死球 の6ボタン
  - [x] 最小高さ64px のタッチフレンドリーボタン
  - [x] 各ボタンを色分け（ボール=緑、ストライク=赤、ファウル=オレンジ、他）

- [x] `components/score-input/ResultInputPanel.tsx` を作成する
  - [x] 安打4種（単打・二塁打・三塁打・本塁打）
  - [x] アウト5種（ゴロ・フライ・ライナー・三振振り・三振見）
  - [x] 出塁2種（四球・死球）
  - [x] その他5種（野選・エラー・併殺打・犠打・犠飛）
  - [x] カテゴリ別にグループ表示

- [x] `components/score-input/ScoreLog.tsx` を作成する
  - [x] 確定済み打席を打順・結果テキストで一覧表示
  - [x] 最大20打席まで表示

- [x] `components/score-input/ScoreInputPage.tsx` を作成する
  - [x] useGameStore で試合・ラインナップ取得
  - [x] useScoreStore でスコア状態取得
  - [x] initGame を useEffect で呼び出し
  - [x] フェーズに応じた表示切り替え（pitching/result/inning_end）
  - [x] Undo ボタン
  - [x] 3アウト時の「攻守交代」ボタン

## フェーズ4: ページ更新

- [x] `app/games/[id]/page.tsx` を本実装に更新する
  - [x] params から gameId を取得
  - [x] `<ScoreInputPage gameId={gameId} />` を描画

## フェーズ5: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`（`<a>` → `<Link>` 修正、未使用変数除去）
- [x] 型エラーがないことを確認
  - [x] `npm run type-check`

## フェーズ6: ドキュメント更新・振り返り

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `PlateResult` 型から `'振り逃げ'` が初期実装で欠落（バリデーターで検出し修正済み）
- `handlePitch`/`handleResult` が通常関数で実装されたが、バリデーター指摘により `useCallback` に変更
- `useEffect` 内に `if (!game) return` ガードが不足していた（修正済み）
- `ResultInputPanel.tsx` の「その他」グループに `'振り逃げ'` を追加（計画外）

**新たに必要になったタスク**:
- `'振り逃げ'` の `types/score.ts` と `ResultInputPanel.tsx` への追加

### 学んだこと

**技術的な学び**:
- Next.js 15 の Dynamic Route では `params` が `Promise<{ id: string }>` 型になるため `await` が必要
- Zustand Store の直接アクセス（`useScoreStore.getState()`）は `renderHook` なしでもテスト可能
- `useEffect` 内で `!game` のガードを忘れると、存在しない gameId で Store が初期化されてしまう

**プロセス上の改善点**:
- `PlateResult` のような列挙型は、仕様書と実装を並べてダブルチェックしてから実装する

### 次回への改善提案
- `'振り逃げ'` の出塁/アウト判定はルール上複雑（捕逸か否かで変わる）。将来的には `ResultExtras` に詳細区分を持たせる設計を検討する
- 死球自動確定・併殺打2アウト・`undoStack` 上限・`advanceInning` 後の `undo` に対するテストカバレッジを次回追加する
- `PlateAppearance` 型は MVP 簡略版のためコメントで明示済み。Supabase 統合時は `inningId(FK)`・`sequenceInInning` への変更が必要
