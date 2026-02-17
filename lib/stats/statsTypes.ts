/** 打者成績 */
export interface BattingStats {
  lineupId: string;
  playerName: string;
  battingOrder: number;
  pa: number;           // 打席
  ab: number;           // 打数
  h: number;            // 安打
  double: number;       // 二塁打
  triple: number;       // 三塁打
  hr: number;           // 本塁打
  bb: number;           // 四球
  hbp: number;          // 死球
  so: number;           // 三振
  sac: number;          // 犠打
  sf: number;           // 犠飛
  dp: number;           // 併殺打
  pitchesTotal: number; // 総投球数
  avg: number | null;   // 打率（打数0の場合 null）
  obp: number | null;   // 出塁率
  slg: number | null;   // 長打率
  ops: number | null;   // OPS
  ppa: number | null;   // 平均投球数/打席（打席0の場合 null）
}

/** 投手成績 */
export interface PitchingStats {
  lineupId: string;
  playerName: string;
  bfp: number;           // 被打席
  pitches: number;       // 投球数
  ip: number;            // 投球回（小数）
  ipDisplay: string;     // 投球回表示（例: "5"、"5 2/3"）
  h: number;             // 被安打
  so: number;            // 奪三振
  bb: number;            // 与四球
  hbp: number;           // 与死球
  oppAvg: number | null; // 被打率
  whip: number | null;   // WHIP（IP=0の場合 null）
  k9: number | null;     // K/9（IP=0の場合 null）
  bb9: number | null;    // BB/9（IP=0の場合 null）
  kbb: number | null;    // K/BB（BB=0の場合 null）
}
