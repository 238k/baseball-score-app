# 野球スコア記録アプリ 初期要件定義

## 概要

プロ野球観戦・草野球兼用の野球スコア記録Webアプリケーション。
タブレット操作を主ターゲットとし、一球ごとのリアルタイム入力と印刷に対応する。

---

## ターゲットユーザー・ユースケース

- **主**: プロ野球をスコアブックで記録するファン
- **副**: 草野球の記録係

---

## 機能要件

### 試合設定

- チーム名・選手名は毎試合入力（事前登録なし）
- 打順・守備位置を入力してオーダー表を作成
- 延長イニング対応（イニング数制限なし）
- 打者一巡（同一打順の複数サイクル）対応

### スコア入力

- 一球ごとに以下を記録
  - ボール (B)
  - 空振りストライク (S)
  - 見逃しストライク (S)
  - ファウル (F)
  - インプレー
  - 死球 (HBP)
- 打席結果を記録（NPBスコアブック準拠の記号・略語）
  - 安打種別：単打・二塁打・三塁打・本塁打
  - アウト種別：ゴロ・フライ・ライナー・三振（空振り・見逃し）・犠打・犠飛
  - 出塁：四球・死球
  - その他：野選・エラー・併殺打・振り逃げ
- 打球方向を守備番号（1〜9）で記録
- エラーを記録（どの守備番号がエラーしたか）
- 走者の進塁・アウトを詳細に記録
  - 進塁・盗塁・盗塁死・暴投・パスボール・ボーク・牽制アウト
- **選手交代を記録**
  - 代打・代走・守備交代・投手交代

### UI・レイアウト

- **標準的な日本式スコアブック（NPB準拠）レイアウト**
- 打席セル中央に菱形のダイヤモンド（塁）を描画
- 走者の走路をダイヤモンド上に表示
- 現在の打者をハイライト
- 塁上の走者状況をリアルタイム表示
- 直前の入力を取り消す **Undo 機能**
- **タブレット（iPad等）をメインターゲット**とした操作性

### 統計（リアルタイム自動計算）

#### 打者成績

| 統計 | 算出根拠 |
|---|---|
| 打数・安打・打率 | 打席結果 |
| 二塁打・三塁打・本塁打 | 打席結果 |
| 打点・得点 | 進塁イベント |
| 四球・死球・三振 | 打席結果 |
| 出塁率・長打率・OPS | 上記から計算 |
| 犠打・犠飛 | 打席結果 |
| 盗塁・盗塁死 | 塁間イベント |
| 併殺打 | 打席結果 |
| 平均投球数/打席 | 一球記録から計算 |

#### 投手成績

| 統計 | 算出根拠 |
|---|---|
| 投球回・投球数 | 打席・アウト記録 |
| 奪三振・与四球・与死球 | 打席結果 |
| 被安打・被打率 | 打席結果 |
| 失点・自責点 | 得点＋エラー記録 |
| 防御率 (ERA) | 自責点÷投球回×9 |
| WHIP | (与四球＋被安打)÷投球回 |
| K/9・BB/9・K/BB | 上記から計算 |

### 印刷

- スコアブックレイアウトをそのまま印刷できる
- 印刷用ビュー（`/games/[id]/print`）を別途用意

### データ管理

- 過去の試合データを保存・一覧表示・閲覧できる
- データは Supabase (PostgreSQL) に保存
- **認証あり**（Supabase Auth 使用）
  - 自分の記録は自分にしか見えない（Row Level Security で保護）
- 複数人の同時記録は対象外

### PWA（オフライン対応）

- 球場でネットワークがない状況でも動作する
- オフライン時は一時的にローカルに保存し、オンライン復帰時に同期する

---

## 技術スタック

| 役割 | 採用技術 |
|---|---|
| フロントエンド | Next.js (App Router) + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| 状態管理 | Zustand（入力状態・Undo履歴） |
| バックエンド/DB | Supabase (PostgreSQL + Auth + RLS) |
| PWA | Serwist |

---

## 画面構成

```
/                        ホーム（試合一覧）
/games/new               試合設定（チーム名・オーダー入力）
/games/[id]              スコア入力（メイン画面）
/games/[id]/stats        成績集計
/games/[id]/print        印刷用ビュー
```

---

## DBスキーマ概略

```
games
  id, user_id, date, venue, home_team_name, away_team_name, status, created_at
  ※ user_id で RLS による本人限定アクセス

lineups
  id, game_id, side(home/away), batting_order, cycle,
  player_name, position(1-9), is_starter,
  entered_inning, substitution_type(代打/代走/守備交代/投手交代)

innings
  id, game_id, inning_number, top_bottom(top/bottom)

plate_appearances
  id, game_id, inning_id, batter_lineup_id, pitcher_lineup_id,
  batting_order_cycle, result, hit_direction(1-9),
  error_fielder(1-9 or null), rbi, sequence_in_inning

pitches
  id, plate_appearance_id, sequence,
  type(ball/strike_swinging/strike_looking/foul/in_play/hbp)

base_events
  id, plate_appearance_id, inning_id, runner_lineup_id,
  from_base, to_base,
  event_type(advance/stolen_base/caught_stealing/wild_pitch/passed_ball/balk/pickoff/out)
  sequence
```

### RLS方針

- `games`: `user_id = auth.uid()` で直接保護
- それ以外のテーブル: `game_id → games.user_id = auth.uid()` を経由してポリシー設定

---

## 未決事項・将来検討

- 複数人による同時記録（リアルタイム同期）
- チーム・選手の事前登録・再利用機能
- 試合データのエクスポート（CSV / PDF）
- より高度な指標（BABIP、wOBA等）への対応
- 守備率等の守備統計
