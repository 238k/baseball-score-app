# 設計: shadcn/ui 導入とコンポーネント統一

## 初期化方針

### components.json の手動設定

Tailwind CSS v4 環境では `npx shadcn@latest init` の対話ウィザードが
v3 向けに動作するため、`components.json` を手動作成し
必要なコンポーネントを個別に add する。

### CSS 変数の追加

`app/globals.css` に shadcn 用の CSS 変数（`:root` のカラートークン）を追加。
既存の `--background` / `--foreground` は維持。

## コンポーネント置き換え方針

### Button コンポーネント

shadcn の `Button` は `variant` と `size` props を持つ。
投球・結果ボタンは色をカスタムで指定するため `asChild` は使わず、
`className` で Tailwind クラスを上書きする。

### Input / Label コンポーネント

TeamInfoSection、LineupSection、ログイン・サインアップページの
`<input>` と `<label>` を shadcn の `Input` / `Label` に置き換え。

## ファイル変更一覧

| ファイル | 変更内容 |
|---|---|
| `components.json` | 新規作成（shadcn 設定） |
| `lib/utils.ts` | 新規作成（cn ユーティリティ） |
| `app/globals.css` | CSS 変数追加 |
| `components/ui/button.tsx` | shadcn Button コンポーネント |
| `components/ui/input.tsx` | shadcn Input コンポーネント |
| `components/ui/label.tsx` | shadcn Label コンポーネント |
| `components/score-input/PitchInputPanel.tsx` | Button 使用 |
| `components/score-input/ResultInputPanel.tsx` | Button 使用 |
| `components/score-input/ScoreInputPage.tsx` | Button 使用（Undo等） |
| `components/game-setup/TeamInfoSection.tsx` | Input + Label 使用 |
| `components/game-setup/GameSetupForm.tsx` | Button 使用 |
| `app/(auth)/login/page.tsx` | Input + Label + Button 使用 |
| `app/(auth)/signup/page.tsx` | Input + Label + Button 使用 |
