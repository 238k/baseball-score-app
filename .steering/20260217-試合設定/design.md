# 設計書

## アーキテクチャ概要

Next.js App Router + Zustand（ローカル状態のみ）。Supabaseは今回未接続。

```
app/
├── page.tsx                      # ホーム（試合一覧）- 既存を更新
└── games/
    └── new/
        └── page.tsx              # 試合設定画面（新規）

types/
└── game.ts                       # 型定義（新規）

store/
└── gameStore.ts                  # Zustand: 試合・ラインナップ状態（新規）

components/
└── game-setup/
    ├── GameSetupForm.tsx          # 試合設定フォーム全体（新規）
    ├── TeamInfoSection.tsx        # チーム名・日程入力（新規）
    └── LineupSection.tsx          # 打順・選手入力（新規）
```

## コンポーネント設計

### 1. `app/games/new/page.tsx`（Server Component）

**責務**:
- ページタイトルを設定
- `GameSetupForm` を描画

**実装の要点**:
- Server Componentとして実装（データ取得なしでもOK）
- `<GameSetupForm />` はClient Componentとして別ファイル

### 2. `components/game-setup/GameSetupForm.tsx`（Client Component）

**責務**:
- フォーム全体の状態管理（`useState` / `useReducer`）
- バリデーション実行
- 「試合開始」ボタンで `gameStore` にデータを登録し、`/games/[id]` へ遷移

**実装の要点**:
- `'use client'` 宣言
- Zodでバリデーション
- `useRouter` で遷移

### 3. `components/game-setup/TeamInfoSection.tsx`

**責務**:
- チーム名・試合日・球場名の入力フィールド

### 4. `components/game-setup/LineupSection.tsx`

**責務**:
- 打順1〜9の選手名・守備位置入力
- 「控え追加」ボタンで控え欄を追加
- ホーム/ビジターのタブ切り替え

**実装の要点**:
- 守備位置は select で選択（1〜9 + 名称を表示）
- タブレットタッチ向けに入力フィールドは最小44pxの高さ

### 5. `types/game.ts`

機能設計書のデータモデルから、以下の型を定義:
- `Game` interface
- `Lineup` interface
- `GameStatus` type
- `FieldingPosition` type
- `SubstitutionType` type

### 6. `store/gameStore.ts`

Zustandストア:
- `games: Game[]` - 試合一覧（ローカルのみ）
- `lineups: Record<string, Lineup[]>` - gameIdをキーにしたラインナップ
- `createGame(input)` - ゲームを作成してIDを返す
- `addLineupsForGame(gameId, lineups)` - ラインナップを登録

## データフロー

### 試合設定完了フロー

```
1. ユーザーがフォームを入力（TeamInfoSection + LineupSection）
2. 「試合開始」ボタン → GameSetupForm の handleSubmit
3. Zodでバリデーション（失敗ならエラー表示）
4. cryptoでUUIDを生成
5. gameStore.createGame(gameInput) → Game を作成
6. gameStore.addLineupsForGame(gameId, lineups) → Lineup を登録
7. router.push(`/games/${gameId}`)
```

## エラーハンドリング戦略

### バリデーション

- Zodスキーマで `CreateGameSchema`・`LineupSchema` を定義
- エラーは各フィールドの下にインライン表示
- 先発9名が揃っていない場合は「試合開始」ボタンをdisabled

## テスト戦略

### ユニットテスト

- `store/gameStore.ts` の `createGame`・`addLineupsForGame` アクション
- `types/game.ts` の型定義（Zodスキーマのバリデーション）

### 統合テスト

- 今回は省略（UIコンポーネントテストはPost-MVP）

## 依存ライブラリ

新規追加:

```json
{
  "dependencies": {
    "zustand": "^5.0.0",
    "zod": "^3.0.0"
  }
}
```

## ディレクトリ構造

```
app/
├── page.tsx                        # 更新（試合一覧リンク追加）
└── games/
    └── new/
        └── page.tsx                # 新規作成

types/
└── game.ts                         # 新規作成

store/
└── gameStore.ts                    # 新規作成

components/
└── game-setup/
    ├── GameSetupForm.tsx            # 新規作成
    ├── TeamInfoSection.tsx          # 新規作成
    └── LineupSection.tsx            # 新規作成
```

## 実装の順序

1. 依存ライブラリのインストール（zustand, zod）
2. 型定義 `types/game.ts`
3. Zustand Store `store/gameStore.ts`
4. UIコンポーネント（TeamInfoSection → LineupSection → GameSetupForm）
5. ページファイル `app/games/new/page.tsx`
6. ホームページ更新 `app/page.tsx`

## セキュリティ考慮事項

- ユーザー入力（チーム名・選手名）をZodで最大文字数バリデーション
- XSSはNext.jsのデフォルトエスケープに依存

## パフォーマンス考慮事項

- ラインナップ18行（9×2チーム）程度のフォームなので特別な最適化不要
- 守備位置セレクトは静的リストなので `useMemo` 不要

## 将来の拡張性

- `gameStore.ts` のアクションを後でSupabase呼び出しに差し替えやすい設計
- `createGame` の戻り値をそのままSupabaseレスポンスの形に揃えておく
