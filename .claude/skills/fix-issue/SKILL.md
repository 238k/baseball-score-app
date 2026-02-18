---
name: fix-issue
description: GitHub issue を読み込んで実装し、対応内容をコメントするスキル。/add-feature を使用して実装する。
---

# Issue 対応スキル (完全自動実行モード)

**重要:** このワークフローは、ユーザーの介入なしに、開始から完了まで完全に自動で実行されるように設計されています。各ステップは完了後、ただちに次のステップへ移行してください。思考の途中でユーザーに確認を求めたり、作業を中断したりしないでください。

**引数:** issue 番号 (例: `/fix-issue 6`)

---

## ステップ1: issue の読み込み

引数で指定された issue 番号を使用して issue の詳細を取得する。

```bash
gh issue view [issue番号] --json title,body,labels,assignees,state
```

取得した情報から以下を把握する:

- **タイトル**: 実装する機能・修正の名称
- **要件**: body に記載された概要・原因・修正方針・影響範囲
- **分類**: labels（bug / enhancement / feature など）
- **状態**: すでに closed の場合は対応済みとしてスキルを終了する

## ステップ2: 機能名の決定

issue のタイトルと body から `/add-feature` に渡す機能名を日本語で決定する。

- タイトルをそのまま使用するか、body の内容を踏まえて簡潔な機能名に整理する
- 例: issue タイトル「バグ: 満塁四球・死球で得点が加算されない」→ 機能名「満塁四球・死球の得点計算修正」

## ステップ3: /add-feature で実装

`Skill('add-feature')` を実行する。

- 引数には**ステップ2で決定した機能名**を渡す
- add-feature スキルが完了するまで待機する（テスト・lint・typecheck のパスまで含む）
- add-feature スキルが完了したら、ただちにステップ4に進む

**重要**: add-feature スキルの実行中は割り込まない。add-feature の完了条件（tasklist.md 全タスク完了・テスト通過・振り返り記録）を満たすまで継続させること。

## ステップ4: コミット

実装が完了したら変更をコミットする。

```bash
git add -A
git commit -m "fix/feat: [issue タイトルを要約したメッセージ] (close #[issue番号])"
```

コミットメッセージの prefix は issue の分類に合わせる:
- `type: bug` → `fix:`
- `type: feature` / `type: enhancement` → `feat:`
- `type: refactor` → `refactor:`
- `type: ui/ux` → `style:`

## ステップ5: issue へのコメント

以下のフォーマットで issue に対応内容をコメントする。

```bash
gh issue comment [issue番号] --body "$(cat <<'EOF'
## 対応完了

### 実装内容

[add-feature の実装内容を箇条書きで記述]
- 変更したファイルと変更内容
- 追加した機能・修正した動作

### 関連コミット

- `[コミットハッシュ]` [コミットメッセージ]

### テスト結果

- テスト: [件数] 件すべて通過
EOF
)"
```

## 完了条件

以下をすべて満たした時点で完了:

- [ ] add-feature による実装が完了している（tasklist.md 全タスク完了・テスト通過）
- [ ] 変更がコミットされている
- [ ] issue に対応内容のコメントが投稿されている
