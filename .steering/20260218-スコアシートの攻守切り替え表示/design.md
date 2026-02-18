# 設計: スコアシートの攻守切り替え表示

## アーキテクチャ方針

ScoreSheet.tsx 側は変更せず、ScoreInputPage.tsx に `viewingSide` state を追加して
表示するチームを切り替える。ScoreSheet の `attackingSide` / `attackingLineup` props に
「閲覧中のチーム」の値を渡すことで、既存の isCurrent ロジックがそのまま機能する。

## ScoreInputPage.tsx への変更

### 1. state 追加

```ts
const [viewingSide, setViewingSide] = useState<'home' | 'away'>(attackingSide);
```

### 2. 攻守交代時に自動リセット

```ts
useEffect(() => {
  setViewingSide(attackingSide);
}, [attackingSide]);
```

### 3. 閲覧チームのラインナップ計算

```ts
const viewingLineup = useMemo(() => {
  return Array.from({ length: 9 }, (_, i) => {
    return getCurrentBatter(gameId, viewingSide, i + 1) ?? null;
  });
}, [gameId, viewingSide, getCurrentBatter, gameLineups]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 4. トグル UI（スコアシート左ペインの上部）

```tsx
{/* チーム切り替えトグル */}
<div className="flex border-b border-zinc-200 bg-white flex-shrink-0">
  <button
    type="button"
    onClick={() => setViewingSide('away')}
    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
      viewingSide === 'away'
        ? 'bg-blue-600 text-white'
        : 'text-zinc-500 hover:bg-zinc-100'
    }`}
  >
    {game.awayTeamName}（表）
  </button>
  <button
    type="button"
    onClick={() => setViewingSide('home')}
    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
      viewingSide === 'home'
        ? 'bg-blue-600 text-white'
        : 'text-zinc-500 hover:bg-zinc-100'
    }`}
  >
    {game.homeTeamName}（裏）
  </button>
</div>
```

### 5. ScoreSheet に viewingSide/viewingLineup を渡す

```tsx
<ScoreSheet
  attackingSide={viewingSide}          // ← attackingSide から viewingSide に変更
  attackingLineup={viewingLineup}      // ← viewingLineup を使用
  ...
/>
```

## 注意点

- `currentBatterIndex` は攻撃中チームの打者インデックスのまま ScoreSheet に渡す
  - ScoreSheet 内部で `isAttacking = currentTopBottom === sideTopBottom` を計算し、
    非攻撃チームを表示中は `isAttacking = false` となるため、ハイライトが自動的に消える
- `viewingSide` が変わっても ScoreStore の状態（入力フェーズ等）は変わらない
