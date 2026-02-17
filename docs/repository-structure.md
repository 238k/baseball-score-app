# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
baseball-score-app/
├── app/                        # Next.js App Router ルートディレクトリ
│   ├── (auth)/                 # 認証グループ（layoutを分離）
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── games/
│   │   ├── new/
│   │   │   └── page.tsx        # 試合設定画面
│   │   └── [id]/
│   │       ├── page.tsx        # スコア入力（メイン画面）
│   │       ├── stats/
│   │       │   └── page.tsx    # 成績集計画面
│   │       └── print/
│   │           └── page.tsx    # 印刷用ビュー
│   ├── offline/
│   │   └── page.tsx            # オフライン時フォールバック
│   ├── layout.tsx              # ルートレイアウト（PWA・認証Provider）
│   ├── manifest.ts             # PWAマニフェスト（動的生成）
│   ├── page.tsx                # ホーム（試合一覧）
│   ├── sw-register.tsx         # Service Worker 登録コンポーネント
│   └── globals.css             # グローバルスタイル（Tailwind + shadcn CSS変数）
│
├── components/                 # 再利用可能なReactコンポーネント
│   ├── scorebook/              # スコアブック専用コンポーネント（独自実装・shadcn非対象）
│   │   ├── ScoreSheet.tsx      # スコアシート全体
│   │   ├── ScoreCell.tsx       # 打席セル（投球記録 + ダイヤモンド描画）
│   │   └── Diamond.tsx         # 菱形SVGと走路表示
│   ├── score-input/            # スコア入力画面コンポーネント
│   │   ├── ScoreInputPage.tsx  # 入力画面レイアウト（左右2ペイン）
│   │   ├── GameStatusPanel.tsx # 右上: 試合状況（イニング・BSO・スコア・ランナー）
│   │   ├── CurrentBatterInfo.tsx
│   │   ├── PitchInputPanel.tsx   # 一球入力パネル
│   │   ├── ResultInputPanel.tsx  # 打席結果入力パネル
│   │   ├── RunnerAdvancePanel.tsx # 走者進塁入力パネル
│   │   ├── SubstitutionPanel.tsx # 選手交代パネル（モーダル）
│   │   ├── ScoreLog.tsx        # 打席ログ一覧
│   │   └── GameHeader.tsx      # 旧ヘッダー（後方互換用）
│   ├── game-setup/             # 試合設定フォーム
│   │   ├── GameSetupForm.tsx   # 試合設定フォーム（コントローラー）
│   │   ├── TeamInfoSection.tsx # チーム情報入力
│   │   └── LineupSection.tsx   # ラインナップ入力
│   ├── game/                   # 試合一覧コンポーネント
│   │   └── GameCard.tsx        # 試合一覧カード
│   ├── stats/                  # 成績表示コンポーネント
│   │   ├── BattingStatsTable.tsx
│   │   └── PitchingStatsTable.tsx
│   ├── print/                  # 印刷ビューコンポーネント
│   │   └── PrintView.tsx
│   ├── dev/                    # 開発用コンポーネント（本番では非表示）
│   │   └── QuickStartButton.tsx
│   └── ui/                     # shadcn/ui ベース汎用コンポーネント
│       ├── button.tsx          # Button（CVA + Radix Slot）
│       ├── input.tsx           # Input
│       └── label.tsx           # Label（Radix Label）
│
├── store/                      # Zustand ストア
│   ├── scoreStore.ts           # スコア入力状態・Undo履歴・得点管理
│   └── gameStore.ts            # 試合・ラインナップ状態
│
├── lib/                        # ビジネスロジック・ユーティリティ
│   ├── supabase/               # Supabase 操作
│   │   ├── client.ts           # クライアント初期化（ブラウザ用）
│   │   ├── server.ts           # サーバーサイド用クライアント
│   │   ├── env.ts              # 環境変数バリデーション
│   │   ├── types.ts            # Supabase 生成型
│   │   └── queries/            # データ取得（SELECT）
│   │       ├── games.ts
│   │       └── lineups.ts
│   ├── stats/                  # 成績計算ロジック
│   │   ├── battingStats.ts     # 打者成績計算
│   │   ├── pitchingStats.ts    # 投手成績計算
│   │   └── statsTypes.ts       # 成績関連の型定義
│   ├── fixtures.ts             # テスト用フィクスチャ
│   └── utils.ts                # 汎用ユーティリティ（cn 関数等）
│
├── types/                      # TypeScript型定義
│   ├── game.ts                 # Game, Lineup, FieldingPosition
│   ├── game-setup.ts           # 試合設定フォームの型
│   └── score.ts                # PlateAppearance, Pitch, ScoreSnapshot 等
│
├── hooks/                      # カスタムReact Hooks
│   ├── useAuth.ts              # 認証状態取得
│   └── useOnlineSync.ts        # オンライン/オフライン状態監視
│
├── middleware.ts               # Next.js ミドルウェア（認証ガード）
│
├── public/                     # 静的ファイル
│   └── icons/                  # PWAアイコン
│
├── docs/                       # プロジェクトドキュメント
│   ├── ideas/                  # アイデア・壁打ちメモ
│   ├── product-requirements.md # PRD
│   ├── functional-design.md    # 機能設計書
│   ├── architecture.md         # アーキテクチャ設計書
│   ├── repository-structure.md # 本ドキュメント
│   ├── development-guidelines.md
│   └── glossary.md
│
├── .steering/                  # 作業単位のドキュメント
│   └── [YYYYMMDD]-[task-name]/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── .claude/                    # Claude Code設定
│   └── skills/                 # スキル定義
│
├── .env.local                  # 環境変数（gitignore対象）
├── .env.example                # 環境変数のサンプル（git管理）
├── components.json             # shadcn/ui 設定
├── next.config.ts              # Next.js設定
├── tsconfig.json               # TypeScript設定（パスエイリアス @/）
├── eslint.config.mjs           # ESLint設定
├── vitest.config.mts           # Vitest設定
├── package.json
├── package-lock.json
├── CLAUDE.md                   # Claude Codeプロジェクト設定
└── README.md
```

---

## ディレクトリ詳細

### app/ (Next.js App Router)

**役割**: ルーティング定義とページコンポーネント。`page.tsx` がルートに対応するUI、`layout.tsx` が共通レイアウトを担当。

**配置ファイル**:
- `page.tsx`: 各ルートの画面コンポーネント
- `layout.tsx`: 共通レイアウト（認証Provider、Zustand Provider）
- `loading.tsx`: ローディング状態
- `error.tsx`: エラー境界

**命名規則**:
- ディレクトリ名: kebab-case（`games/`, `[id]/`）
- ファイル名: Next.js規約（`page.tsx`, `layout.tsx`）
- ルートグループ: `(auth)` のように `()` で括る

**依存関係**:
- 依存可能: `components/`, `store/`, `lib/`, `hooks/`, `types/`
- 禁止: `tests/`, `.steering/`

---

### components/ (Reusable コンポーネント)

**役割**: 複数ページで再利用されるReactコンポーネント。ページ固有のロジックは持たず、propsで制御する。

**配置ファイル**:
- `scorebook/`: スコアブックUI専用コンポーネント（SVGダイヤモンド描画等）。shadcn/ui非対象
- `score-input/`: スコア入力画面のコンポーネント群（入力パネル・試合状況表示等）
- `game-setup/`: 試合設定フォームのコンポーネント
- `game/`: 試合一覧UI（GameCard等）
- `stats/`: 成績テーブル表示
- `print/`: 印刷ビュー専用コンポーネント
- `dev/`: 開発用補助コンポーネント（本番では非表示）
- `ui/`: shadcn/uiベースの汎用UIプリミティブ（Button/Input/Label等）

**命名規則**:
- ファイル名: PascalCase（`ScoreCell.tsx`, `BattingStatsTable.tsx`）
- 1ファイル1コンポーネントを原則とする
- 300行を超える場合はサブコンポーネントに分割を検討

**依存関係**:
- 依存可能: `lib/utils/`, `types/`, `store/`（Zustand storeのread）
- 禁止: `app/`への依存（循環参照防止）

---

### store/ (Zustand ストア)

**役割**: クライアントサイドの状態管理。スコア入力状態・Undoスタック・ラインナップ等の試合中のインメモリ状態を保持する。

**配置ファイル**:
- `scoreStore.ts`: 現在イニング・アウト数・塁上走者・Undoスタック・入力中打席・得点（homeScore/awayScore）
- `gameStore.ts`: 試合ID・チーム情報・ラインナップ・ゲームステータス（lineupStore は統合済み）

**命名規則**:
- ファイル名: camelCase + `Store` サフィックス（`scoreStore.ts`）
- Zustand storeの関数名: `use[StoreName]Store`

**依存関係**:
- 依存可能: `types/`, `lib/supabase/mutations/`（非同期保存）, `lib/sync/`
- 禁止: `components/`（Reactへの逆依存）, `app/`

---

### lib/ (ライブラリ・ビジネスロジック)

**役割**: UIに依存しない純粋なロジック。成績計算・Supabase操作・オフライン同期処理を担当する。

**サブディレクトリ**:

#### lib/supabase/
Supabaseとの通信を一元管理。クライアント初期化・クエリ・ミューテーション関数を分離。

```
lib/supabase/
├── client.ts           # createBrowserClient() の初期化
├── server.ts           # createServerClient() （Server Component用）
├── queries/            # SELECT（読み取り）操作
└── mutations/          # INSERT/UPDATE/DELETE（書き込み）操作
```

#### lib/stats/
打者・投手の成績計算を純粋関数で実装。副作用なし。

```typescript
// 例: battingStats.ts
export function computeBattingStats(
  plateAppearances: PlateAppearance[]
): BattingStats { ... }
```

#### lib/utils.ts
`cn()` ユーティリティ関数（clsx + tailwind-merge）を提供。shadcn/ui コンポーネントのクラス合成に使用。

**命名規則**:
- クエリ関数: `get[Resource]`, `fetch[Resource]`（例: `getGameById`）
- ミューテーション関数: `create[Resource]`, `update[Resource]`, `delete[Resource]`
- 成績計算関数: `calc[StatName]`

**依存関係**:
- 依存可能: `types/`
- 禁止: `components/`, `app/`, `store/`（UIへの逆依存）

---

### types/ (TypeScript型定義)

**役割**: アプリ全体で使用するTypeScript型・インターフェースの定義。

**配置ファイル**:
- `game.ts`: `Game`, `Lineup`, `FieldingPosition`, `GameStatus` 等
- `game-setup.ts`: 試合設定フォームの型（`TeamInfoValues`, `LineupRow` 等）
- `score.ts`: `PlateAppearance`, `PlateResult`, `Pitch`, `PitchType`, `ScoreSnapshot`, `ScorePhase` 等

※ 成績関連の型（`BattingStats` 等）は `lib/stats/statsTypes.ts` に定義

**命名規則**:
- インターフェース名: PascalCase
- 型エイリアス（Union型等）: PascalCase
- Enum代替（`as const`）: UPPER_SNAKE_CASE

**依存関係**:
- 依存可能: なし（他モジュールに依存しない）
- 他のすべてのモジュールから参照される

---

### hooks/ (カスタムReact Hooks)

**役割**: コンポーネントのロジックを分離するReact Hooks。データ取得・状態操作・副作用管理を担当。

**配置ファイル**:
- `useAuth.ts`: Supabase の認証状態（ユーザー情報）取得
- `useOnlineSync.ts`: オンライン/オフライン状態の監視と同期トリガー

**命名規則**:
- ファイル名: camelCase + `use` プレフィックス（`useGameData.ts`）

**依存関係**:
- 依存可能: `store/`, `lib/`, `types/`
- 禁止: `app/`（ページ固有ロジックの混入防止）

---

### テストコード

**役割**: ユニット・統合テストをソースファイルと同階層に配置。E2Eテストは Playwright で別途管理。

**配置方針**: テストファイルは対象ソースファイルと同じディレクトリに置く（コロケーション）。

**構造の対応関係**:

```
lib/stats/battingStats.ts
lib/stats/battingStats.test.ts   ← 同じディレクトリに配置

store/scoreStore.ts
store/scoreStore.test.ts         ← 同じディレクトリに配置
```

**命名規則**:
- ユニット・統合テスト: `[対象ファイル名].test.ts` / `.test.tsx`（ソースと同階層）
- E2Eテスト: `[シナリオ名].spec.ts`（別途 Playwright プロジェクトで管理予定）

---

### supabase/migrations/ (DBマイグレーション)

**役割**: Supabaseデータベースのスキーマ定義とRLSポリシーをSQL管理。

**命名規則**:
- 形式: `[連番3桁]_[内容].sql`（例: `001_create_games.sql`）
- 連番は昇順で適用される

---

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| ページコンポーネント | `app/**/page.tsx` | Next.js規約 | `app/games/[id]/page.tsx` |
| 再利用コンポーネント | `components/[category]/` | PascalCase | `ScoreCell.tsx` |
| Zustand Store | `store/` | camelCase + Store | `scoreStore.ts` |
| Supabaseクエリ | `lib/supabase/queries/` | camelCase | `games.ts` |
| 成績計算関数 | `lib/stats/` | camelCase | `battingStats.ts` |
| TypeScript型定義 | `types/` | camelCase | `score.ts` |
| カスタムHooks | `hooks/` | use + PascalCase | `useGameData.ts` |
| DBマイグレーション | `supabase/migrations/` | `[連番]_[内容].sql` | `001_create_games.sql` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | `tests/unit/` | `[対象].test.ts` | `battingStats.test.ts` |
| 統合テスト | `tests/integration/` | `[機能].test.tsx` | `score-input.test.tsx` |
| E2Eテスト | `tests/e2e/` | `[シナリオ].spec.ts` | `game-flow.spec.ts` |

### 設定ファイル

| ファイル | 役割 |
|---------|------|
| `next.config.ts` | Next.js設定 |
| `tsconfig.json` | TypeScript設定（パスエイリアス `@/` を設定） |
| `components.json` | shadcn/ui 設定（スタイル・エイリアス・ベースカラー） |
| `vitest.config.mts` | Vitest設定（jsdom環境、カバレッジ設定） |
| `eslint.config.mjs` | ESLint設定（Next.js + TypeScript strict） |
| `.env.local` | 環境変数（gitignore対象） |
| `.env.example` | 環境変数サンプル（git管理） |

---

## 命名規則

### ディレクトリ名

- **機能カテゴリ**: kebab-case、複数形
  - 例: `components/`, `scorebook/`, `queries/`
- **Next.js動的ルート**: `[paramName]` 形式
  - 例: `[id]/`
- **Next.jsルートグループ**: `(groupName)` 形式
  - 例: `(auth)/`

### ファイル名

| 種別 | 命名規則 | 例 |
|------|---------|-----|
| Reactコンポーネント | PascalCase | `ScoreCell.tsx` |
| Hooks | `use` + PascalCase | `useGameData.ts` |
| Store | camelCase + `Store` | `scoreStore.ts` |
| ロジック関数ファイル | camelCase | `battingStats.ts` |
| 型定義ファイル | camelCase | `score.ts` |
| テストファイル | 対象名 + `.test.ts` | `battingStats.test.ts` |

### TypeScript内の命名

| 種別 | 命名規則 | 例 |
|------|---------|-----|
| インターフェース | PascalCase | `PlateAppearance` |
| 型エイリアス | PascalCase | `PlateResult`, `PitchType` |
| コンポーネント関数 | PascalCase | `ScoreCell` |
| 通常関数 | camelCase | `calcBattingStats` |
| 定数 | UPPER_SNAKE_CASE | `MAX_INNINGS` |
| Zustand actions | camelCase | `recordPitch`, `undo` |

---

## 依存関係のルール

### レイヤー間の依存（許可方向のみ）

```
app/ (Pages)
    ↓
components/ ← hooks/
    ↓           ↓
store/      lib/supabase/ ← lib/stats/ ← lib/sync/
    ↓           ↓
         types/ (全レイヤーから参照可能)
```

**禁止される依存**:
- `lib/` → `components/` または `app/` (❌ UIへの逆依存)
- `store/` → `components/` (❌ UIへの逆依存)
- `types/` → 他のどのモジュールへも依存禁止 (❌ types は純粋な型定義のみ)

---

## スケーリング戦略

### 機能追加時の配置方針

| 規模 | 判断基準 | 方針 |
|------|---------|------|
| 小規模 | コンポーネント1〜2個 | 既存カテゴリディレクトリに追加 |
| 中規模 | コンポーネント3〜5個 + ロジック | 既存ディレクトリ内にサブディレクトリ作成 |
| 大規模（Post-MVP） | 独立したデータモデル + 複数画面 | 各ディレクトリ内に機能別サブディレクトリ |

### ファイルサイズ管理

- **推奨**: 1ファイル300行以下
- **要検討**: 300〜500行（分割の検討）
- **要分割**: 500行以上（責務を分離してファイルを分割）

---

## 除外設定

### .gitignore

```
node_modules/
.next/
.env.local
.env.*.local
*.log
.DS_Store
coverage/
playwright-report/
test-results/
public/sw.js              # Serwistが生成するService Worker
public/workbox-*.js       # Serwistが生成するWorkbox
```

### .prettierignore / .eslintignore

```
node_modules/
.next/
.steering/
coverage/
supabase/migrations/      # SQLファイルはフォーマット対象外
```
