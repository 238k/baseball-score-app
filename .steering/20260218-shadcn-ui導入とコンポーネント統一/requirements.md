# 要求: shadcn/ui 導入とコンポーネント統一

## 問題

現在の UI はスクラッチで実装しており、見た目の統一感が不足している。
shadcn/ui を導入してデザインシステムを統一する。

## 要求事項

- `npx shadcn@latest init` で初期化（Tailwind CSS v4 対応）
- 主要ボタンが shadcn `Button` コンポーネントに統一される
- フォーム系入力が shadcn `Input` / `Label` に統一される
- スコアシート（`ScoreCell` / `Diamond`）は独自実装のため対象外
- 既存の98件のテストがすべて通過する

## 対象コンポーネント（優先度順）

1. ボタン（投球入力・結果入力・試合作成フォーム）→ `Button`
2. フォーム入力（チーム情報・ラインナップ・ログイン・サインアップ）→ `Input` + `Label`
3. ログ一覧 → `Table`（後続フェーズ）
4. モーダル → `Dialog` / `Sheet`（後続フェーズ）

## 技術制約

- Tailwind CSS v4 を使用しているため、shadcn init の設定が通常と異なる
- `components.json` に `style: "default"`, `tailwind.cssVariables: true` を設定する
- カラーは既存の zinc 系統を維持しつつ shadcn のデフォルトテーマに合わせる
