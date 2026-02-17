# 設計: 試合記録画面レイアウト修正

## 新レイアウト

```
h-screen overflow-hidden flex
├── 左ペイン（スコアシート）  flex-1 min-w-0 overflow-x-auto overflow-y-hidden
│   └── ScoreSheet（全体表示、h-full）
└── 右ペイン  w-80 flex-shrink-0 flex flex-col border-l border-zinc-200
    ├── 右上: GameStatusPanel（試合状況）
    │   - 回・表裏 / 両チーム点数
    │   - BSO（ボール・ストライク・アウト）
    │   - ランナー位置（ダイヤモンド）
    │   ※ 成績・印刷リンクは削除
    └── 右下: 操作UI（flex-1 overflow-y-auto）
        - CurrentBatterInfo
        - 入力パネル（PitchInput/ResultInput/RunnerAdvance）
        - Undoボタン
        - ScoreLog
```

## Phase 1: 点数トラッキング追加

- `ScoreState` に `homeScore: number`, `awayScore: number` を追加
- `ScoreSnapshot` にも `homeScore`, `awayScore` を追加
- `confirmRunners` で destination が `4` の走者/打者をカウントして得点加算
  - `currentTopBottom === 'top'` → `awayScore` に加算
  - `currentTopBottom === 'bottom'` → `homeScore` に加算
- `advanceInning` では得点は保持（走者のみリセット）
- `undo` でスナップショットから得点も復元

## Phase 2: PlateAppearance に投球記録を追加

- `types/score.ts` の `PlateAppearance` 型に `pitches: Pitch[]` フィールドを追加
- `confirmPlateAppearance` 関数で `state.pitches` を含めるよう修正

## Phase 3: GameStatusPanel 新規作成

- ファイル: `components/score-input/GameStatusPanel.tsx`
- Props:
  - `gameId: string`
  - `inning: number`
  - `topBottom: 'top' | 'bottom'`
  - `outs: number`
  - `runnersOnBase: Record<1|2|3, string|null>`
  - `homeTeamName: string`
  - `awayTeamName: string`
  - `homeScore: number`
  - `awayScore: number`
  - `pitches: Pitch[]` （BSO計算用）
- 表示: イニング、スコアボード、BSO、ダイヤモンド
- 成績・印刷リンクなし

## Phase 4: ScoreCell に投球記録表示

- `ScoreCellProps` に `pitches?: Pitch[]` を追加
- セルの左側に投球シーケンスを縦表示
- 投球記号マッピング:
  - `ball` → `B`
  - `strike_swinging` → `K`
  - `strike_looking` → `C`
  - `foul` → `F`
  - `in_play` → `P`
  - `hbp` → `H`
- セル幅調整: `w-20` → `w-28`

## Phase 5: ScoreInputPage レイアウト変更

- `min-h-screen flex flex-col` → `h-screen overflow-hidden flex`
- 左右2ペイン構成
- GameHeader を廃止し GameStatusPanel を使用
- ScoreSheet の高さ制限を撤廃
