# 設計: PWAオフライン対応

## 実装アプローチ

### 全体方針

3つの柱で実装:
1. **Serwist Service Worker** - 静的アセットをキャッシュし、オフラインでもアプリが起動できる
2. **Supabase自動同期** - ゲーム作成・スコア確定時に `syncToSupabase` を呼び出す
3. **オンライン復帰同期** - `navigator.onLine` + `online` イベントで復帰を検知し同期

### 既存実装の活用

- `gameStore.ts` の `syncToSupabase(gameId)` は実装済み（呼び出し口が未設置）
- Zustand persist で localStorage 保存済み（オフライン中はローカル動作）
- `loadFromSupabase(userId)` も実装済み

### ファイル構成

```
app/
├── sw.ts                      # Service Worker エントリポイント（新規）
├── ~offline/
│   └── page.tsx               # オフラインフォールバックページ（新規）
├── serwist.ts                 # SerwistProvider の再エクスポート（新規）
└── layout.tsx                 # SerwistProvider・PWA metadata 追加（更新）

public/
├── manifest.json              # PWA マニフェスト（新規）
└── icons/
    ├── icon-192.png           # PWA アイコン 192px（新規）
    └── icon-512.png           # PWA アイコン 512px（新規）

hooks/
└── useOnlineSync.ts           # オンライン復帰同期フック（新規）

next.config.ts                 # withSerwistInit でラップ（更新）
tsconfig.json                  # webworker lib + @serwist/next/typings 追加（更新）
```

### syncToSupabase の組み込みポイント

| イベント | 呼び出し場所 | 処理 |
|---------|------------|------|
| ゲーム作成直後 | `GameSetupForm.tsx` の `createGame` 後 | `await syncToSupabase(game.id)` |
| QuickStart 後 | `QuickStartButton.tsx` の `createGame` 後 | `await syncToSupabase(game.id)` |
| スコア入力画面マウント | `ScoreInputPage.tsx` の `useEffect` | 認証済みなら `syncToSupabase(gameId)` |
| オンライン復帰時 | `useOnlineSync.ts` の `online` イベント | 全 games に対して `syncToSupabase` |

### Serwist 設定

```
swSrc: "app/sw.ts"
swDest: "public/sw.js"
runtimeCaching: defaultCache（Next.js 向けデフォルト）
fallback: /~offline（ドキュメントリクエストのオフラインフォールバック）
```

### オフラインインジケーター

- `useOnlineSync.ts` が `isOnline` state を返す
- `ScoreInputPage.tsx` のヘッダー近辺に「オフラインで動作中」バナーを表示
- オンライン復帰時に自動的に同期してバナーを消す

### エラーハンドリング

- `syncToSupabase` は try/catch を内包している（throw するが catch して続行）
- 非認証時の sync は skip（`user` が null の場合はスキップ）
- sync 失敗時はコンソールログのみ（ユーザー通知は今回スコープ外）
