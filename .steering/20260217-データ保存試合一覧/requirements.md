# 機能要件: データ保存・試合一覧（Supabase連携）

## 概要
試合データをクラウド（Supabase）に保存し、認証ユーザーが試合一覧を参照できる機能を実装する。
現状は Zustand（メモリ）のみで、ページリフレッシュ時にデータが失われる問題を解決する。

## PRD 参照
- 機能要件 #7: データ保存・試合一覧（Supabase連携）

## 受け入れ条件
1. **Zustand Persist**: ページリフレッシュ後もゲームデータが保持される（localStorage）
2. **Supabase 基盤**: @supabase/supabase-js のインストールとクライアント初期化
3. **認証 UI**: ログイン・サインアップページの実装
4. **認証ミドルウェア**: 未認証時に `/auth/login` へリダイレクト
5. **試合一覧**: ホームページに試合カードを表示（日付・チーム名・ステータス）
6. **DB CRUD**: 試合・ラインナップの Supabase 保存・取得操作
7. **SQL マイグレーション**: テーブル定義と RLS ポリシー

## スコープ外
- Supabase リアルタイム同期（Supabase Realtime）
- IndexedDB オフラインキュー（Serwist/PWA）
- plate_appearances の Supabase 保存（スコアストアとの統合は別タスク）
- Google OAuth（メール/パスワード認証のみ）
