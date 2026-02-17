import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCell, getReachedBase, getResultLabel, isOutResult } from './ScoreCell';
import type { PlateAppearance } from '@/types/score';

const basePa: PlateAppearance = {
  id: 'pa-1',
  gameId: 'game-1',
  inning: 1,
  topBottom: 'top',
  batterLineupId: 'lineup-1',
  batterName: '鈴木',
  battingOrder: 1,
  result: '単打',
  pitchCount: 4,
  sequenceInGame: 1,
};

describe('getReachedBase', () => {
  it('本塁打 → 4', () => expect(getReachedBase('本塁打')).toBe(4));
  it('三塁打 → 3', () => expect(getReachedBase('三塁打')).toBe(3));
  it('二塁打 → 2', () => expect(getReachedBase('二塁打')).toBe(2));
  it('単打 → 1', () => expect(getReachedBase('単打')).toBe(1));
  it('四球 → 1', () => expect(getReachedBase('四球')).toBe(1));
  it('死球 → 1', () => expect(getReachedBase('死球')).toBe(1));
  it('三振振り → 0（アウト）', () => expect(getReachedBase('三振振り')).toBe(0));
  it('ゴロ → 0（アウト）', () => expect(getReachedBase('ゴロ')).toBe(0));
});

describe('getResultLabel', () => {
  it('本塁打 → HR', () => expect(getResultLabel('本塁打')).toBe('HR'));
  it('三振振り → K', () => expect(getResultLabel('三振振り')).toBe('K'));
  it('三振見 → Kc', () => expect(getResultLabel('三振見')).toBe('Kc'));
  it('四球 → BB', () => expect(getResultLabel('四球')).toBe('BB'));
  it('死球 → HBP', () => expect(getResultLabel('死球')).toBe('HBP'));
  it('併殺打 → DP', () => expect(getResultLabel('併殺打')).toBe('DP'));
  it('振り逃げ → KS', () => expect(getResultLabel('振り逃げ')).toBe('KS'));
});

describe('isOutResult', () => {
  it('三振振り → true', () => expect(isOutResult('三振振り')).toBe(true));
  it('ゴロ → true', () => expect(isOutResult('ゴロ')).toBe(true));
  it('単打 → false', () => expect(isOutResult('単打')).toBe(false));
  it('四球 → false', () => expect(isOutResult('四球')).toBe(false));
  it('エラー → false', () => expect(isOutResult('エラー')).toBe(false));
});

describe('ScoreCell', () => {
  it('PlateAppearance あり → 結果ラベルと投球数が表示される', () => {
    render(<ScoreCell plateAppearance={{ ...basePa, result: '本塁打', pitchCount: 3 }} isCurrent={false} isCurrentInning={false} />);
    expect(screen.getByText('HR')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('三振振り → 赤系ラベル K が表示される', () => {
    render(<ScoreCell plateAppearance={{ ...basePa, result: '三振振り' }} isCurrent={false} isCurrentInning={false} />);
    expect(screen.getByText('K')).toBeTruthy();
  });

  it('plateAppearance=null のとき、ラベルと投球数が表示されない', () => {
    const { container } = render(<ScoreCell plateAppearance={null} isCurrent={false} isCurrentInning={false} />);
    // 数字・ラベルのテキストノードがない
    const cell = container.firstChild as HTMLElement;
    expect(cell.textContent).toBe('');
  });

  it('isCurrent=true のとき、青いリングが付く', () => {
    const { container } = render(<ScoreCell plateAppearance={null} isCurrent={true} isCurrentInning={true} />);
    const cell = container.firstChild as HTMLElement;
    expect(cell.className).toContain('ring-blue-400');
  });
});
