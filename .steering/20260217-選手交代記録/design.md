# 設計書

## アーキテクチャ概要

既存の Zustand ストア + React コンポーネントのパターンを踏襲する。
gameStore に選手交代アクションを追加し、ScoreInputPage に交代パネルを統合する。

```
ScoreInputPage
  ├── GameHeader（イニング・アウト・走者）
  ├── CurrentBatterInfo（現在打者）
  ├── SubstitutionButton ← NEW（pitching フェーズのみ表示）
  ├── PitchInputPanel / ResultInputPanel / RunnerAdvancePanel
  ├── SubstitutionPanel ← NEW（モーダル）
  └── ScoreLog
```

## コンポーネント設計

### 1. SubstitutionPanel.tsx

**責務**:
- 選手交代の入力フォームをモーダル形式で表示
- 交代種別・打順・選手名・守備位置の入力を受け付ける
- 確定時に `gameStore.substitutePlayer()` を呼ぶ

**実装の要点**:
- pitching フェーズでのみ表示（走者進塁中・試合終了時は非表示）
- 打順選択で現在の選手名（最新 cycle）を右に表示
- 守備位置は既存の守備位置セレクタ（LineupSection 内の select）と同じ選択肢
- バリデーション: 選手名必須、守備位置必須（守備交代・投手交代時）

**Props**:
```typescript
interface SubstitutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  attackingSide: 'home' | 'away';
  currentInning: number;
}
```

### 2. gameStore の substitutePlayer アクション

**責務**:
- 代打・代走・投手交代: 同打順に cycle+1 の新 Lineup を追加
- 守備交代: 既存 Lineup の position を更新

**実装の要点**:
- `getCurrentBatter(side, battingOrder)` ヘルパー: 同 side+battingOrder で cycle 最大のエントリを返す
- `substitutePlayer` は SubstituteOptions を受けて適切な処理を分岐

**新しいアクションの型**:
```typescript
interface SubstituteOptions {
  gameId: string;
  side: 'home' | 'away';
  battingOrder: number;
  playerName: string;
  position: FieldingPosition;
  enteredInning: number;
  substitutionType: SubstitutionType;
}

// Store に追加するアクション
substitutePlayer: (options: SubstituteOptions) => void;
getCurrentBatter: (gameId: string, side: 'home' | 'away', battingOrder: number) => Lineup | undefined;
```

## データフロー

### 代打の場合

```
1. ユーザーが「交代」ボタンをタップ
2. SubstitutionPanel が開く
3. 交代種別=代打、打順=3、選手名=「代打選手」、守備位置=7 を入力
4. 「確定」をタップ
5. substitutePlayer が gameStore に対して呼ばれる
6. gameStore が lineups[gameId] に新エントリ追加
   { side, battingOrder: 3, cycle: 2, playerName, position, isStarter: false, enteredInning, substitutionType: '代打' }
7. ScoreInputPage の attackingLineup が再計算
   → cycle 最大のエントリが打者として使われる
8. CurrentBatterInfo が更新された選手名を表示
```

### 守備交代の場合

```
1. ユーザーが「交代」ボタンをタップ
2. 交代種別=守備交代、打順=5、守備位置=4 を入力（選手名は同じ）
3. 「確定」をタップ
4. substitutePlayer が既存 Lineup の position を更新
```

## エラーハンドリング戦略

- 選手名が空の場合: ボタンを disabled にし入力を強制
- 守備位置未選択の場合: 同上（代走のみ position 不要として扱う選択もあるが、簡潔化のため必須とする）

## テスト戦略

### ユニットテスト
- `gameStore.substitutePlayer` の各交代種別での動作
  - 代打: 新エントリが cycle+1 で追加されること
  - 守備交代: 既存エントリの position が更新されること
  - 2回目の代打: cycle が正しく 3 になること

## 依存ライブラリ

新規追加なし（既存の Tailwind CSS、React を使用）

## ディレクトリ構造

```
components/score-input/
  ├── SubstitutionPanel.tsx   ← NEW
  └── ScoreInputPage.tsx      ← 変更（ボタン追加・パネル統合）

store/
  └── gameStore.ts            ← 変更（substitutePlayer・getCurrentBatter 追加）

store/
  └── gameStore.test.ts       ← 変更（substitutePlayer のテスト追加）
```

## 実装の順序

1. `gameStore.ts` に `substitutePlayer` と `getCurrentBatter` を追加
2. `SubstitutionPanel.tsx` を作成
3. `ScoreInputPage.tsx` に交代ボタンとパネルを統合
4. `gameStore.test.ts` にテストを追加
5. `ScoreInputPage.tsx` の攻撃中ラインナップ取得ロジックを `getCurrentBatter` を使う形に調整

## セキュリティ考慮事項

- 選手名はテキスト表示のみ（XSSはReactがエスケープ）

## パフォーマンス考慮事項

- `attackingLineup` の計算で cycle 最大を取るため、useMemo で包む

## 将来の拡張性

- Undo 対応: substitutePlayer もスナップショットを保存すれば Undo 可能
- Supabase 同期: lineups INSERT/UPDATE をここに追加するだけで永続化できる
