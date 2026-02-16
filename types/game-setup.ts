import type { FieldingPosition } from './game';

export interface TeamInfoValues {
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  venue: string;
}

export interface LineupRow {
  playerName: string;
  position: FieldingPosition | '';
  isStarter: boolean;
}

export interface LineupValues {
  home: LineupRow[];
  away: LineupRow[];
}
