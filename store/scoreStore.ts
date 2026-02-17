import { create } from 'zustand';
import type {
  PitchType,
  PlateResult,
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

  undoStack: ScoreSnapshot[];

  // アクション
  initGame: (gameId: string) => void;
  recordPitch: (
    type: PitchType,
    batterLineupId: string,
    batterName: string,
    battingOrder: number,
  ) => void;
  recordResult: (result: PlateResult, batterLineupId: string, batterName: string, battingOrder: number) => void;
  advanceInning: () => void;
  undo: () => void;
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
  };
}

function countStrikes(pitches: Pitch[]): number {
  return pitches.filter(
    (p) => p.type === 'strike_swinging' || p.type === 'strike_looking',
  ).length;
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
    sequenceInGame: newSeq,
  };
}

export const useScoreStore = create<ScoreState>((set, get) => ({
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
  undoStack: [],

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
      undoStack: [],
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
      });
      return;
    }

    // 4ボール → 四球自動確定
    if (balls >= 4) {
      const pa = confirmPlateAppearance({ ...state, pitches: updatedPitches }, '四球', batterLineupId, batterName, battingOrder);

      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        currentBatterIndex: (state.currentBatterIndex + 1) % 9,
        phase: 'pitching',
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      });
      return;
    }

    // 死球 → 自動確定
    if (type === 'hbp') {
      const pa = confirmPlateAppearance({ ...state, pitches: updatedPitches }, '死球', batterLineupId, batterName, battingOrder);

      set({
        pitches: [],
        plateAppearances: [...state.plateAppearances, pa],
        currentBatterIndex: (state.currentBatterIndex + 1) % 9,
        phase: 'pitching',
        sequenceCounter: state.sequenceCounter + 1,
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      });
      return;
    }

    // インプレー → result フェーズへ
    if (type === 'in_play') {
      set({
        pitches: updatedPitches,
        phase: 'result',
        undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
      });
      return;
    }

    // ボール or ファウル or ストライク → pitches に追加
    set({
      pitches: updatedPitches,
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
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
    const newPhase: ScorePhase = newOuts >= 3 ? 'inning_end' : 'pitching';

    set({
      pitches: newPhase === 'pitching' ? [] : state.pitches,
      plateAppearances: [...state.plateAppearances, pa],
      outs: newOuts,
      currentBatterIndex: newPhase === 'pitching' ? (state.currentBatterIndex + 1) % 9 : state.currentBatterIndex,
      phase: newPhase,
      sequenceCounter: state.sequenceCounter + 1,
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
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
      undoStack: [...state.undoStack.slice(-MAX_UNDO_HISTORY + 1), snap],
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

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
      undoStack: state.undoStack.slice(0, -1),
    });
  },
}));
