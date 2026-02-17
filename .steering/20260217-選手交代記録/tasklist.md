# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: gameStore の拡張

- [x] `gameStore.ts` に `getCurrentBatter` ヘルパーを追加
  - [x] 同 gameId + side + battingOrder で cycle 最大の Lineup を返す
- [x] `gameStore.ts` に `substitutePlayer` アクションを追加
  - [x] SubstituteOptions 型を定義する
  - [x] 代打・代走・投手交代: 新 Lineup を cycle+1 で追加
  - [x] 守備交代: 既存 Lineup の position を更新

## フェーズ2: SubstitutionPanel コンポーネントの実装

- [x] `components/score-input/SubstitutionPanel.tsx` を作成
  - [x] モーダルの開閉制御（isOpen / onClose）
  - [x] 交代種別セレクタ（代打/代走/守備交代/投手交代）
  - [x] 打順セレクタ（1〜9、現在の選手名を隣に表示）
  - [x] 選手名入力フィールド
  - [x] 守備位置セレクタ（FieldingPosition 1〜10）
  - [x] バリデーション（選手名必須、守備位置必須）
  - [x] 確定ボタン（`substitutePlayer` を呼んで onClose）
  - [x] キャンセルボタン（onClose のみ）

## フェーズ3: ScoreInputPage への統合

- [x] `ScoreInputPage.tsx` を変更
  - [x] SubstitutionPanel を import
  - [x] `isSubstitutionOpen` state を追加
  - [x] pitching フェーズ時のみ「交代」ボタンを表示
  - [x] 攻撃ラインナップ計算を cycle 最大ベースに修正（`getCurrentBatter` 利用）

## フェーズ4: テスト追加

- [x] `gameStore.test.ts` に substitutePlayer のテストを追加
  - [x] 代打: cycle+1 の新エントリが追加されること
  - [x] 守備交代: 既存エントリの position が更新されること
  - [x] 2回目の交代: cycle が正しく 3 になること
  - [x] `getCurrentBatter` が最新 cycle を返すこと

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test` → 33 passed
- [x] リントエラーがないことを確認
  - [x] `npm run lint` → エラーなし
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck` → エラーなし

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `canSubmit` のロジックが当初の設計より複雑になった。守備交代時は `currentPlayer !== undefined && position !== ''` が正しい条件だったが、初回実装では欠陥があり validator 指摘後に修正
- `substitutePlayer` の守備交代ロジックで map 内に maxCycle 計算を入れてしまい、validator 指摘後に外出しに修正
- `app/page.test.tsx` が `QuickStartButton` の `useRouter` で落ちることが発覚。`next/navigation` をモックして対応（本タスクとは無関係の修正だが同時対応）

**新たに必要になったタスク**:
- アクセシビリティ対応: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` を追加（validator 推奨を受け即対応）

### 学んだこと

**技術的な学び**:
- `canSubmit` など複合条件のバリデーションは、型ごとにガード条件を分けて書くと意図が明確になる
- Zustand で `map` 内に計算を埋め込まず、事前計算して渡すパターンが読みやすくかつ効率的
- `useMemo` の依存配列に Zustand のストア関数を含める場合、`eslint-disable` より意図をコメントで説明する方が望ましい

**プロセス上の改善点**:
- implementation-validator の実行が効果的だった。特に `canSubmit` の欠陥と二重ループの発見はレビューなしでは気付きにくかった

### 次回への改善提案
- `SubstituteOptions` 型を `types/game.ts` に移動（現状は `store/gameStore.ts` 内に定義）
- `SubstitutionPanel` のコンポーネントテストを追加（代走・守備交代の UI 変化確認、substitutePlayer 呼び出し検証）
- `docs/functional-design.md` の `lineupStore` と `SubstituteOptions.newCycle` の記述を実装実態に合わせて更新
