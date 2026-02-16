# 開発ガイドライン (Development Guidelines)

## 基本原則

1. **型安全を最優先**: `any` 型を使わない。不明な型は `unknown` から絞り込む
2. **UI とロジックを分離**: ビジネスロジックはコンポーネントに書かず `lib/` に置く
3. **テストを書く**: 成績計算・Undo・同期ロジックは必ずユニットテストを書く
4. **コメントは「なぜ」を書く**: コードを読めばわかる「何を」は書かない

---

## コーディング規約

### 命名規則

| 種別 | 規則 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `calcBattingAverage`, `currentBatter` |
| Reactコンポーネント | PascalCase | `ScoreCell`, `PitchInputPanel` |
| インターフェース | PascalCase（`I` プレフィックスなし） | `PlateAppearance`, `BattingStats` |
| 型エイリアス（Union等） | PascalCase | `PlateResult`, `PitchType` |
| 定数 | UPPER_SNAKE_CASE | `MAX_UNDO_HISTORY`, `FIELDING_POSITIONS` |
| Zustand Store | camelCase + `Store` | `scoreStore`, `gameStore` |
| カスタムHooks | `use` + PascalCase | `useScoreInput`, `useGameData` |
| Boolean変数 | `is` / `has` / `can` で始める | `isOnline`, `hasError`, `canUndo` |
| イベントハンドラ | `handle` + イベント名 | `handlePitchInput`, `handleUndo` |

### TypeScript 規約

**`any` の禁止**:
```typescript
// ✅ 良い例: unknown から型を絞り込む
function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// ❌ 悪い例
function handleError(error: any): void {
  console.error(error.message); // 型チェックが効かない
}
```

**型定義の使い分け**:
```typescript
// interface: 拡張可能なオブジェクト型
interface Game {
  id: string;
  homeTeamName: string;
  status: GameStatus;
}

// 型エイリアス: Union型・プリミティブ型
type GameStatus = 'in_progress' | 'completed';
type FieldingPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // 10=指名打者(DH)
```

**型定義の集約**: すべての共有型は `types/` ディレクトリに置き、インラインで型を定義しない。

```typescript
// ✅ 良い例: types/ から import
import type { PlateAppearance, PlateResult } from '@/types/score';

// ❌ 悪い例: コンポーネント内でインライン定義
type Result = 'single' | 'double'; // types/ に書くべき
```

### Reactコンポーネント規約

**関数コンポーネントのみ使用**（クラスコンポーネント禁止）:

```typescript
// ✅ 良い例: Props型を明示し、export はコンポーネント定義と分離
interface ScoreCellProps {
  plateAppearance: PlateAppearance | null;
  isCurrentBatter: boolean;
  onClick: () => void;
}

export function ScoreCell({ plateAppearance, isCurrentBatter, onClick }: ScoreCellProps) {
  return (
    <div
      className={cn('score-cell', isCurrentBatter && 'bg-blue-100')}
      onClick={onClick}
    >
      {/* ... */}
    </div>
  );
}
```

**`useMemo` / `useCallback` の使用基準**:
- 成績計算等の重い計算 → `useMemo`
- 子コンポーネントに渡すハンドラ（re-render最適化が必要な場合）→ `useCallback`
- 単純な変数・軽い計算 → なにもしない（過剰最適化を避ける）

```typescript
// ✅ 成績計算はメモ化（打席更新のたびに再計算されるのを防ぐ）
const battingStats = useMemo(
  () => calcBattingStats(plateAppearances, baseEvents),
  [plateAppearances, baseEvents]
);
```

### Zustand Store 規約

**Store内でのSupabase呼び出し**は非同期アクションとして定義し、エラー処理を必ず行う:

```typescript
// store/scoreStore.ts
recordResult: async (result, extras) => {
  // 1. ローカル状態を即時更新（楽観的更新）
  set((state) => ({
    activePlateAppearance: { ...state.activePlateAppearance, result },
  }));

  // 2. Supabaseに非同期保存（失敗してもローカルは維持）
  try {
    await insertPlateAppearance({ result, ...extras });
  } catch (error) {
    // オフラインキューに積む
    await enqueueOfflineOperation({ type: 'insert', table: 'plate_appearances', payload: extras });
  }
},
```

### Server Components / Client Components の使い分け

| 使用場面 | Component種別 |
|---------|--------------|
| Supabaseからデータ取得（初期表示） | Server Component（`async` 関数） |
| ユーザー操作・イベントハンドラ | Client Component（`'use client'`） |
| Zustand Storeを使う | Client Component |
| shadcn/uiコンポーネントを使う | Client Component |
| 印刷ビュー（静的表示のみ） | Server Component |

```typescript
// app/games/[id]/page.tsx - 初期データ取得はServer Componentで
import { getGameById } from '@/lib/supabase/queries/games';

export default async function ScorePage({ params }: { params: { id: string } }) {
  const game = await getGameById(params.id); // サーバーサイドで取得
  return <ScoreSheet game={game} />; // Client Componentに渡す
}
```

### エラーハンドリング

**Supabaseエラーのハンドリング**:
```typescript
// lib/supabase/queries/games.ts
export async function getGameById(id: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // RLS違反（406）は静かにnullを返す
    if (error.code === 'PGRST116') return null;
    // 予期しないエラーは上位に投げる
    throw new Error(`試合データの取得に失敗しました: ${error.message}`);
  }

  return data;
}
```

**Zodによる入力バリデーション**:
```typescript
import { z } from 'zod';

const CreateGameSchema = z.object({
  homeTeamName: z.string().min(1).max(50),
  awayTeamName: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  venue: z.string().max(100).optional(),
});

export function validateCreateGame(input: unknown) {
  return CreateGameSchema.parse(input); // 失敗時はZodErrorをスロー
}
```

### コメント規約

**「なぜ」を書く**:
```typescript
// ✅ 良い例: 意図を説明
// NPBルール: 犠打・犠飛・四球・死球は打数にカウントしない
const atBats = plateAppearances.filter(
  (pa) => !['犠打', '犠飛', '四球', '死球'].includes(pa.result!)
).length;

// ❌ 悪い例: コードの繰り返し
// plate_appearancesをフィルターして数える
const atBats = plateAppearances.filter(...).length;
```

**TSDocは公開APIのみに記述**（すべての関数に書く必要はない）:
```typescript
/**
 * 打者の打率を計算する。打数0の場合は0.000を返す。
 * @param hits - 安打数
 * @param atBats - 打数（四球・死球・犠打・犠飛を除く）
 */
export function calcBattingAverage(hits: number, atBats: number): number {
  if (atBats === 0) return 0;
  return Math.round((hits / atBats) * 1000) / 1000;
}
```

---

## Git 運用ルール

### ブランチ戦略

```
main          ─── 本番環境（Vercelに自動デプロイ）
  └─ develop  ─── 開発統合ブランチ
      ├─ feature/score-input    # 新機能
      ├─ fix/undo-bug           # バグ修正
      └─ refactor/stats-calc    # リファクタリング
```

**ブランチ命名規則**: `[type]/[kebab-case-description]`

| type | 用途 |
|------|------|
| `feature/` | 新機能開発 |
| `fix/` | バグ修正 |
| `refactor/` | リファクタリング |
| `docs/` | ドキュメント更新 |
| `chore/` | 設定・依存関係等 |

### コミットメッセージ規約（Conventional Commits）

```
<type>(<scope>): <subject>

<body>（オプション）

<footer>（オプション）
```

**type 一覧**:
| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | フォーマット（動作に影響しない） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド・依存関係・設定 |

**scope 例**: `score`, `stats`, `lineup`, `sync`, `auth`, `print`

**例**:
```
feat(score): 打席結果入力後に走者進塁パネルを表示する

打球結果が確定した後、塁上に走者がいる場合は
走者進塁パネルを自動で表示するようにした。
走者がいない場合はスキップして次打者に移行する。

Closes #42
```

### PRプロセス

**作成前チェックリスト**:
- [ ] `npm run test` がすべてパス
- [ ] `npm run lint` にエラーなし
- [ ] `npm run type-check` にエラーなし
- [ ] 手動でタブレット（iPad Safari）動作確認済み

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明（1〜3文）]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加/修正
- [ ] 統合テスト追加/修正
- [ ] タブレット（iPad Safari）で手動確認

## スクリーンショット
[UIを変更した場合は before/after を貼る]

## 関連Issue
Closes #[番号]
```

---

## テスト戦略

### テストピラミッド

```
      E2E (少数・重要フローのみ)
     /  Playwright - iPad viewport
    ─────────────────────────────
   Integration (主要フロー)
  /  Vitest + @testing-library/react
 ─────────────────────────────────────
Unit (多数・ロジック中心)
  Vitest - lib/stats/, store/, lib/sync/
```

### ユニットテスト

**対象**: `lib/stats/`, `store/`, `lib/sync/`
**カバレッジ目標**: `lib/stats/` は90%以上

**テスト構造（Given-When-Then）**:
```typescript
// tests/unit/lib/stats/battingStats.test.ts
describe('calcBattingAverage', () => {
  it('安打3本・打数10の場合は0.300を返す', () => {
    // Given
    const hits = 3;
    const atBats = 10;

    // When
    const result = calcBattingAverage(hits, atBats);

    // Then
    expect(result).toBe(0.3);
  });

  it('打数0の場合は0.000を返す（ゼロ除算を避ける）', () => {
    expect(calcBattingAverage(0, 0)).toBe(0);
  });
});
```

**Zustand Storeのテスト**:
```typescript
// tests/unit/store/scoreStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useScoreStore } from '@/store/scoreStore';

describe('scoreStore', () => {
  it('undo() が直前の状態に戻す', () => {
    const { result } = renderHook(() => useScoreStore());

    act(() => result.current.recordPitch('ball'));
    act(() => result.current.recordPitch('ball'));
    expect(result.current.pitches).toHaveLength(2);

    act(() => result.current.undo());
    expect(result.current.pitches).toHaveLength(1);
  });
});
```

### 統合テスト

**対象**: スコア入力フロー、Undo、選手交代

```typescript
// tests/integration/score-input.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';

describe('スコア入力フロー', () => {
  it('ボール4球で四球になり次打者に移行する', async () => {
    render(<ScoreInputPage gameId="test-game" />);

    // 4球ボールを入力
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('B'));
    }

    // 打席結果が「四球」で確定される
    expect(screen.getByText('四球')).toBeInTheDocument();
  });
});
```

### E2Eテスト

**対象**: 主要ユーザーフロー（最低限に絞る）
**デバイス**: `iPad (gen 6)` viewport を使用

```typescript
// tests/e2e/game-flow.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPad (gen 6)'] });

test('試合設定 → スコア入力 → 成績確認の基本フロー', async ({ page }) => {
  await page.goto('/games/new');
  await page.fill('[name="homeTeamName"]', '読売ジャイアンツ');
  // ...
  await page.click('text=試合開始');
  await expect(page).toHaveURL(/\/games\/.+/);
});
```

### モックの方針

- **Supabase**: `vi.mock('@/lib/supabase/client')` でモック化
- **IndexedDB**: `fake-indexeddb` ライブラリを使用
- **ビジネスロジック（`lib/stats/`）**: モック化せずに実実装を使用

---

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] PRDの受け入れ条件を満たしているか
- [ ] NPBスコアブックの仕様に準拠しているか
- [ ] エラーケース（オフライン・RLSエラー）が考慮されているか

**型安全性**:
- [ ] `any` 型が使われていないか
- [ ] Supabaseのレスポンス型が適切に処理されているか
- [ ] `null` / `undefined` の可能性がある箇所でガードされているか

**パフォーマンス**:
- [ ] 成績計算に `useMemo` が使われているか
- [ ] Supabaseクエリでのselect過多（`select('*')` のまま放置）がないか
- [ ] SVGのダイヤモンド描画がre-renderで無駄に再計算されていないか

**セキュリティ**:
- [ ] 環境変数をクライアントバンドルに含めていないか（`SUPABASE_SERVICE_ROLE_KEY` 等）
- [ ] ユーザー入力（チーム名・選手名）がRLSで保護されているか

### レビューコメントのフォーマット

```markdown
[必須] 打率計算でゼロ除算が発生します。打数0の場合のガードが必要です。

[推奨] この成績計算は毎レンダーで実行されます。useMemoでメモ化を検討してください。

[提案] FieldingPositionをliteral union typeにすると、定義外の値を型レベルで防げます。

[質問] この走者IDの管理方法はlineupIdを使う想定でしょうか？
```

---

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24.13.1 | [nodejs.org](https://nodejs.org) or nodenv |
| npm | 11.x | Node.jsに同梱 |
| Supabase CLI | 最新 | `npm install -g supabase` |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd baseball-score-app

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env.local
# .env.local を編集（Supabase URL・Anon Key を設定）

# 4. Supabase マイグレーションの実行（ローカル開発時）
supabase start
supabase db push

# 5. 開発サーバーの起動
npm run dev
```

### npm スクリプト一覧

| コマンド | 内容 |
|---------|------|
| `npm run dev` | 開発サーバー起動（localhost:3000） |
| `npm run build` | 本番ビルド |
| `npm run test` | Vitestでユニット・統合テスト実行 |
| `npm run test:e2e` | Playwright E2Eテスト実行 |
| `npm run lint` | ESLint実行 |
| `npm run type-check` | TypeScript型チェックのみ（tsc --noEmit） |

### 推奨VS Code拡張機能

- **ESLint**: リアルタイムLintチェック
- **Prettier**: コードフォーマット
- **Tailwind CSS IntelliSense**: クラス名補完
- **TypeScript Importer**: 自動import

---

## 実装チェックリスト

機能実装完了前に以下を確認する:

### コード品質
- [ ] `any` 型を使っていない
- [ ] 関数が単一の責務を持っている
- [ ] マジックナンバーを定数化している
- [ ] 成績計算式がNPBルールに準拠している

### セキュリティ
- [ ] Supabase Service Role Keyをクライアントに渡していない
- [ ] ユーザー入力をZodで検証している

### パフォーマンス
- [ ] 成績再計算に `useMemo` を使っている
- [ ] Supabaseクエリで必要なカラムのみ `select` している

### テスト
- [ ] `lib/stats/` の変更にユニットテストを追加した
- [ ] `scoreStore` のUndoアクションが壊れていない（既存テストが通過）
- [ ] タブレット（iPad Safari）で手動動作確認した

### ドキュメント
- [ ] 公開APIにTSDocコメントを追加した
- [ ] NPBルール上の特殊な仕様にインラインコメントを付けた
