import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PitchType,
  PlateResult,
  RunnerDestination,
  Pitch,
  PlateAppearance,
  ScorePhase,
  ScoreSnapshot,
} from '@/types/score';
import { OUT_RESULTS, DOUBLE_PLAY_RESULTS } from '@/types/score';

const MAX_UNDO_HISTORY = 50;

interface ScoreState {
  gameId: string | null;
  currentInning: number;
  currentTopBottom: 'top' | 'bottom';
  // 現在の攻撃側チームにおける、打順配列のインデックス（0〜8）
  currentBatterIndex: number;
  outs: number;
  runnersOnBase: Record<1 | 2 | 3, string | null>;
  pitches: Pitch[];                      // 現在打席の投球
  plateAppearances: PlateAppearance[];   // 全確定打席
  phase: ScorePhase;
  sequenceCounter: number;               // 打席通し番号カウンター
  homeScore: number;                     // ホームチームの得点
  awayScore: number;                     // アウェイチームの得点

  // runner_advance フェーズで使用（フェーズ外では null）
  pendingBatterLineupId: string | null;
  pendingBatterDestination: 1 | 2 | 3 | 4 | null; // null = 打者アウト

  undoStack: ScoreSnapshot[];
  redoStack: ScoreSnapshot[];

  // アクション
  initGame: (gameId: string) => void;
  recordPitch: (
    type: PitchType,
    batterLineupId: string,
    batterName: string,
    battingOrder: number,
  ) => void;
  recordResult: (result: PlateResult, batterLineupId: string, batterName: string, battingOrder: number) => void;
  confirmRunners: (destinations: Record<string, RunnerDestination>) => void;
  advanceInning: () => void;
  undo: () => void;
  redo: () => void;
}

function snapshot(state: ScoreState): ScoreSnapshot {
  return {
    timestamp: Date.now(),
    currentInning: state.currentInning,
    currentTopBottom: state.currentTopBottom,
    currentBatterIndex: state.currentBatterIndex,
    outs: state.outs,
    runnersOnBase: { ...state.runnersOnBase },
    pitches: [...state.pitches],
    plateAppearances: [...state.plateAppearances],
    phase: state.phase,
    sequenceCounter: state.sequenceCounter,
    pendingBatterLineupId: state.pendingBatterLineupId,
    pendingBatterDestination: state.pendingBatterDestination,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
  };
}

// ファウル対応のストライクカウント（2ストライクまでのファウルはストライクとして計算）
function countStrikes(pitches: Pitch[]): number {
  let strikes = 0;
  for (const pitch of pitches) {
    if (pitch.type === 'strike_swinging' || pitch.type === 'strike_looking') {
      strikes += 1;
    } else if (pitch.type === 'foul' && strikes < 2) {
      strikes += 1;
    }
  }
  return strikes;
}

function countBalls(pitches: Pitch[]): number {
  return pitches.filter((p) => p.type === 'ball').length;
}

function confirmPlateAppearance(
  state: ScoreState,
  result: PlateResult,
  batterLineupId: string,
  batterName: string,
  battingOrder: number,
): PlateAppearance {
  const newSeq = state.sequenceCounter + 1;
  return {
    id: crypto.randomUUID(),
    gameId: state.gameId ?? '',
    inning: state.currentInning,
    topBottom: state.currentTopBottom,
    batterLineupId,
    batterName,
    battingOrder,
    result,
    pitchCount: state.pitches.length,
    pitches: [...state.pitches],
    sequenceInGame: newSeq,
  };
}

// 打席結果から打者の到達塁を決定する（null=アウト）
function getBatterDestination(result: PlateResult): 1 | 2 | 3 | 4 | null {
  switch (result) {
    case '単打':
    case '野選':
    case 'エラー':
    case '振り逃げ':
    case '四球':
    case '死球':
      return 1;
    case '二塁打':
      return 2;
    case '三塁打':
      return 3;
    case '本塁打':
      return 4;
    default:
      // ゴロ・フライ・ライナー・三振・犠打・犠飛・併殺打
      return null;
  }
}

// 四球・死球のフォースアドバンスを適用する
function applyForceAdvances(
  runners: Record<1 | 2 | 3, string | null>,
  batterLineupId: string,
): Record<1 | 2 | 3, string | null> {
  const r1 = runners[1];
  const r2 = runners[2];
  const r3 = runners[3];

  const newRunners: Record<1 | 2 | 3, string | null> = { 1: null, 2: null, 3: null };

  // 打者は必ず1塁へ
  newRunners[1] = batterLineupId;

  if (r1 !== null) {
    // 1塁走者はフォースで2塁へ
    newRunners[2] = r1;

    if (r2 !== null) {
      // 2塁走者はフォースで3塁へ
      newRunners[3] = r2;
      // 満塁だった場合: 3塁走者は得点（塁から消える）
      // r3 は記録しない（得点としてカウント）
    } else {
      // 2塁が空 → 3塁はそのまま
      newRunners[3] = r3;
    }
  } else {
    // 1塁が空 → 2塁・3塁はそのまま
    newRunners[2] = r2;
    newRunners[3] = r3;
  }

  return newRunners;
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
  gameId: null,
  currentInning: 1,
  currentTopBottom: 'top',
  currentBatterIndex: 0,
  outs: 0,
  runnersOnBase: { 1: null, 2: null, 3: null },
  pitches: [],
  plateAppearances: [],
  phase: 'pitching',
  sequenceCounter: 0,
  homeScore: 0,
  awayScore: 0,
  pendingBatterLineupId: null,
  pendingBatterDestination: null,
  undoStack: [],
  redoStack: [],

  initGame: (gameId) => {
    set({
      gameId,
      currentInning: 1,
      currentTopBottom: 'top',
      currentBatterIndex: 0,
      outs: 0,
      runnersOnBase: { 1: null, 2: null, 3: null },
      pitches: [],
      plateAppearances: [],
      phase: 'pitching',
      sequenceCounter: 0,
      homeScore: 0,
      awayScore: 0,
      pendingBatterLineupId: null,
      pendingBatterDestination: null,
      undoStack: [],
      redoStack: [],
    });
  },

  recordPitch: (type, batterLineupId, batterName, battingOrder) => {
    const state = get();
    const snap = snapshot(state);

    const newPitch: Pitch = {
      id: crypto.randomUUID(),
      plateAppearanceId: '',  // 打席確定後に設定（今回は省略）
      sequence: state.pitches.length + 1,
      type,
    };

    const updatedPitches = [...state.pitches, newPitch];
    const strikes = countStrikes(updatedPitches);
    const balls = countBalls(updatedPitches);

    // 3ストライク → 三振自動確定
    if (strikes >= 3 && type !== 'foul') {
      const result: PlateResult = type === 'strike_swinging' ? '三振振り' : '三振見';
      const pa = confirmPlateAppearance({ ...state, pitches: updatedPitches }, result, batterLineupId, batterName, battingOrder);
      const newOuts = state.outs + 1;
      const newPhase: ScorePhase = newOuts >= 3 ? 'inning_end' : 'pitching';

      set({
        pitches: newPhase === 'pitching' ? [] : updatedPitches,
        plateAppearances: [...state.plateAppearances, pa],
        outs: newOuts,
        currentBatterIndex: newPhase === 'pitching' ? (state.currentBatterIndex + 1) % 9 : state.currentBatterIndex,
        phase: newPhase,
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
      return;
    }

    // 4ボール → 四球自動確定（フォースアドバンス適用）
    if (balls >= 4) {
      const pa = confirmPlateAppearance({ ...state, pitches: updatedPitches }, '四球', batterLineupId, batterName, battingOrder);
      const newRunners = applyForceAdvances(state.runnersOnBase, batterLineupId);

      // 満塁四球: 3塁走者がホームイン
      const isBasesFull =
        state.runnersOnBase[1] !== null &&
        state.runnersOnBase[2] !== null &&
        state.runnersOnBase[3] !== null;
      const scoringRuns = isBasesFull ? 1 : 0;
      const newHomeScore = state.currentTopBottom === 'bottom'
        ? state.homeScore + scoringRuns
        : state.homeScore;
      const newAwayScore = state.currentTopBottom === 'top'
        ? state.awayScore + scoringRuns
        : state.awayScore;

      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        runnersOnBase: newRunners,
        currentBatterIndex: (state.currentBatterIndex + 1) % 9,
        phase: 'pitching',
        sequenceCounter: state.sequenceCounter + 1,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
      return;
    }

    // 死球 → 自動確定（フォースアドバンス適用）
    if (type === 'hbp') {
      const pa = confirmPlateAppearance({ ...state, pitches: updatedPitches }, '死球', batterLineupId, batterName, battingOrder);
      const newRunners = applyForceAdvances(state.runnersOnBase, batterLineupId);

      // 満塁死球: 3塁走者がホームイン
      const isBasesFull =
        state.runnersOnBase[1] !== null &&
        state.runnersOnBase[2] !== null &&
        state.runnersOnBase[3] !== null;
      const scoringRuns = isBasesFull ? 1 : 0;
      const newHomeScore = state.currentTopBottom === 'bottom'
        ? state.homeScore + scoringRuns
        : state.homeScore;
      const newAwayScore = state.currentTopBottom === 'top'
        ? state.awayScore + scoringRuns
        : state.awayScore;

      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        runnersOnBase: newRunners,
        currentBatterIndex: (state.currentBatterIndex + 1) % 9,
        phase: 'pitching',
        sequenceCounter: state.sequenceCounter + 1,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
      return;
    }

    // インプレー → result フェーズへ
    if (type === 'in_play') {
      set({
        pitches: updatedPitches,
        phase: 'result',
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
      return;
    }

    // ボール or ファウル or ストライク → pitches に追加
    set({
      pitches: updatedPitches,
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      redoStack: [],
    });
  },

  recordResult: (result, batterLineupId, batterName, battingOrder) => {
    const state = get();
    const snap = snapshot(state);

    const pa = confirmPlateAppearance(state, result, batterLineupId, batterName, battingOrder);

    const isOut = OUT_RESULTS.includes(result);
    const isDoublePlay = DOUBLE_PLAY_RESULTS.includes(result);
    const outIncrement = isDoublePlay ? 2 : isOut ? 1 : 0;
    const newOuts = Math.min(state.outs + outIncrement, 3);

    // 3アウト → 即 inning_end（走者進塁パネルはスキップ）
    if (newOuts >= 3) {
      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        outs: newOuts,
        phase: 'inning_end',
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
      return;
    }

    const batterDest = getBatterDestination(result);
    const hasRunners =
      state.runnersOnBase[1] !== null ||
      state.runnersOnBase[2] !== null ||
      state.runnersOnBase[3] !== null;
    const needsRunnerAdvance = batterDest !== null || hasRunners;

    if (needsRunnerAdvance) {
      // runner_advance フェーズへ（currentBatterIndex はここでは進めない）
      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        outs: newOuts,
        phase: 'runner_advance',
        pendingBatterLineupId: batterLineupId,
        pendingBatterDestination: batterDest,
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
    } else {
      // 走者なし + 打者アウト → 即次打者へ
      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        outs: newOuts,
        currentBatterIndex: (state.currentBatterIndex + 1) % 9,
        phase: 'pitching',
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
        redoStack: [],
      });
    }
  },

  confirmRunners: (destinations) => {
    const state = get();
    const snap = snapshot(state);

    // 新しい塁状況を構築
    const newRunners: Record<1 | 2 | 3, string | null> = { 1: null, 2: null, 3: null };

    // 打者の到達塁を配置（1〜3塁のみ; 4=得点は塁に置かない）
    const bd = state.pendingBatterDestination;
    let scoringRuns = 0;

    if (bd === 4) {
      // 打者が得点（本塁打など）
      scoringRuns += 1;
    } else if (bd !== null && state.pendingBatterLineupId) {
      newRunners[bd] = state.pendingBatterLineupId;
    }

    // 各走者の移動先を配置（アウトになった走者のカウントも集計）
    let additionalOuts = 0;
    for (const [lineupId, dest] of Object.entries(destinations)) {
      if (dest === 'out') {
        additionalOuts += 1;
      } else if (dest === 4) {
        // 走者が得点
        scoringRuns += 1;
      } else {
        newRunners[dest] = lineupId;
      }
    }

    const newOuts = Math.min(state.outs + additionalOuts, 3);
    const newPhase: ScorePhase = newOuts >= 3 ? 'inning_end' : 'pitching';

    // 攻撃チームに得点を加算
    const newHomeScore = state.currentTopBottom === 'bottom'
      ? state.homeScore + scoringRuns
      : state.homeScore;
    const newAwayScore = state.currentTopBottom === 'top'
      ? state.awayScore + scoringRuns
      : state.awayScore;

    set({
      runnersOnBase: newRunners,
      outs: newOuts,
      phase: newPhase,
      currentBatterIndex: newPhase === 'pitching' ? (state.currentBatterIndex + 1) % 9 : state.currentBatterIndex,
      pendingBatterLineupId: null,
      pendingBatterDestination: null,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      redoStack: [],
    });
  },

  advanceInning: () => {
    const state = get();
    const snap = snapshot(state);

    const isTopNowBottom = state.currentTopBottom === 'top';
    const newInning = isTopNowBottom ? state.currentInning : state.currentInning + 1;
    const newTopBottom: 'top' | 'bottom' = isTopNowBottom ? 'bottom' : 'top';

    set({
      currentInning: newInning,
      currentTopBottom: newTopBottom,
      currentBatterIndex: 0,
      outs: 0,
      runnersOnBase: { 1: null, 2: null, 3: null },
      pitches: [],
      phase: 'pitching',
      pendingBatterLineupId: null,
      pendingBatterDestination: null,
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      redoStack: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const currentSnap = snapshot(state);
    const prev = state.undoStack[state.undoStack.length - 1];
    set({
      currentInning: prev.currentInning,
      currentTopBottom: prev.currentTopBottom,
      currentBatterIndex: prev.currentBatterIndex,
      outs: prev.outs,
      runnersOnBase: { ...prev.runnersOnBase },
      pitches: [...prev.pitches],
      plateAppearances: [...prev.plateAppearances],
      phase: prev.phase,
      sequenceCounter: prev.sequenceCounter,
      pendingBatterLineupId: prev.pendingBatterLineupId,
      pendingBatterDestination: prev.pendingBatterDestination,
      homeScore: prev.homeScore,
      awayScore: prev.awayScore,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentSnap],
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;

    const currentSnap = snapshot(state);
    const next = state.redoStack[state.redoStack.length - 1];
    set({
      currentInning: next.currentInning,
      currentTopBottom: next.currentTopBottom,
      currentBatterIndex: next.currentBatterIndex,
      outs: next.outs,
      runnersOnBase: { ...next.runnersOnBase },
      pitches: [...next.pitches],
      plateAppearances: [...next.plateAppearances],
      phase: next.phase,
      sequenceCounter: next.sequenceCounter,
      pendingBatterLineupId: next.pendingBatterLineupId,
      pendingBatterDestination: next.pendingBatterDestination,
      homeScore: next.homeScore,
      awayScore: next.awayScore,
      undoStack: [...state.undoStack, currentSnap],
      redoStack: state.redoStack.slice(0, -1),
    });
  },
}),
{
  name: 'baseball-score-score-store',
  // undoStack・redoStack・pitches はセッション揮発性なので永続化しない
  partialize: (state) => ({
    gameId: state.gameId,
    currentInning: state.currentInning,
    currentTopBottom: state.currentTopBottom,
    currentBatterIndex: state.currentBatterIndex,
    outs: state.outs,
    runnersOnBase: state.runnersOnBase,
    plateAppearances: state.plateAppearances,
    phase: state.phase,
    sequenceCounter: state.sequenceCounter,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    pendingBatterLineupId: state.pendingBatterLineupId,
    pendingBatterDestination: state.pendingBatterDestination,
  }),
}
  )
);
