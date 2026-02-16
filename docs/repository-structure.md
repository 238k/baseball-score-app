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
│   ├── layout.tsx              # ルートレイアウト（PWA・認証Provider）
│   ├── page.tsx                # ホーム（試合一覧）
│   └── globals.css             # グローバルスタイル（Tailwind imports）
│
├── components/                 # 再利用可能なReactコンポーネント
│   ├── scorebook/              # スコアブック専用コンポーネント
│   │   ├── ScoreSheet.tsx      # スコアシート全体
│   │   ├── ScoreCell.tsx       # 打席セル（ダイヤモンド描画）
│   │   ├── Diamond.tsx         # 菱形SVGと走路表示
│   │   ├── BaseRunner.tsx      # 塁上走者インジケーター
│   │   └── InningHeader.tsx    # イニングヘッダー行
│   ├── input/                  # スコア入力パネル
│   │   ├── PitchInputPanel.tsx   # 一球入力パネル
│   │   ├── ResultInputPanel.tsx  # 打席結果入力パネル
│   │   ├── BaseEventPanel.tsx    # 走者進塁入力パネル
│   │   └── SubstitutionPanel.tsx # 選手交代入力パネル
│   ├── stats/                  # 成績表示コンポーネント
│   │   ├── BattingStatsTable.tsx
│   │   └── PitchingStatsTable.tsx
│   ├── game/                   # 試合設定・一覧コンポーネント
│   │   ├── GameCard.tsx        # 試合一覧カード
│   │   ├── GameSetupForm.tsx   # 試合設定フォーム
│   │   └── LineupForm.tsx      # オーダー入力フォーム
│   └── ui/                     # shadcn/ui ベース汎用コンポーネント
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx           # BottomSheet（入力パネル用）
│       └── toast.tsx
│
├── store/                      # Zustand ストア
│   ├── scoreStore.ts           # スコア入力状態・Undo履歴
│   ├── gameStore.ts            # 試合・イニング状態
│   └── lineupStore.ts          # ラインナップ状態
│
├── lib/                        # ビジネスロジック・ユーティリティ
│   ├── supabase/               # Supabase 操作
│   │   ├── client.ts           # クライアント初期化（ブラウザ用）
│   │   ├── server.ts           # サーバーサイド用クライアント
│   │   ├── queries/            # データ取得（SELECT）
│   │   │   ├── games.ts
│   │   │   ├── lineups.ts
│   │   │   ├── plateAppearances.ts
│   │   │   └── baseEvents.ts
│   │   └── mutations/          # データ更新（INSERT/UPDATE/DELETE）
│   │       ├── games.ts
│   │       ├── lineups.ts
│   │       ├── plateAppearances.ts
│   │       ├── pitches.ts
│   │       └── baseEvents.ts
│   ├── stats/                  # 成績計算ロジック
│   │   ├── battingStats.ts     # 打者成績計算
│   │   └── pitchingStats.ts    # 投手成績計算
│   ├── sync/                   # オフライン同期
│   │   └── offlineSync.ts      # IndexedDB操作キュー管理
│   └── utils/                  # 汎用ユーティリティ
│       ├── formatters.ts       # 成績フォーマット（打率3桁等）
│       └── scoreHelpers.ts     # スコア計算補助
│
├── types/                      # TypeScript型定義
│   ├── game.ts                 # Game, Lineup, Inning
│   ├── score.ts                # PlateAppearance, Pitch, BaseEvent
│   └── stats.ts                # BattingStats, PitchingStats
│
├── hooks/                      # カスタムReact Hooks
│   ├── useGameData.ts          # 試合データ取得
│   ├── useScoreInput.ts        # スコア入力操作
│   └── useOfflineSync.ts       # オフライン同期状態
│
├── tests/                      # テストコード
│   ├── unit/                   # ユニットテスト（Vitest）
│   │   ├── lib/
│   │   │   ├── stats/
│   │   │   │   ├── battingStats.test.ts
│   │   │   │   └── pitchingStats.test.ts
│   │   │   └── sync/
│   │   │       └── offlineSync.test.ts
│   │   └── store/
│   │       └── scoreStore.test.ts
│   ├── integration/            # 統合テスト（Vitest + testing-library）
│   │   ├── score-input.test.tsx
│   │   ├── undo-flow.test.tsx
│   │   └── substitution.test.tsx
│   └── e2e/                    # E2Eテスト（Playwright）
│       ├── game-flow.spec.ts   # 試合設定〜スコア入力〜成績確認
│       ├── offline-sync.spec.ts # オフライン→同期
│       └── print-view.spec.ts  # 印刷ビュー
│
├── public/                     # 静的ファイル
│   ├── icons/                  # PWAアイコン（192x192, 512x512等）
│   └── manifest.json           # PWAマニフェスト
│
├── supabase/                   # Supabase関連設定
│   └── migrations/             # DBマイグレーションSQL
│       ├── 001_create_games.sql
│       ├── 002_create_lineups.sql
│       ├── 003_create_innings.sql
│       ├── 004_create_plate_appearances.sql
│       ├── 005_create_pitches.sql
│       ├── 006_create_base_events.sql
│       └── 007_create_rls_policies.sql
│
├── docs/                       # プロジェクトドキュメント
│   ├── ideas/                  # アイデア・壁打ちメモ
│   │   └── initial-requirements.md
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
├── next.config.ts              # Next.js設定（Serwist PWA含む）
├── tsconfig.json               # TypeScript設定
├── eslint.config.mjs           # ESLint設定
├── postcss.config.mjs          # PostCSS設定（Tailwind用）
├── vitest.config.mts           # Vitest設定
├── playwright.config.ts        # Playwright設定
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
- `scorebook/`: スコアブックUI専用コンポーネント（SVGダイヤモンド描画等）
- `input/`: スコア入力パネル群（BottomSheet形式）
- `stats/`: 成績テーブル表示
- `game/`: 試合設定・一覧UI
- `ui/`: shadcn/uiベースの汎用UIプリミティブ

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
- `scoreStore.ts`: 現在イニング・アウト数・塁上走者・Undoスタック・入力中打席
- `gameStore.ts`: 試合ID・チーム情報・ゲームステータス
- `lineupStore.ts`: 両チームのラインナップ・現在打者インデックス

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
export function calcBattingStats(
  plateAppearances: PlateAppearance[],
  baseEvents: BaseEvent[]
): BattingStats { ... }
```

#### lib/sync/
オフライン操作キューのIndexedDB管理。Service WorkerとメインスレッドからアクセスするAPIを提供。

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
- `game.ts`: `Game`, `Lineup`, `Inning`, `GameStatus`, `SubstitutionType` 等
- `score.ts`: `PlateAppearance`, `PlateResult`, `Pitch`, `PitchType`, `BaseEvent`, `BaseEventType` 等
- `stats.ts`: `BattingStats`, `PitchingStats` 等

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
- `useGameData.ts`: Supabaseから試合データを取得・キャッシュ
- `useScoreInput.ts`: スコア入力操作のラッパー（store + mutation）
- `useOfflineSync.ts`: オフライン状態の監視と同期トリガー

**命名規則**:
- ファイル名: camelCase + `use` プレフィックス（`useGameData.ts`）

**依存関係**:
- 依存可能: `store/`, `lib/`, `types/`
- 禁止: `app/`（ページ固有ロジックの混入防止）

---

### tests/ (テストコード)

**役割**: ユニット・統合・E2Eの3層テストを配置。

**構造の対応関係**:

```
tests/unit/lib/stats/battingStats.test.ts
         ↕ 対応
lib/stats/battingStats.ts
```

**命名規則**:
- ユニット・統合テスト: `[対象ファイル名].test.ts` / `.test.tsx`
- E2Eテスト: `[シナリオ名].spec.ts`

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
| `next.config.ts` | Next.js設定（Serwistプラグイン含む） |
| `tsconfig.json` | TypeScript設定（パスエイリアス `@/` を設定） |
| `vitest.config.mts` | Vitest設定（jsdom環境、カバレッジ設定） |
| `playwright.config.ts` | Playwright設定（iPad viewportプリセット） |
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
