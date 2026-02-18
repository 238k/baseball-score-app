# タスクリスト: 野球ルール修正

## フェーズ1: ファウルのストライクカウント表示修正

- [x] `GameStatusPanel.tsx` の `countStrikes` 関数をファウル対応に修正

## フェーズ2: 選手交代後のラインナップ表示修正

- [x] `ScoreSheet.tsx` の `attackingLineup` prop 型を `Lineup[][]` に変更
- [x] `ScoreSheet.tsx` の選手列レンダリングを複数選手対応に変更
- [x] `ScoreInputPage.tsx` の `attackingLineup` 構築ロジックを全サイクル対応に変更
- [x] `ScoreInputPage.tsx` の `viewingLineup` 構築ロジックを全サイクル対応に変更

## フェーズ3: 型整合性確認

- [x] TypeScript 型エラーがないことを確認（typecheck）

---

## 実装後の振り返り

**実装完了日**: 2026-02-18

**変更ファイル**:
- `components/score-input/GameStatusPanel.tsx`: `countStrikes` をファウル対応に修正
- `components/scorebook/ScoreSheet.tsx`: `attackingLineup` 型を `Lineup[][]` に変更、選手列を複数選手対応に変更
- `components/score-input/ScoreInputPage.tsx`: `attackingLineup`/`viewingLineup` 構築ロジックを全サイクル対応に変更
- `components/print/PrintView.tsx`: 同様に全サイクル対応に変更

**計画と実績の差分**:
- `PrintView.tsx` が `ScoreSheet` の型変更の影響を受けることが計画時に未記載だったが、問題なく対応
- `currentBatterLineup` は `getCurrentBatter` を直接使う方式に変更（`attackingLineup[currentBatterIndex]` 方式では `Lineup[][]` に変更後にアクセスが複雑になるため）

**学んだこと**:
- コンポーネントの prop 型を変更する際は、全利用箇所（PrintView 等）の洗い出しが必要
- ファウルのストライクカウントロジック: `scoreStore.ts` の三振自動確定は正しく動作していたが、BSO ドット表示のみ修正が必要だった

**テスト結果**: lint・type-check・unit tests（103件）すべて通過
