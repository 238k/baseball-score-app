export type PitchType =
  | 'ball'             // ボール
  | 'strike_swinging'  // 空振りストライク
  | 'strike_looking'   // 見逃しストライク
  | 'foul'             // ファウル
  | 'in_play'          // インプレー
  | 'hbp';             // 死球

export type PlateResult =
  // 安打
  | '単打' | '二塁打' | '三塁打' | '本塁打'
  // アウト（打球性）
  | 'ゴロ' | 'フライ' | 'ライナー'
  // 三振
  | '三振振り' | '三振見'
  // 犠打・犠飛
  | '犠打' | '犠飛'
  // 出塁
  | '四球' | '死球'
  // その他
  | '野選' | 'エラー' | '併殺打' | '振り逃げ';

// アウトになる打席結果の集合
export const OUT_RESULTS: PlateResult[] = [
  'ゴロ', 'フライ', 'ライナー', '三振振り', '三振見', '犠打', '犠飛', '野選', 'エラー', '併殺打',
];

// 複数アウトになる打席結果
export const DOUBLE_PLAY_RESULTS: PlateResult[] = ['併殺打'];

export interface Pitch {
  id: string;
  plateAppearanceId: string;
  sequence: number; // 打席内の球数（1〜）
  type: PitchType;
}

export interface PlateAppearance {
  id: string;
  gameId: string;
  inning: number;
  topBottom: 'top' | 'bottom';
  batterLineupId: string;
  batterName: string;    // 表示用（ラインナップ未ロード時の fallback）
  battingOrder: number;  // 1〜9
  result: PlateResult;
  pitchCount: number;    // 総投球数
  sequenceInGame: number; // 試合内の打席通し番号
}

// スコア入力のフェーズ
export type ScorePhase =
  | 'pitching'   // 投球入力中
  | 'result'     // 打球結果入力待ち（インプレー後）
  | 'inning_end'; // 3アウト・攻守交代待ち

// Undo用スナップショット
export interface ScoreSnapshot {
  timestamp: number;
  currentInning: number;
  currentTopBottom: 'top' | 'bottom';
  currentBatterIndex: number;
  outs: number;
  runnersOnBase: Record<1 | 2 | 3, string | null>;
  pitches: Pitch[];
  plateAppearances: PlateAppearance[];
  phase: ScorePhase;
  sequenceCounter: number;
}
