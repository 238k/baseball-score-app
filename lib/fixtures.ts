import type { CreateGameInput } from '@/types/game';
import type { FieldingPosition } from '@/types/game';

interface FixtureLineupRow {
  playerName: string;
  position: FieldingPosition;
}

interface FixtureData {
  game: CreateGameInput;
  home: FixtureLineupRow[];
  away: FixtureLineupRow[];
}

// 動作確認用のテストデータ
// 打順・守備位置は一般的な配置を想定
export const FIXTURE_GAME: FixtureData = {
  game: {
    homeTeamName: 'ホームチーム',
    awayTeamName: 'アウェイチーム',
    date: new Date().toISOString().slice(0, 10),
    venue: 'テスト球場',
  },
  home: [
    { playerName: '山田 一郎', position: 8 }, // 1番 中堅
    { playerName: '田中 二郎', position: 6 }, // 2番 遊撃
    { playerName: '鈴木 三郎', position: 9 }, // 3番 右翼
    { playerName: '佐藤 四郎', position: 3 }, // 4番 一塁
    { playerName: '高橋 五郎', position: 7 }, // 5番 左翼
    { playerName: '伊藤 六郎', position: 5 }, // 6番 三塁
    { playerName: '渡辺 七郎', position: 4 }, // 7番 二塁
    { playerName: '中村 八郎', position: 2 }, // 8番 捕手
    { playerName: '小林 九郎', position: 1 }, // 9番 投手
  ],
  away: [
    { playerName: '木村 一太', position: 8 }, // 1番 中堅
    { playerName: '松本 二太', position: 6 }, // 2番 遊撃
    { playerName: '井上 三太', position: 9 }, // 3番 右翼
    { playerName: '清水 四太', position: 3 }, // 4番 一塁
    { playerName: '加藤 五太', position: 7 }, // 5番 左翼
    { playerName: '林 六太',   position: 5 }, // 6番 三塁
    { playerName: '斎藤 七太', position: 4 }, // 7番 二塁
    { playerName: '吉田 八太', position: 2 }, // 8番 捕手
    { playerName: '橋本 九太', position: 1 }, // 9番 投手
  ],
};
