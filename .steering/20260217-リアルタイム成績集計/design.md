# 設計書

## アーキテクチャ概要

```
scoreStore.plateAppearances
         │
         ▼
lib/stats/battingStats.ts  ──► BattingStats[]
lib/stats/pitchingStats.ts ──► PitchingStats[]
         │
         ▼
app/games/[id]/stats/page.tsx
 ├── BattingStatsTable (away)
 ├── PitchingStatsTable (home)
 ├── BattingStatsTable (home)
 └── PitchingStatsTable (away)
```

純粋関数で成績を計算するため、テストが容易でパフォーマンスが安定する。

## データ構造

### BattingStats

```typescript
interface BattingStats {
  lineupId: string;
  playerName: string;
  battingOrder: number;
  pa: number;   // 打席
  ab: number;   // 打数
  h: number;    // 安打
  double: number; // 二塁打
  triple: number; // 三塁打
  hr: number;   // 本塁打
  bb: number;   // 四球
  hbp: number;  // 死球
  so: number;   // 三振
  sac: number;  // 犠打
  sf: number;   // 犠飛
  dp: number;   // 併殺打
  pitchesTotal: number; // 総投球数
  avg: number | null;   // 打率
  obp: number | null;   // 出塁率
  slg: number | null;   // 長打率
  ops: number | null;   // OPS
  ppa: number | null;   // 平均投球数/打席
}
```

### PitchingStats

```typescript
interface PitchingStats {
  lineupId: string;
  playerName: string;
  bfp: number;   // 被打席
  pitches: number; // 投球数
  ip: number;    // 投球回（小数: 1/3=0.333...）
  ipDisplay: string; // 投球回表示（例: "5 1/3"）
  h: number;     // 被安打
  so: number;    // 奪三振
  bb: number;    // 与四球
  hbp: number;   // 与死球
  oppAvg: number | null; // 被打率
  whip: number | null;   // WHIP
  k9: number | null;     // K/9
  bb9: number | null;    // BB/9
  kbb: number | null;    // K/BB
}
```

## 実装方針

### battingStats.ts

- `computeBattingStats(pas: PlateAppearance[], lineup: Lineup): BattingStats`
- 単一選手の全打席から成績を計算
- `computeAllBattingStats(pas: PlateAppearance[], lineups: Lineup[], side: 'home'|'away', topBottom: 'top'|'bottom'): BattingStats[]`
- サイドに対応するチームの全打者成績を計算

### pitchingStats.ts

- 投手の特定方法: `lineups` から `position === 1` のエントリを取得
  - 先発投手: `isStarter === true && position === 1`
  - 中継ぎ: `isStarter === false && position === 1 && substitutionType === '投手交代'`
- 各投手が担当したイニング: `enteredInning` 〜 次の投手の `enteredInning - 1`（または現在のイニング）
- 担当イニング内の相手打席を集計

### 投球回（IP）計算

```
投手A: inning 1〜3 (enteredInning=1, 次の投手enteredInning=4)
       → 3回完投 = 3.0

投手B: inning 4〜5 の途中で交代
       → アウト数で計算: そのイニングのアウト数 / 3 を加算
```

**簡略化**: 現在データモデルにアウト数の投手帰属がないため、イニング単位の投球回を使用:
- `投球回 = 担当したイニング数`（端数は省略）

## コンポーネント設計

### BattingStatsTable.tsx

- props: `stats: BattingStats[]`
- 横スクロール可能なテーブル
- 打順順に並べる
- 数値は右揃え、名前は左揃え

### PitchingStatsTable.tsx

- props: `stats: PitchingStats[]`
- 登板順（enteredInning順）に並べる

### /games/[id]/stats/page.tsx

- `useScoreStore()` から `plateAppearances`, `currentInning`, `currentTopBottom`
- `useGameStore()` から `lineups`, `game`
- クライアントコンポーネント（リアルタイム更新のため）
- Away / Home の2チーム分を表示
- スコア入力ページに戻るリンク

## テスト戦略

- `battingStats.test.ts`: 各成績計算の単体テスト
  - 打率計算（打数0でnull）
  - OPS計算
  - 犠打・犠飛の打数除外
- `pitchingStats.test.ts`: 投手成績の単体テスト
  - 投球回計算
  - WHIP計算

## ディレクトリ構造

```
lib/stats/
├── statsTypes.ts         (新規)
├── battingStats.ts       (新規)
└── pitchingStats.ts      (新規)
components/stats/
├── BattingStatsTable.tsx  (新規)
└── PitchingStatsTable.tsx (新規)
app/games/[id]/stats/
└── page.tsx               (新規)
```
