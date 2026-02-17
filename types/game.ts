// 守備位置: 1=投手 2=捕手 3=一塁 4=二塁 5=三塁 6=遊撃 7=左翼 8=中堅 9=右翼 10=指名打者
export type FieldingPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type GameStatus = 'in_progress' | 'completed';

export type SubstitutionType = '代打' | '代走' | '守備交代' | '投手交代';

export interface Game {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  venue?: string;
  homeTeamName: string;
  awayTeamName: string;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Lineup {
  id: string;
  gameId: string;
  side: 'home' | 'away';
  battingOrder: number; // 1〜9
  cycle: number; // 打者一巡サイクル（先発は1）
  playerName: string;
  position: FieldingPosition;
  isStarter: boolean;
  enteredInning?: number;
  substitutionType?: SubstitutionType;
}

export interface CreateGameInput {
  userId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  venue?: string;
}
