# 要求内容

## 概要

打者・投手の成績をリアルタイム自動計算し、`/games/[id]/stats` で表示する。既存の `plateAppearances` データから純粋関数で成績値を導出する。

## 背景

機能1〜5が完成し、打席結果の記録ができる。しかし成績の集計が手動計算に頼っており、試合中のリアルタイム分析ができない。スコアラーが打席入力と同時に最新の成績を確認できる仕組みが必要。

## 実装対象の機能

### 1. 打者成績計算ライブラリ（lib/stats/battingStats.ts）

各打者の `plateAppearances` を集計して成績を計算する純粋関数群。

**計算項目:**
- 打席 (PA), 打数 (AB), 安打 (H), 二塁打 (2B), 三塁打 (3B), 本塁打 (HR)
- 打率 (AVG = H/AB)
- 四球 (BB), 死球 (HBP), 三振 (SO = K+Kc), 犠打 (SAC), 犠飛 (SF), 併殺打 (DP)
- 出塁率 (OBP = (H+BB+HBP)/(AB+BB+HBP+SF))
- 長打率 (SLG = (1B+2×2B+3×3B+4×HR)/AB)
- OPS = OBP + SLG
- 平均投球数/打席 (P/PA = 総投球数/PA)

**スコープ外（今フェーズでは省略）:**
- 打点 (RBI): 走者進塁追跡データが未実装
- 得点 (R): 走者進塁追跡データが未実装
- 盗塁/盗塁死: BaseEvent 未実装

### 2. 投手成績計算ライブラリ（lib/stats/pitchingStats.ts）

相手チームの打席を使い、投手ごとの成績を計算する純粋関数群。

**計算項目:**
- 被打席 (BFP), 投球数 (P = 総投球数)
- 被安打 (H), 奪三振 (SO), 与四球 (BB), 与死球 (HBP)
- 被打率 (OPP AVG = H/AB)
- 投球回 (IP): `enteredInning` から在籍イニングを計算
- WHIP = (H+BB+HBP) / IP
- K/9 = SO × 9 / IP
- BB/9 = BB × 9 / IP
- K/BB = SO / BB

**スコープ外（今フェーズでは省略）:**
- 失点 (R), 自責点 (ER), ERA: 走者進塁追跡データが未実装

### 3. 成績型定義（lib/stats/statsTypes.ts）

`BattingStats` / `PitchingStats` インターフェース。

### 4. 打者成績テーブル（components/stats/BattingStatsTable.tsx）

打者成績を一覧表示するテーブルコンポーネント。

### 5. 投手成績テーブル（components/stats/PitchingStatsTable.tsx）

投手成績を一覧表示するテーブルコンポーネント。

### 6. 成績集計ページ（app/games/[id]/stats/page.tsx）

両チームの打者・投手成績を表示するページ。

### 7. スコア入力画面から成績ページへのリンク追加

`ScoreInputPage` のヘッダー近辺に成績ページへのリンクを追加。

## 受け入れ条件

- [ ] `lib/stats/battingStats.ts` が打席配列から打者成績を計算できる
- [ ] `lib/stats/pitchingStats.ts` が打席配列・ラインナップから投手成績を計算できる
- [ ] `/games/[id]/stats` にアクセスすると成績一覧が表示される
- [ ] 成績は `plateAppearances` の現在値から即時計算される（Zustand store を読む）
- [ ] スコア入力画面から成績ページへのリンクがある

## 参照ドキュメント

- `docs/product-requirements.md` - 機能6「リアルタイム成績集計」
- `docs/functional-design.md` - lib/stats/ の設計、components/stats/
