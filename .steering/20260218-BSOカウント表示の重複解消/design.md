# 設計: BSOカウント表示の重複解消

## GameStatusPanel.tsx の変更

### 削除する Props

```ts
// 削除
pitches: Pitch[];
```

### 削除する内部関数

```ts
// 削除
function countBalls(pitches: Pitch[]): number { ... }
function countStrikes(pitches: Pitch[]): number { ... }
```

### 削除する JSX

```tsx
{/* BSO カウント */}
<div className="flex items-center gap-3">
  {/* ボール / ストライク / アウト の3ブロック */}
  ...
</div>
```

### 変更後の レイアウト

BSO ブロック削除後、ランナーダイヤモンドが `flex items-center justify-between` の唯一の子になる。
そのため `flex items-center justify-between` を `flex items-center justify-end` または単純に `flex justify-end` に変更し、
ダイヤモンドを右寄せにする。あるいはアウト数をダイヤモンド左横に小さく残す。

**採用**: アウト数のみ残し、BSO の B/S はすべて削除する。
- アウト数は試合の大局（攻守交代タイミング）に関わる重要情報なのでダイヤモンドの横に残す
- B/S のカウントは `CurrentBatterInfo` に任せる

```tsx
{/* アウト + ランナーダイヤモンド */}
<div className="flex items-center justify-between">
  {/* アウト */}
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-zinc-400">O</span>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        aria-hidden="true"
        className={`w-3.5 h-3.5 rounded-full border ${
          i < outs ? 'bg-red-400 border-red-400' : 'bg-transparent border-zinc-500'
        }`}
      />
    ))}
  </div>
  {/* ランナーダイヤモンド（既存） */}
  ...
</div>
```

## ScoreInputPage.tsx の変更

```tsx
// Before
<GameStatusPanel
  ...
  pitches={pitches}
/>

// After (pitches prop を削除)
<GameStatusPanel
  ...
/>
```
