# 設計書

## アーキテクチャ概要

既存の gameStore（試合・ラインナップ）に加え、scoreStore（スコア入力状態・Undo）を新設する。

```
types/
└── score.ts                          # 型定義（新規: PlateAppearance, Pitch, PlateResult等）

store/
├── gameStore.ts                      # 既存（変更なし）
└── scoreStore.ts                     # 新規: スコア入力状態・Undo

app/games/[id]/
└── page.tsx                          # 既存プレースホルダーを本実装に置換

components/score-input/
├── ScoreInputPage.tsx                # スコア入力画面全体（Client Component）
├── GameHeader.tsx                    # 試合ヘッダー（イニング・アウト・走者）
├── CurrentBatterInfo.tsx             # 現在打者・カウント表示
├── PitchInputPanel.tsx               # 投球入力ボタン群
├── ResultInputPanel.tsx              # 打席結果入力ボタン群
└── ScoreLog.tsx                      # 打席ログ一覧（テキスト表示）
```

## コンポーネント設計

### 1. `store/scoreStore.ts`

**状態**:
```typescript
interface ScoreState {
  gameId: string | null;
  currentInning: number;          // 1〜
  currentTopBottom: 'top' | 'bottom';
  currentBatterIndex: number;     // 0〜8（打順ポインタ、ラインナップ配列のインデックス）
  outs: number;                   // 0〜2（3でイニング終了）
  runnersOnBase: Record<1 | 2 | 3, string | null>; // lineup.id or null
  pitches: Pitch[];               // 現在打席の投球配列
  plateAppearances: PlateAppearance[]; // 全打席の確定済み記録
  undoStack: ScoreSnapshot[];     // Undo用スナップショット
}
```

**アクション**:
- `initGame(gameId)` - 試合開始時に状態を初期化
- `recordPitch(type: PitchType)` - 投球を記録（3Sで三振自動確定、4Bで四球自動確定）
- `recordResult(result: PlateResult)` - 打席結果を手動確定
- `advanceInning()` - 攻守交代（3アウト後）
- `undo()` - 直前のスナップショットに戻す

### 2. `app/games/[id]/page.tsx`（Server Component）

- `gameId` をパラメータから取得
- `<ScoreInputPage gameId={gameId} />` を描画

### 3. `components/score-input/ScoreInputPage.tsx`（Client Component）

- `useGameStore` で試合・ラインナップを取得
- `useScoreStore` でスコア状態を取得
- 現在のフェーズに応じて表示を切り替え:
  - `phase: 'pitching'` → PitchInputPanel を表示
  - `phase: 'result'` → ResultInputPanel を表示（インプレー後）
  - `phase: 'inning_end'` → 攻守交代ボタンを表示

### 4. `components/score-input/GameHeader.tsx`

- イニング表示（例: `1回表`）
- アウトカウント（●○○ or ●●○ or ●●●）
- 塁上走者インジケーター（一・二・三塁の文字を強調）

### 5. `components/score-input/PitchInputPanel.tsx`

- 6ボタン: `B`・`S振`・`S見`・`F`・`インプレー`・`死球`
- タブレット向け大型ボタン（最小64px高さ）

### 6. `components/score-input/ResultInputPanel.tsx`

- 安打4種・アウト5種・出塁2種・その他4種 = 15種のボタン
- インプレー後に表示される

### 7. `components/score-input/CurrentBatterInfo.tsx`

- 打者名・打順表示
- カウント表示（B: x / S: x / F: x）

### 8. `components/score-input/ScoreLog.tsx`

- 打席確定済みの一覧（テキスト形式）
- 例: `1. 田中: 四球(4B)`、`2. 鈴木: ゴロ(4-3)`

## データフロー

### 投球入力フロー

```
1. ユーザーが PitchInputPanel のボタンをタップ
2. scoreStore.recordPitch(type) を呼び出し
3. Store内でスナップショット保存 → pitches[] に追加
4. 3ストライク or 4ボール → 自動的に打席結果を確定してPlateAppearance作成
5. インプレー → phase: 'result' に遷移して ResultInputPanel を表示
6. UI 更新（カウント表示・ログ）
```

### 打席結果確定フロー

```
1. ユーザーが ResultInputPanel のボタンをタップ
2. scoreStore.recordResult(result) を呼び出し
3. PlateAppearance を作成して plateAppearances[] に追加
4. アウト結果の場合 outs を +1
5. outs === 3 → phase: 'inning_end' に遷移
6. そうでなければ次打者に移行（currentBatterIndex + 1、pitches: []）
```

### Undo フロー

```
1. Undo ボタンタップ
2. undoStack の末尾スナップショットを取り出し
3. 全状態をスナップショット値に戻す
```

## テスト戦略

### ユニットテスト（Vitest）

- `recordPitch`: ボール4球で四球自動確定・3ストライクで三振自動確定
- `recordResult`: アウトカウント増加・次打者移行・3アウトでイニング終了フラグ
- `undo`: スナップショットへの復元
- `advanceInning`: イニングカウンター・打者インデックス・アウトのリセット

## ディレクトリ構造

```
types/
└── score.ts                          # 新規

store/
└── scoreStore.ts                     # 新規
└── scoreStore.test.ts                # 新規

app/games/[id]/
└── page.tsx                          # 更新（プレースホルダー→本実装）

components/score-input/
├── ScoreInputPage.tsx                # 新規
├── GameHeader.tsx                    # 新規
├── CurrentBatterInfo.tsx             # 新規
├── PitchInputPanel.tsx               # 新規
├── ResultInputPanel.tsx              # 新規
└── ScoreLog.tsx                      # 新規
```

## 実装の順序

1. `types/score.ts` - 型定義
2. `store/scoreStore.ts` + `store/scoreStore.test.ts`
3. UIコンポーネント（GameHeader → CurrentBatterInfo → PitchInputPanel → ResultInputPanel → ScoreLog → ScoreInputPage）
4. `app/games/[id]/page.tsx` を本実装に更新

## セキュリティ考慮事項

- ユーザー入力なし（ボタンタップのみ）のため追加バリデーション不要

## パフォーマンス考慮事項

- plateAppearances が増えても ScoreLog は最大直近20打席程度を表示
- undo スタックは最大50スナップショットに制限

## 将来の拡張性

- `plateAppearances` と `pitches` は後でSupabase INSERTに差し替え可能な構造
- 走者管理（`runnersOnBase`）は本フェーズで状態として持つが、UIは次フェーズ
