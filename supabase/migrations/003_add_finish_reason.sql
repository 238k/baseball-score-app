-- games テーブルに finish_reason カラムを追加（試合終了理由: コールドゲーム・降雨中止など）
alter table games add column if not exists finish_reason text;
