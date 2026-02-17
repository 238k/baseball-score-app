# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: Diamond コンポーネント

- [x] `components/scorebook/Diamond.tsx` を作成
  - [x] SVG viewBox="0 0 40 40" でダイヤモンド形状を描画
  - [x] ホーム(20,36)、一塁(36,20)、二塁(20,4)、三塁(4,20) の4頂点でベースパスを描画
  - [x] `reachedBase` プロパティに応じて走塁経路を色付きで描画
  - [x] `isOut: true` の場合は×印を中央に表示
  - [x] `size` プロパティでSVGサイズ変更可能

## フェーズ2: ScoreCell コンポーネント

- [x] `components/scorebook/ScoreCell.tsx` を作成
  - [x] 80×80px のセルサイズ（タブレット対応）
  - [x] `PlateResult → reachedBase` 変換ユーティリティを実装
  - [x] `PlateResult → 短縮ラベル` 変換ユーティリティを実装
    - [x] 単打=H, 二塁打=2B, 三塁打=3B, 本塁打=HR
    - [x] 三振振り=K, 三振見=Kc, 四球=BB, 死球=HBP
    - [x] ゴロ=G, フライ=F, ライナー=L
    - [x] 犠打=S, 犠飛=SF, 野選=FC, エラー=E, 併殺打=DP, 振り逃げ=KS
  - [x] セル中央にDiamondを配置
  - [x] 打席結果ラベルをセル左下に表示
  - [x] 投球数をセル右下に表示
  - [x] `isCurrent: true` のとき青系ハイライト背景
  - [x] `plateAppearance: null` のとき（未打席）は空白セル

## フェーズ3: ScoreSheet コンポーネント

- [x] `components/scorebook/ScoreSheet.tsx` を作成
  - [x] 打順（行）×イニング（列）のグリッドを構築
  - [x] 左端固定列（`sticky left-0`）: 打順番号・選手名・守備位置
  - [x] 横スクロール可能なイニング列エリア
  - [x] `plateAppearances` から各打順・イニングのセルに打席データを割り当て
  - [x] 表示イニング数: max(現在イニング数, 9) で動的に列を生成
  - [x] `useEffect` + `ref` で現在イニング列を自動スクロール

## フェーズ4: GameHeader の塁上走者表示改善

- [x] `components/score-input/GameHeader.tsx` を改修
  - [x] ~~既存の塁上走者表示をミニダイヤモンド形式に変更~~（既に rotate-45 + amber/zinc のダイヤモンド形式で実装済み。追加変更不要）
  - [x] 占有塁はオレンジ色の塗りつぶし、空塁はグレーのアウトライン（既に amber-400/zinc-500 で実装済み）

## フェーズ5: ScoreInputPage への統合

- [x] `components/score-input/ScoreInputPage.tsx` を変更
  - [x] ScoreSheet を import
  - [x] GameHeader の下・入力パネルの上に攻撃チームの ScoreSheet を追加
  - [x] ScoreSheet に必要な props を渡す（gameId, side, plateAppearances, attackingLineup, etc.）
  - [x] ScoreSheet エリアは最大高さを制限し、overflow-y-auto でスクロール可能にする

## フェーズ6: テスト追加

- [x] `components/scorebook/Diamond.test.tsx` を作成
  - [x] reachedBase=1 のとき、ホーム→一塁パスが描画される
  - [x] reachedBase=4 のとき、全ベースのパスが描画される
  - [x] isOut=true のとき、×印が表示される
- [x] `components/scorebook/ScoreCell.test.tsx` を作成
  - [x] PlateResult='本塁打' → reachedBase=4, ラベル='HR'
  - [x] PlateResult='三振振り' → isOut=true, ラベル='K'
  - [x] plateAppearance=null のとき空のセルが表示される

## フェーズ7: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test` → 62 passed
- [x] リントエラーがないことを確認
  - [x] `npm run lint` → エラーなし
- [x] 型エラーがないことを確認
  - [x] `npm run type-check` → エラーなし（Diamond.tsx の型ガードを修正）

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `ScoreSheet.tsx` の `paMap` キーを当初 `currentTopBottom` で構築したが、各打席が自身の `topBottom` を持つためサイドベースのフィルタリングが必要だった。`sideTopBottom` を計算して `pa.topBottom !== sideTopBottom` でフィルタする方式に変更
- Diamond の×印 `stroke` を `<g>` 親要素に置いていたため `querySelectorAll('line[stroke="..."]')` テストが失敗。各 `<line>` に直接 stroke 属性を付与するよう修正
- `isPositiveBase` 型ガードを追加して `as` 型アサーションを排除（validator 推奨）

**新たに必要になったタスク**:
- `isOutResult` の重複ロジック排除（`OUT_RESULTS` 定数の再利用）—validator 指摘後に即対応
- `isPositiveBase` 型ガード関数の追加—`Diamond.tsx` の型安全性向上

### 学んだこと

**技術的な学び**:
- SVG の `<g>` 要素に設定した属性は CSS セレクタで子要素から検索できない。テストで属性を検証する場合は各要素に直接付与するか、クラス名で検索する方が確実
- `reachedBase > 0` はランタイムでは正しく動作するが TypeScript は型を絞り込めない。`b is 1 | 2 | 3 | 4` の型ガード関数で型安全性と可読性を両立できる
- `plateAppearances` のインデックス化（`paMap`）は表示側のサイド（home/away）でフィルタリングする必要がある。特に両チームの打席が混在した配列を受け取る設計では側の特定が重要

**プロセス上の改善点**:
- implementation-validator の実行が効果的だった。特に `isOutResult` の重複ロジックと型アサーション問題は事前のコードレビューなしでは見落としやすい
- `ScoreSheet.tsx` のテストは今回未追加（時間制約ではなく設計上の理由: ScoreSheet は状態管理との統合テストが必要でセットアップが複雑）。次フェーズで対応推奨

### 次回への改善提案
- `ScoreCell.tsx` の変換ユーティリティ（`getReachedBase`・`getResultLabel`）を `lib/scorebook/` に分離し、将来の成績計算機能（機能6）から再利用できるようにする
- `ScoreSheet.tsx` の `paMap` フィルタリングロジックのユニットテストを追加する
- `functional-design.md` の `ScoreCell` Props 定義（`onClick` の有無）を現実装に合わせて更新する
