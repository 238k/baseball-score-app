# 要求定義: PWAオフライン対応

## 背景・目的

PRD Feature #8「PWAオフライン対応」の実装。球場の不安定なネットワーク環境でも
スコア記録を継続できることがプロダクトのコアバリューであり、P0（必須）機能。

あわせて、データ保存フィーチャーの retrospective で指摘されていた
「`syncToSupabase` が呼ばれていない」問題（ゲームデータが実際にはSupabaseに
保存されていない）も今回のスコープに含める。

## PRD 受け入れ条件

- ネットワーク切断時もスコア入力・閲覧が継続できる
- オフライン中のデータはローカルに保存される
- オンライン復帰時に自動的にSupabaseへ同期される
- Serwistを使用してService Workerを実装する

## 今回のスコープ（MVP）

### 含める

1. **Serwist Service Worker** - アプリの静的アセットをキャッシュし、オフラインでも起動可能にする
2. **PWA manifest** - インストール可能なPWAとして機能させる
3. **Supabase自動同期** - ゲーム作成時・スコア入力完了時に `syncToSupabase` を呼び出す
4. **オンライン復帰時の同期** - ネットワーク復帰時に未同期データを Supabase へ送る
5. **オフラインインジケーター** - オフライン状態をユーザーに通知するUI

### 含めない（Post-MVP）

- plate_appearances / pitches の Supabase 同期（スキーマ未定義）
- バックグラウンド Sync API（Service Worker からの自動リトライ）
- PWA インストールプロンプト UI
