# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

---

## フェーズ1: 依存パッケージの除去

- [x] `@serwist/next` と `serwist` を package.json から削除し、npm install を実行
- [x] `app/sw.ts` を削除（Serwist TypeScript ソース）
- [x] `app/serwist.ts` を削除（Serwist Provider re-export）

## フェーズ2: Next.js 標準 PWA 実装

- [x] `app/manifest.ts` を作成（`public/manifest.json` の内容を移植）
- [x] `public/manifest.json` を削除
- [x] `public/sw.js` を静的な手書き Service Worker に置き換え
  - Cache First でアプリシェルをキャッシュ
  - オフライン時は `/offline` にフォールバック
- [x] `app/offline/page.tsx` を作成（`app/~offline/page.tsx` のコードを移植）
- [x] `app/~offline/` ディレクトリを削除

## フェーズ3: layout.tsx とビルド設定の更新

- [x] `app/layout.tsx` を更新
  - `SerwistProvider` を削除
  - `<link rel="manifest" href="/manifest.json" />` を削除（app/manifest.ts が自動で処理）
  - SW 登録の useEffect をクライアントコンポーネントで追加（または inline script）
- [x] `next.config.ts` を更新
  - `withSerwist` ラッパーを削除
  - `@serwist/next` import を削除
  - シンプルな `nextConfig` のみにする
- [x] `package.json` のビルドスクリプトを `next build` に戻す（`--webpack` 不要）

## フェーズ4: 品質チェック

- [x] TypeScript エラーがないことを確認
  - [x] `npm run type-check`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] ビルドが成功することを確認
  - [x] `npm run build`

---

## 実装後の振り返り

### 実装完了日
2026-02-17

### 計画と実績の差分

**計画と異なった点**:
- `app/manifest.ts` の `purpose` フィールドは `"any maskable"` の複合値が型エラーになる。Next.js の型定義は `"any" | "maskable" | "monochrome"` のみ許容するため、同一アイコンを2エントリに分けて対応した。
- SW 登録は layout.tsx に直書きせず `app/sw-register.tsx` クライアントコンポーネントとして切り出した（layout.tsx をサーバーコンポーネントとして保つため）。

**新たに必要になったタスク**:
- `.next` キャッシュの旧 `~offline` 型参照が残っていたため、`rm -rf .next` を実行してから `npm run build` を実行。

### 学んだこと

- Next.js 16 は Turbopack がデフォルト。`@serwist/next` のような webpack 専用プラグインは根本的に非互換。
- `app/manifest.ts` は Next.js App Router の標準ファイルで、`/manifest.webmanifest` として自動配信される（`public/manifest.json` が不要になる）。
- manifest の `icons[].purpose` は Next.js 型定義で単値のみ受け付ける（`"any maskable"` は不可）。
