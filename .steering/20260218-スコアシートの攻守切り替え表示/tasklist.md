# タスクリスト: スコアシートの攻守切り替え表示

## Phase 1: ScoreInputPage.tsx の修正

- [x] `viewingSide` state を追加（デフォルト: `attackingSide`）
- [x] `attackingSide` 変化時に `viewingSide` をリセットする `useEffect` を追加
- [x] `viewingLineup` を `useMemo` で計算（viewingSide に基づく）
- [x] チーム切り替えトグルボタン UI を左ペイン上部に追加
- [x] ScoreSheet に `viewingSide` / `viewingLineup` を渡すよう変更

## 実装後の振り返り

**実装完了日**: 2026-02-18

**計画と実績の差分**:
- `viewingLineup` の useMemo に `viewingSide === attackingSide` のショートカット最適化を追加（design.md にはなかった改善）
- implementation-validator の指摘でトグルボタンに `min-h-[36px]` と `aria-pressed` を追加

**学んだこと**:
- ScoreSheet の `attackingSide` prop に閲覧チームの値を渡すだけで、内部の `isAttacking = currentTopBottom === sideTopBottom` ロジックが自動的に非攻撃チームのハイライトを消してくれる。既存コンポーネントの設計が柔軟で変更が不要だった
- 「デフォルト値をもつ state + 外部値変化時のリセット useEffect」パターンは攻守交代連動に有効

**テスト**: 全103テスト通過。lint・型チェックともにエラーなし。

**次回への改善提案**:
- ScoreInputPage の統合テストを追加し、トグル切り替えと攻守交代時の自動リセットを自動検証できるようにする
