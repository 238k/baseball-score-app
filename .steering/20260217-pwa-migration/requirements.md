# 要求内容

## 概要

`@serwist/next` を削除し、Next.js 公式推奨のシンプルな PWA 実装（静的 `public/sw.js` + `app/manifest.ts`）に移行する。

## 背景

Next.js 16 ではビルドがデフォルトで Turbopack を使用するが、`@serwist/next` は webpack 設定を必要とするため Turbopack と共存できない。Vercel へのデプロイが失敗していた。

Next.js 公式ドキュメントでも Serwist は「webpack 設定が必要」と明記されており、Turbopack との根本的な非互換がある。

## 実装対象の機能

### 1. PWA マニフェスト（Next.js 標準化）
- `public/manifest.json` を廃止
- `app/manifest.ts` に移行（Next.js App Router 標準）
- 既存の設定（name, icons, display: standalone, orientation: landscape 等）を維持

### 2. 静的 Service Worker
- `app/sw.ts`（Serwist TypeScript ソース）を廃止
- `public/sw.js` を静的な手書き JS に置き換え
- キャッシュ戦略: Cache First でアプリシェルをキャッシュ
- オフラインフォールバック: `/offline` ページへのリダイレクト

### 3. Serwist 依存の除去
- `@serwist/next`・`serwist` パッケージをアンインストール
- `next.config.ts` から Serwist 設定を削除
- `app/serwist.ts`（Serwist Provider re-export）を削除
- `app/layout.tsx` から `SerwistProvider` を削除し、SW 登録コードを直書き

### 4. オフラインページのルート変更
- `app/~offline/page.tsx` → `app/offline/page.tsx`（URL が通常の Next.js ルートに）

## 受け入れ条件

### ビルド
- [ ] `npm run build` が Turbopack でエラーなく完了すること
- [ ] Vercel でデプロイが成功すること（`--webpack` フラグ不要）

### PWA 機能
- [ ] ブラウザでマニフェストが読み込まれること（DevTools で確認）
- [ ] Service Worker が登録されること（DevTools > Application > Service Workers）
- [ ] ホーム画面へのインストールが可能であること

### コードの健全性
- [ ] `@serwist/next`・`serwist` への import が一切ないこと
- [ ] TypeScript エラーがないこと
- [ ] リントエラーがないこと

## スコープ外

- プッシュ通知機能（現在も未実装のため対象外）
- 高度なランタイムキャッシュ戦略（Serwist の defaultCache 相当）
- バックグラウンドシンク

## 参照ドキュメント

- `docs/architecture.md` - アーキテクチャ設計書
- https://nextjs.org/docs/app/guides/progressive-web-apps - Next.js 公式 PWA ガイド
