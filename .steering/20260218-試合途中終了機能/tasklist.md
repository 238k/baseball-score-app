# タスクリスト: 試合途中終了機能

## フェーズ1: 型・ストアの修正

- [x] `types/game.ts`: `GameStatus` に `suspended` 追加、`Game` に `suspendedReason?: string` 追加
- [x] `store/gameStore.ts`: `finishGame` アクションを追加

## フェーズ2: ScoreInputPage UI

- [x] `ScoreInputPage.tsx`: `finishGame` アクション取得・`isFinishDialogOpen`/`finishReason` state 追加
- [x] `ScoreInputPage.tsx`: 「試合を終了する」ボタン追加（in_progress 時のみ表示）
- [x] `ScoreInputPage.tsx`: 確認ダイアログ（終了理由選択・確定/キャンセル）追加
- [x] `ScoreInputPage.tsx`: 試合終了後の入力ロック + 成績・印刷リンク表示

## フェーズ3: GameCard ステータスバッジ

- [x] `GameCard.tsx`: `suspended` ステータスバッジ（amber）追加
- [x] `GameCard.tsx`: 終了済み試合の「記録」ボタンを非表示（成績のみ）

## フェーズ4: 型整合性確認

- [x] TypeScript 型エラーなし（type-check）

---

## 実装後の振り返り

**実装完了日**: 2026-02-18

**変更ファイル**:
- `types/game.ts`: `GameStatus` は `in_progress` | `completed` で維持。`finishReason?: string` を追加
- `store/gameStore.ts`: `finishGame(gameId, reason?)` アクション追加
- `lib/supabase/types.ts`: `GameRow` / `GameInsert` に `finish_reason?: string | null` を追加
- `lib/supabase/queries/games.ts`: `finish_reason` のマッピング追加
- `components/score-input/ScoreInputPage.tsx`: 終了ボタン・確認ダイアログ・終了後ロック UI 追加
- `components/game/GameCard.tsx`: 終了済み試合の「記録」ボタン非表示

**計画変更点**:
- 当初は `suspended` ステータスを追加する予定だったが、ユーザーのリクエストにより `completed` 1種類に統一
- 終了理由（`finishReason`）のみオプションで記録（コールドゲーム等）
- Supabase の型問題もこれにより解決

**学んだこと**:
- Supabase の生成型 (`types.ts`) も変更が必要な場合は合わせて更新すること
- ステータス分類は後から変更しやすいよう最小限にするのが良い

**テスト**: lint・type-check・unit tests（103件）すべて通過
