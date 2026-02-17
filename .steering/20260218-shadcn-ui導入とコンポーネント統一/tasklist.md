# タスクリスト: shadcn/ui 導入とコンポーネント統一

## タスク

### Phase 1: 初期化
- [x] `components.json` を作成（Tailwind v4 対応）
- [x] `lib/utils.ts` に cn ユーティリティを作成
- [x] shadcn 依存パッケージ（class-variance-authority, clsx, tailwind-merge, lucide-react）をインストール
- [x] `app/globals.css` に shadcn CSS 変数を追加

### Phase 2: shadcn コンポーネント追加
- [x] `components/ui/button.tsx` を作成
- [x] `components/ui/input.tsx` を作成
- [x] `components/ui/label.tsx` を作成

### Phase 3: Button への置き換え
- [x] `components/score-input/PitchInputPanel.tsx` — Button 使用に変更
- [x] `components/score-input/ResultInputPanel.tsx` — Button 使用に変更
- [x] `components/score-input/ScoreInputPage.tsx` — Undo ボタンを Button 使用に変更
- [x] `components/game-setup/GameSetupForm.tsx` — 試合開始ボタンを Button 使用に変更

### Phase 4: Input / Label への置き換え
- [x] `components/game-setup/TeamInfoSection.tsx` — Input + Label 使用に変更
- [x] `app/(auth)/login/page.tsx` — Input + Label + Button 使用に変更
- [x] `app/(auth)/signup/page.tsx` — Input + Label + Button 使用に変更

## 実装後の振り返り

- **実装完了日**: 2026-02-18
- **計画と実績の差分**:
  - `npx shadcn@latest init` は Tailwind v4 環境では期待通りに動作しないため、`components.json` を手動作成・各コンポーネントファイルも手書きで対応（計画通り）
  - `@radix-ui/react-slot`、`@radix-ui/react-label` をインストールが必要（計画では shadcn 依存としてまとめていた）
- **学んだこと**:
  - Tailwind CSS v4 では CSS 変数は `@theme inline {}` ブロックまたは `:root {}` に直接記述する。shadcn のデフォルト変数（`oklch` 形式）はそのまま `:root` に追加できる
  - shadcn `Button` は `className` の上書きが可能（CVA の `cn` によりマージされる）
  - Button のデフォルトスタイルと既存の細かいスタイルが競合することがあるため `variant="outline"` などを適切に選ぶことが重要
- **テスト**: 全98テスト通過。lint・typecheck ともにエラーなし。
- **次回への改善提案**:
  - Table・Dialog コンポーネントの追加（ScoreLog / SubstitutionPanel への適用）は次のフェーズとして issue を立てる
  - LineupSection の input（`<input>` 直書き）も後続で Input に置き換える
