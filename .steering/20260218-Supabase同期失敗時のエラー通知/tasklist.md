# タスクリスト: Supabase同期失敗時のエラー通知

## フェーズ1: 共通コンポーネント・フックの作成

- [x] `hooks/useSyncError.ts`: 同期エラー状態管理フック作成
- [x] `components/ui/SyncErrorBanner.tsx`: エラーバナー UI コンポーネント作成

## フェーズ2: 呼び出し箇所の修正

- [x] `components/score-input/ScoreInputPage.tsx`: `useSyncError` を使用してエラーハンドリング
- [x] `components/game-setup/GameSetupForm.tsx`: `useSyncError` を使用してエラーハンドリング
- [x] `hooks/useOnlineSync.ts`: エラーを `console.error` でログ出力（開発環境のみ）

## フェーズ3: 検証

- [x] TypeScript 型エラーなし（type-check）

---

## 実装後の振り返り

**実装完了日**: 2026-02-18

**変更ファイル**:
- `hooks/useSyncError.ts`（新規）: 同期エラー状態管理フック
- `components/ui/SyncErrorBanner.tsx`（新規）: エラーバナー UI
- `components/score-input/ScoreInputPage.tsx`: `useSyncError` 使用、バナー表示
- `components/game-setup/GameSetupForm.tsx`: `useSyncError` 使用（バナーは遷移前に見えないがコンソールログは有効）
- `hooks/useOnlineSync.ts`: `console.error` ログ追加（開発環境のみ）

**計画変更点**:
- バリデータ指摘により `useSyncError.ts` の `setTimeout` を `useRef` で管理するよう修正（アンマウント後のsetState防止・タイマー積み重なり防止）
- `SyncErrorBanner.tsx` に `'use client'` ディレクティブを追加（指摘後修正）

**GameSetupForm の制約**:
- `syncWithNotification` 呼び出し直後に `router.push()` するため、バナーは実質表示されない
- ただし遷移先の `ScoreInputPage` がマウント時に再同期するため、エラーが発生した場合はそちらでバナーが表示される

**テスト**: lint・type-check・unit tests（103件）すべて通過
