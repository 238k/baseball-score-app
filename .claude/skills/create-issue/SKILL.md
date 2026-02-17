---
name: create-issue
description: GitHub issue を優先度・分類・担当者付きで作成するスキル。バグ報告・機能要望・改善提案などを構造化して登録する。
---

# GitHub Issue 作成スキル

issue の内容を整理し、優先度ラベル・分類ラベル・担当者を設定して `gh issue create` で登録します。

**引数:** issue のタイトルまたは説明（省略可。会話の文脈から読み取る）

---

## ラベル定義

### 優先度ラベル

| ラベル | 色 | 意味 |
|---|---|---|
| `priority: high` | `#d73a4a` | 即時対応が必要（バグ・重大な問題） |
| `priority: medium` | `#e4a82a` | 近いうちに対応（機能改善・軽微なバグ） |
| `priority: low` | `#2ea44f` | 余裕があれば対応（改善提案・nice-to-have） |

### 分類ラベル

| ラベル | 色 | 意味 |
|---|---|---|
| `type: bug` | `#d73a4a` | 既存動作のバグ・不具合 |
| `type: enhancement` | `#a2eeef` | 既存機能の改善・拡張 |
| `type: feature` | `#0075ca` | 新機能の追加 |
| `type: refactor` | `#cfd3d7` | 機能変更を伴わないコード整理 |
| `type: ui/ux` | `#e99695` | UI・UX の改善 |
| `type: docs` | `#0075ca` | ドキュメントの追加・修正 |

### 対象領域ラベル

| ラベル | 色 | 意味 |
|---|---|---|
| `area: frontend` | `#bfd4f2` | コンポーネント・画面レイアウト |
| `area: store/logic` | `#d4c5f9` | Zustand store・ビジネスロジック |
| `area: database` | `#f9d0c4` | Supabase・スキーマ・クエリ |
| `area: auth` | `#fef2c0` | 認証・認可 |

---

## 実行手順

### ステップ1: ラベルの存在確認と作成

```bash
gh label list
```

上記で取得したラベル一覧を確認し、定義に存在するラベルのうち未作成のものを作成する。

```bash
# 例: priority: high が未作成の場合
gh label create "priority: high" --color "d73a4a" --description "即時対応が必要（バグ・重大な問題）"
gh label create "priority: medium" --color "e4a82a" --description "近いうちに対応（機能改善・軽微なバグ）"
gh label create "priority: low" --color "2ea44f" --description "余裕があれば対応（改善提案・nice-to-have）"
gh label create "type: bug" --color "d73a4a" --description "既存動作のバグ・不具合"
gh label create "type: enhancement" --color "a2eeef" --description "既存機能の改善・拡張"
gh label create "type: feature" --color "0075ca" --description "新機能の追加"
gh label create "type: refactor" --color "cfd3d7" --description "機能変更を伴わないコード整理"
gh label create "type: ui/ux" --color "e99695" --description "UI・UX の改善"
gh label create "type: docs" --color "0075ca" --description "ドキュメントの追加・修正"
gh label create "area: frontend" --color "bfd4f2" --description "コンポーネント・画面レイアウト"
gh label create "area: store/logic" --color "d4c5f9" --description "Zustand store・ビジネスロジック"
gh label create "area: database" --color "f9d0c4" --description "Supabase・スキーマ・クエリ"
gh label create "area: auth" --color "fef2c0" --description "認証・認可"
```

**重要**: 既存ラベルに対して `gh label create` を実行するとエラーになる。`gh label list` の結果と照合して未作成のもののみ作成すること。

### ステップ2: issue 内容の整理

会話の文脈または引数から以下を決定する:

**必須**:
- `title`: issue のタイトル（簡潔に、日本語可）
- `body`: 概要・原因・修正方針・影響範囲を含む本文（Markdown）
- `priority`: `high` / `medium` / `low`
- `type`: `bug` / `enhancement` / `feature` / `refactor` / `ui/ux` / `docs`
- `area`: `frontend` / `store/logic` / `database` / `auth`（複数可）

**任意**:
- `assignee`: 担当者の GitHub ユーザー名（省略時はアサインなし）
  - 担当者が不明な場合は `gh api user --jq '.login'` で現在のユーザーを取得して設定する

複数の issue をまとめて作成する場合は、各 issue ごとに以下を繰り返す。

### ステップ3: issue 作成

```bash
gh issue create \
  --title "タイトル" \
  --body "$(cat <<'EOF'
## 概要
...

## 原因 / 背景
...

## 修正方針 / 実装案
...

## 影響範囲
- `path/to/file.ts`
EOF
)" \
  --label "priority: high,type: bug,area: store/logic" \
  --assignee "username"
```

**ラベルの選び方の基準**:

| 状況 | priority | type |
|---|---|---|
| 計算が間違っている・データが壊れる | `high` | `bug` |
| 表示がおかしい・ずれている | `medium` | `bug` または `ui/ux` |
| 機能を追加したい | `medium` / `low` | `feature` |
| 既存機能をもっと使いやすくしたい | `low` | `enhancement` または `ui/ux` |
| コードをきれいにしたい | `low` | `refactor` |

### ステップ4: 完了報告

作成した issue の URL と概要を表形式でユーザーに報告する。

```
作成した issue:

| # | タイトル | 優先度 | 分類 | 担当者 |
|---|---|---|---|---|
| #12 | バグ: ... | 🔴 high | bug / store | @username |
| #13 | 改善: ... | 🟢 low | ui/ux / frontend | @username |
```
