# 設計: Supabase同期失敗時のエラー通知

## 方針

外部ライブラリは使用せず、シンプルな自作コンポーネントで実装する。

## コンポーネント構成

### `hooks/useSyncError.ts` (新規)

同期エラー状態を管理するカスタムフック。

```ts
function useSyncError() {
  const [syncError, setSyncError] = useState<string | null>(null);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const syncWithErrorHandling = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      if (navigator.onLine) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[SyncError]', err);
        }
        setSyncError('クラウド同期に失敗しました。データはローカルに保存されています。');
        // 5秒後に自動クリア
        setTimeout(() => setSyncError(null), 5000);
      }
    }
  }, []);

  return { syncError, clearSyncError, syncWithErrorHandling };
}
```

### `components/ui/SyncErrorBanner.tsx` (新規)

エラーバナーの表示コンポーネント。

```tsx
function SyncErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div role="alert" aria-live="polite" className="...">
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}
```

スタイル: 画面上部のオレンジ/アンバー色バナー（非破壊的 = 操作を邪魔しない位置）

## 変更箇所

| ファイル | 変更内容 |
|---|---|
| `hooks/useSyncError.ts` | 新規作成: エラー状態管理フック |
| `components/ui/SyncErrorBanner.tsx` | 新規作成: エラーバナー UI |
| `components/score-input/ScoreInputPage.tsx` | `useSyncError` を使用してエラーハンドリング |
| `components/game-setup/GameSetupForm.tsx` | `useSyncError` を使用してエラーハンドリング |
| `hooks/useOnlineSync.ts` | エラーを `console.error` でログ出力（バナー表示は対象外: hook 内で state 管理不可） |

## useOnlineSync の扱い

`useOnlineSync` はカスタムフックであり、UI を持たないため `SyncErrorBanner` を直接表示できない。
ここでのエラーは `console.error` のみ（オフラインからオンラインへの復帰時の同期失敗は
すでに次の同期機会で再試行される）。

## バナーの配置

### ScoreInputPage
右ペインの上部（「← 試合一覧」リンクの下）に fixed ではなく inline で表示。

### GameSetupForm
フォームの上部に表示。
