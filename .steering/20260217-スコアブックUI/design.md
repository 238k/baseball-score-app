# 設計書

## アーキテクチャ概要

新規に `components/scorebook/` ディレクトリを作成し、NPB準拠のスコアブックUIコンポーネント群を実装する。既存の `ScoreInputPage.tsx` にスコアシートを統合する。

```
ScoreInputPage
├── GameHeader (既存)
├── ScoreSheet (新規)
│   ├── [左固定列] 打順・選手名・守備位置
│   └── [横スクロール] イニング列
│       └── ScoreCell × (打席数)
│           └── Diamond (SVG)
└── [入力パネル群] (既存)
```

## コンポーネント設計

### 1. Diamond.tsx

**責務**:
- SVGで菱形ベースパスを描画する
- `reachedBase` プロパティで走塁経路（0→1, 0→2, 0→3, 0→4の区間）を色付きで描画
- アウト時は×印を表示

**実装の要点**:
- SVG viewBox="0 0 40 40" で正方形に収める
- ダイヤモンドの4頂点: ホーム(20,36)、一塁(36,20)、二塁(20,4)、三塁(4,20)
- 走塁経路は `<polyline>` または複数の `<line>` で描画
- 色分け: 通常進塁=青、アウト=赤
- Props: `reachedBase: 0 | 1 | 2 | 3 | 4 | null`, `isOut: boolean`

```typescript
interface DiamondProps {
  reachedBase: 0 | 1 | 2 | 3 | 4 | null; // null=空打席
  isOut: boolean;
  size?: number; // SVGサイズ (default: 40)
}
```

### 2. ScoreCell.tsx

**責務**:
- 1打席分の情報表示（ダイヤモンド + 結果 + 投球数）
- 現在打席中のハイライト
- 未到達（まだ打席が来ていない）の表示

**実装の要点**:
- セルサイズ: 80×80px (tablet-friendly)
- 打席結果から `reachedBase` を計算するユーティリティ関数を含む
- 結果ラベル（短縮形）: 単打=H, 二塁打=2B, 三塁打=3B, 本塁打=HR, 三振=K, 四球=BB, etc.
- Props:
  - `plateAppearance: PlateAppearance | null` (nullなら空セル)
  - `isCurrent: boolean` (現在の打者)
  - `isCurrentInning: boolean` (現在のイニング)

```typescript
interface ScoreCellProps {
  plateAppearance: PlateAppearance | null;
  isCurrent: boolean;
  isCurrentInning: boolean;
}
```

### 3. ScoreSheet.tsx

**責務**:
- 打順×イニングのグリッド全体を管理
- 左端固定: 打順番号・選手名・守備位置
- 右側横スクロール: イニング列のScoreCell配列
- 現在イニングへの自動スクロール

**実装の要点**:
- グリッド構造: CSS `display: grid` または `display: flex`
- 左固定列: `sticky left-0` で固定
- 横スクロール: `overflow-x-auto` on スクロールコンテナ
- 最低表示イニング数: 9イニング分（延長は自動追加）
- `useEffect` + `scrollIntoView` で現在イニングを自動スクロール

```typescript
interface ScoreSheetProps {
  gameId: string;
  side: 'home' | 'away';
  plateAppearances: PlateAppearance[];
  attackingLineup: (Lineup | null)[]; // 9人分（cycle最大）
  currentInning: number;
  currentTopBottom: 'top' | 'bottom';
  currentBatterIndex: number;
  runnersOnBase: Record<1 | 2 | 3, string | null>;
}
```

### 4. BaseRunnerIndicator.tsx

**責務**:
- 現在の塁上走者状況（一・二・三塁）をミニダイヤモンドで表示
- 占有塁はオレンジ、空塁はグレーで表示

**実装の要点**:
- GameHeaderの一部として配置
- 既存の `GameHeader.tsx` に統合するか、独立コンポーネントとして追加

## データフロー

### スコアシート表示
```
1. ScoreStore から plateAppearances, currentInning, currentBatterIndex 取得
2. GameStore から lineups (attackingLineup) 取得
3. ScoreSheet が打順×イニングのマトリクスを構築
4. 各セルに対応するPlateAppearanceがあれば表示
5. 現在の打者セルをハイライト
```

### ダイヤモンド走塁経路の推定
```
PlateResult → reachedBase の変換:
- 単打/四球/死球/野選/エラー/振り逃げ → 1
- 二塁打 → 2
- 三塁打 → 3
- 本塁打 → 4
- ゴロ/フライ/ライナー/三振/犠打/犠飛/併殺打 → 0 (アウト)
```

## テスト戦略

### ユニットテスト
- `Diamond.tsx`: reachedBase に応じた SVG パスの正確な描画
- `ScoreCell.tsx`: PlateResult から正しいラベルと reachedBase が算出される
- `ScoreSheet.tsx`: plateAppearances が正しい打順×イニングに配置される

## 依存ライブラリ

新しいライブラリは不要（Tailwind CSS + SVG のみで実装）

## ディレクトリ構造

```
components/
└── scorebook/
    ├── Diamond.tsx           (新規)
    ├── ScoreCell.tsx         (新規)
    ├── BaseRunnerIndicator.tsx (新規、GameHeaderに統合)
    └── ScoreSheet.tsx        (新規)
```

## 実装の順序

1. `Diamond.tsx` - SVGダイヤモンド（走塁経路描画）
2. `ScoreCell.tsx` - 打席セル（Diamond使用）
3. `ScoreSheet.tsx` - スコアシートグリッド（ScoreCell使用）
4. `GameHeader.tsx` の塁上走者表示改善（BaseRunnerIndicator統合）
5. `ScoreInputPage.tsx` にScoreSheetを統合
6. テスト追加
7. 品質チェック

## パフォーマンス考慮事項

- 打席データの多い場合（9回×9人=81打席以上）でも描画が重くならないよう `useMemo` を活用
- ScoreSheet の各行はメモ化して不要な再描画を防ぐ
