# 設計: 試合途中終了機能

## types/game.ts

```ts
// Before
export type GameStatus = 'in_progress' | 'completed';

// After
export type GameStatus = 'in_progress' | 'completed' | 'suspended';

// Game に追加
suspendedReason?: string;  // 途中終了理由（suspended 時のみ）
```

## store/gameStore.ts

`GameState` インターフェースに追加:
```ts
finishGame: (gameId: string, status: 'completed' | 'suspended', reason?: string) => void;
```

実装:
```ts
finishGame: (gameId, status, reason) => {
  set((state) => ({
    games: state.games.map((g) =>
      g.id === gameId
        ? { ...g, status, suspendedReason: reason, updatedAt: new Date().toISOString() }
        : g
    ),
  }));
},
```

## components/score-input/ScoreInputPage.tsx

### 追加する state
```ts
const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
const [finishReason, setFinishReason] = useState('コールドゲーム');
```

### finishGame アクションの取得
```ts
const { finishGame } = useGameStore();
```

### 試合終了ボタン
右ペイン下部（Undo/Redoボタンの上）に配置:
```tsx
{game.status === 'in_progress' && (
  <div className="px-4 pt-2">
    <Button
      variant="outline"
      onClick={() => setIsFinishDialogOpen(true)}
      className="w-full text-red-600 border-red-200 hover:bg-red-50 ..."
    >
      試合を終了する
    </Button>
  </div>
)}
```

### 確認ダイアログ（インラインオーバーレイ）
```tsx
{isFinishDialogOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
      <h2>試合を終了しますか？</h2>
      <p>終了すると入力が完了します。</p>
      {/* 終了理由の選択: select */}
      <Button onClick={handleFinish}>終了する</Button>
      <Button variant="outline" onClick={() => setIsFinishDialogOpen(false)}>キャンセル</Button>
    </div>
  </div>
)}
```

### 入力ロック
`game.status !== 'in_progress'` の場合、入力パネルを非表示にして完了メッセージを表示:
```tsx
{game.status !== 'in_progress' ? (
  <div className="p-6 text-center">
    <p className="font-bold text-zinc-700">試合終了</p>
    <p className="text-sm text-zinc-500">{game.status === 'suspended' ? `途中終了（${game.suspendedReason}）` : '正規終了'}</p>
    <Link href={`/games/${gameId}/stats`}>成績を見る</Link>
    <Link href={`/games/${gameId}/print`}>印刷</Link>
  </div>
) : (
  /* 通常の入力パネル */
)}
```

## components/game/GameCard.tsx

`suspended` ステータスを追加:
```ts
const STATUS_LABEL = {
  in_progress: '記録中',
  completed: '完了',
  suspended: '途中終了',
};
const STATUS_CLASS = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-zinc-100 text-zinc-500',
  suspended: 'bg-amber-100 text-amber-700',
};
```

試合が `in_progress` でない場合、「記録」ボタンを非表示にして「成績」のみ表示。
