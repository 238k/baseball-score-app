# 技術仕様書 (Architecture Design Document)

## テクノロジースタック

### 言語・ランタイム

| 技術 | バージョン | 選定理由 |
|------|-----------|----------|
| Node.js | v24.13.1 | プロジェクト標準。LTS版で安定性が高い |
| TypeScript | 5.x | スコアブックデータの複雑な型（打席結果・塁間イベント等）をコンパイル時に検証できる。IDEサポートでタブレット向けUIコンポーネントの補完が強力 |
| npm | 11.x | Node.js 24に同梱。package-lock.jsonで依存関係を厳密管理 |

### フレームワーク・ライブラリ

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Next.js | 16.x (App Router) | フルスタックWebフレームワーク | App RouterによるSSR/CSRの柔軟な切り替え。`/games/[id]/print` の印刷専用ページを静的生成しやすい。Server Actionsでデータ取得を整理しやすい |
| React | 19.x | UIライブラリ | Next.js 16の依存。Concurrent Features でスコア入力のレスポンスを向上 |
| Tailwind CSS | 4.x | スタイリング | タブレット向けレスポンシブデザインをユーティリティクラスで素早く実装。印刷専用スタイル（`print:`修飾子）が標準対応 |
| shadcn/ui | 最新 | UIコンポーネントライブラリ | Radix UIベースのアクセシブルなコンポーネント。Button・Input・Label 等を `components/ui/` で管理。`components.json` で設定 |
| class-variance-authority | 最新 | コンポーネントバリアント管理 | shadcn/ui の Button 等で使用。variant/size のクラス合成を型安全に行う |
| clsx + tailwind-merge | 最新 | クラス合成ユーティリティ | `cn()` 関数（`lib/utils.ts`）として提供。Tailwind クラスの競合を解決してマージする |
| Zustand | 5.x | クライアント状態管理 | スコア入力状態・Undo履歴管理に特化したシンプルなAPIを提供。Redux比で学習コストが低く、スナップショットベースのUndoを簡潔に実装できる |
| Supabase JS | 2.x | Supabase クライアント | PostgreSQL・Auth・RLSをJavaScriptから操作するための公式クライアント。リアルタイムサブスクリプションも提供 |
| Serwist | 9.x | PWA / Service Worker | Next.js向けのSerwistインテグレーションでService Worker管理。WorkboxベースでキャッシュストラテジーとバックグラウンドSyncを設定できる |

### バックエンド・インフラ

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| Supabase (PostgreSQL) | データ永続化 | マネージドPostgreSQLで運用コストゼロ。RLSをSQLレベルで設定でき、`user_id` ベースのマルチテナント分離が容易 |
| Supabase Auth | 認証 | メール/パスワード・OAuth（Google等）をSaaS提供。JWTトークンがRLSと連携し、別途認証サーバーが不要 |
| Supabase Row Level Security | アクセス制御 | `auth.uid()` をSQLポリシーに組み込むことで、APIレイヤーで制御漏れがあってもDBレベルで保護される |
| Vercel | ホスティング | Next.jsのEdge RuntimeとISRに最適化。PWAのService Workerも正常に配信できる |

### 開発ツール

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Vitest | 3.x | ユニット・統合テスト | Viteベースで高速。成績計算ロジックやZustand Storeのテストに最適。TypeScriptのネイティブサポート |
| Playwright | 1.x | E2Eテスト | タブレット向けタッチ操作のエミュレーションが可能。印刷ビューのレイアウト確認も自動化できる |
| ESLint | 9.x | Linting | Next.jsの推奨設定 + TypeScript strict モードで品質担保 |
| Prettier | 3.x | コードフォーマット | チームでのコードスタイル統一 |
| Husky | 9.x | Git hooks | コミット前にlint・型チェックを実行し、品質ゲートを設ける |

---

## アーキテクチャパターン

### レイヤードアーキテクチャ（Webアプリ向け）

```
┌──────────────────────────────────────────┐
│   Presentation Layer                      │
│   Next.js Pages / React Components       │  ← ユーザー入力の受付・表示
│   Zustand Store（状態管理・Undo）         │
├──────────────────────────────────────────┤
│   Application Layer                       │
│   lib/stats/ （成績計算ロジック）          │  ← ビジネスロジック
│   lib/sync/ （オフライン同期ロジック）     │
├──────────────────────────────────────────┤
│   Infrastructure Layer                    │
│   lib/supabase/ （DB操作）               │  ← データ永続化・外部通信
│   Service Worker / IndexedDB            │
└──────────────────────────────────────────┘
```

#### Presentation Layer（UI・状態）
- **責務**: React コンポーネントによる画面表示、Zustand Storeの状態読み取り・アクション呼び出し
- **許可される操作**: Application Layerの関数呼び出し、Zustand Storeの操作
- **禁止される操作**: Supabaseクライアントへの直接アクセス（必ずlib/supabase/経由）

#### Application Layer（ビジネスロジック）
- **責務**: 成績計算（打率・ERA等）、Undo履歴管理、オフライン同期キューの管理
- **許可される操作**: Infrastructure Layerの呼び出し
- **禁止される操作**: Reactコンポーネントへの依存

#### Infrastructure Layer（データ・外部通信）
- **責務**: Supabaseへのデータ取得・保存、IndexedDBへのオフラインキャッシュ、Service Worker管理
- **禁止される操作**: ビジネスロジックの実装

---

## データ永続化戦略

### ストレージ方式

| データ種別 | ストレージ | フォーマット | 理由 |
|-----------|----------|-------------|------|
| 試合データ（全テーブル） | Supabase PostgreSQL | リレーショナル | 複雑な関連クエリ（打席→走者→得点集計）に適合。RLSで安全に分離 |
| オフライン操作キュー | IndexedDB | JSON（操作ログ形式） | Service Workerからアクセス可能。大量書き込みでもメインスレッドをブロックしない |
| Undo履歴 | Zustand Store（メモリ） | TypeScriptオブジェクト | 試合中のみ必要なデータ。セッションを越えて保持する必要がない |
| PWAキャッシュ | Cache API | HTTPレスポンスキャッシュ | Next.js静的アセットの高速配信 |

### バックアップ戦略

- **方式**: Supabaseのマネージドバックアップ（無料プランで7日間保持）
- **頻度**: Supabaseが自動で日次バックアップを実行
- **オフラインキューの耐久性**: IndexedDBは永続的（ブラウザのデータクリアまで保持）。オンライン復帰時に同期
- **Undoの揮発性**: ページリロードでUndo履歴はリセット（設計仕様）

---

## パフォーマンス要件

### レスポンスタイム

| 操作 | 目標時間 | 測定環境 |
|------|---------|---------|
| 一球入力後の画面更新 | 200ms以内 | iPad Air (M1)、Wi-Fi接続 |
| 成績再計算（打席結果確定後） | 1秒以内 | 同上 |
| 試合一覧表示（100試合） | 3秒以内 | 同上 |
| PWAキャッシュ済みの初回ロード | 2秒以内 | オフライン環境 |
| 印刷ビュー表示 | 3秒以内 | 同上 |

### リソース使用量

| リソース | 上限 | 理由 |
|---------|------|------|
| JavaScript Bundle（初期） | 200KB gzip以下 | iPad上のブラウザで高速ロード |
| IndexedDB（オフラインキュー） | 50MB以下 | 1試合数百操作でも十分な容量 |
| Zustand Store（メモリ） | 10MB以下 | 試合1試合分のUndo履歴が上限 |

### 最適化方針

- **コード分割**: Next.jsのRoute-based code splittingで各ページを動的インポート
- **成績計算のメモ化**: `useMemo` でZustandの状態変化時のみ再計算
- **スコアシートの仮想化**: イニング数が多い場合（延長等）はwindowing（react-virtual等）でDOM削減
- **Supabaseクエリ最適化**: 打席・投球・塁間イベントをJOINで一括取得し、N+1を防止

---

## セキュリティアーキテクチャ

### データ保護

- **通信暗号化**: Supabase接続はすべてHTTPS/TLS 1.3
- **アクセス制御**: Supabase RLS（Row Level Security）をすべてのテーブルに設定。`auth.uid()` ベースで自分のデータのみアクセス可能
- **機密情報管理**:
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` は`.env.local`で管理
  - 既存環境との互換のため `NEXT_PUBLIC_SUPABASE_ANON_KEY` も許容
  - `SUPABASE_SERVICE_ROLE_KEY`（管理者権限）はサーバーサイドのみで使用し、クライアントバンドルに含めない
  - Vercelの環境変数機能で本番環境に設定

### 入力検証

- **バリデーション**: Zodスキーマでフォーム入力とSupabaseへの書き込みデータを型検証
- **サニタイゼーション**: 選手名・チーム名等のテキスト入力はNext.jsのデフォルトXSSエスケープに依存
- **エラーハンドリング**: RLSエラー（403相当）はユーザーフレンドリーなメッセージに変換し、詳細なエラーはクライアントに露出しない

### 認証フロー

```
1. ユーザーが Supabase Auth でログイン（メール/パスワード or Google OAuth）
2. Supabase が JWT を発行（有効期限: 1時間、リフレッシュトークン: 60日）
3. Supabase クライアントが JWT を自動リフレッシュ
4. すべてのDB操作に JWT を付与 → RLS が auth.uid() で検証
5. セッション切れは Supabase クライアントが自動検知 → ログイン画面へリダイレクト
```

---

## スケーラビリティ設計

### データ増加への対応

- **想定データ量**: 1ユーザーあたり年間30試合、5年で150試合・約150,000打席
- **PostgreSQL インデックス**:
  - `games(user_id)` - 試合一覧クエリ
  - `plate_appearances(game_id, inning_id)` - スコアシート表示クエリ
  - `base_events(plate_appearance_id)` - 得点集計クエリ
- **ページネーション**: 試合一覧は20件ずつ取得（無限スクロール）

### 機能拡張性

- **複数人同時記録（Post-MVP）**: Supabase Realtimeのサブスクリプションを追加するだけで対応可能
- **選手マスター（Post-MVP）**: `players` テーブルと `lineups` テーブルを外部キーで結合するマイグレーションを追加
- **エクスポート（Post-MVP）**: Next.js API Route でCSV/PDF生成エンドポイントを追加

---

## テスト戦略

### ユニットテスト（Vitest）

- **対象**: `lib/stats/battingStats.ts`, `lib/stats/pitchingStats.ts`（成績計算ロジック）
- **対象**: Zustand Store（`scoreStore.ts`）の各アクション
- **対象**: `lib/sync/offlineSync.ts`（操作キュー管理）
- **カバレッジ目標**: 成績計算ロジック 90%以上

### 統合テスト（Vitest + @testing-library/react）

- **対象**: スコア入力フロー（一球入力 → 打席結果 → 走者進塁 → 次打者）
- **対象**: Undo操作（複数操作後の連続Undo）
- **対象**: 選手交代後の打順・成績の正確な帰属

### E2Eテスト（Playwright）

- **シナリオ1**: 試合設定 → 先発オーダー登録 → 1打席入力 → 成績確認
- **シナリオ2**: ネットワーク切断 → スコア入力 → オンライン復帰 → Supabase同期確認
- **シナリオ3**: 印刷ビューの表示・レイアウト確認（iPad viewportで）
- **デバイスエミュレーション**: Playwright の `iPad (gen 6)` プリセットを使用

---

## 技術的制約

### 環境要件

- **対応ブラウザ**: Safari (iPadOS 16+), Chrome (iOS/Android), Firefox（最新版）
- **必須機能**: Service Worker対応（PWA）、IndexedDB対応
- **最小画面サイズ**: 768px幅（iPad mini相当）以上を想定。スマートフォン（375px）は非保証だが基本動作は確認する

### パフォーマンス制約

- Supabaseの無料プランは同時接続数60、API制限あり。同時記録は1ユーザー想定のため問題なし
- Service Workerの登録はHTTPS環境（またはlocalhost）のみ有効

### セキュリティ制約

- Supabase Anon Keyはクライアントサイドに露出するが、RLSで保護されているため問題なし
- Service Role Keyは絶対にクライアントバンドルに含めない

---

## 依存関係管理

| ライブラリ | 用途 | バージョン管理方針 |
|-----------|------|-------------------|
| next | フレームワーク | `^16.0.0`（マイナーまで自動） |
| react / react-dom | UIライブラリ | `^19.0.0` |
| @supabase/supabase-js | Supabaseクライアント | `^2.0.0` |
| zustand | 状態管理 | `^5.0.0` |
| tailwindcss | スタイリング | `^4.0.0` |
| zod | バリデーション | `^4.0.0` |
| class-variance-authority | shadcn/ui バリアント管理 | 最新 |
| clsx | クラス合成 | 最新 |
| tailwind-merge | Tailwind クラスマージ | 最新 |
| lucide-react | アイコンライブラリ | 最新 |
| @radix-ui/react-slot | shadcn/ui asChild 実装 | 最新 |
| @radix-ui/react-label | shadcn/ui Label 実装 | 最新 |
| vitest | テスト | `^4.0.0`（マイナーまで自動） |
| typescript | 型チェック | `~5.0.0`（パッチのみ自動） |
| eslint | Linting | `^9.0.0` |

### 更新方針

- セキュリティパッチは即時適用
- メジャーバージョンアップは移行コストを評価してから適用（特にNext.js・Supabase）
- Dependabotまたはnpm auditで定期的な脆弱性チェック
