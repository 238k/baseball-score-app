# 設計書: Redo機能の追加

## scoreStore の設計変更

### ScoreState 追加フィールド

```ts
redoStack: ScoreSnapshot[];
redo: () => void;
```

### undo() の変更

```ts
undo: () => {
  const state = get();
  if (state.undoStack.length === 0) return;

  const currentSnap = snapshot(state);  // 現在の状態を保存
  const prev = state.undoStack[state.undoStack.length - 1];
  set({
    ...prev の各フィールドを復元,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, currentSnap],  // 現在の状態を redo に積む
  });
},
```

### redo() の追加

```ts
redo: () => {
  const state = get();
  if (state.redoStack.length === 0) return;

  const currentSnap = snapshot(state);  // 現在の状態を undo に積む
  const next = state.redoStack[state.redoStack.length - 1];
  set({
    ...next の各フィールドを復元,
    undoStack: [...state.undoStack, currentSnap],
    redoStack: state.redoStack.slice(0, -1),
  });
},
```

### 各操作での redoStack クリア

`recordPitch`, `recordResult`, `confirmRunners`, `advanceInning` 実行時に
`redoStack: []` をセットして新しい分岐の操作履歴をクリア。

### 永続化（partialize）

`redoStack` は `undoStack` と同様にセッション揮発性のため永続化しない。

## UI 設計

### Undo/Redo ボタン配置

```jsx
<div className="px-4 pb-4 flex gap-2">
  <Button onClick={undo} disabled={undoStack.length === 0} className="flex-1 ...">
    ↩ 取り消し
  </Button>
  <Button onClick={redo} disabled={redoStack.length === 0} className="flex-1 ...">
    ↪ やり直し
  </Button>
</div>
```

### キーボードショートカット

`useEffect` で `keydown` を購読:
- `Cmd+Shift+Z` (Mac): `e.metaKey && e.shiftKey && e.key === 'z'`
- `Ctrl+Y` (Windows/Linux): `e.ctrlKey && e.key === 'y'`
