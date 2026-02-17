import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LineupSection } from './LineupSection';
import type { LineupRow } from '@/types/game-setup';

function createLineupRows(): LineupRow[] {
  return Array.from({ length: 9 }, () => ({
    playerName: '',
    position: '',
    isStarter: true,
  }));
}

afterEach(() => {
  cleanup();
});

describe('LineupSection', () => {
  it('守備位置の未選択値は空文字として onChange に渡される', () => {
    const onChange = vi.fn();

    render(
      <LineupSection
        values={{ home: createLineupRows(), away: createLineupRows() }}
        errors={{ home: Array(9).fill(''), away: Array(9).fill('') }}
        onChange={onChange}
        onAddBench={vi.fn()}
      />
    );

    const firstPositionSelect = screen.getByRole('combobox', {
      name: 'ホーム 1 番打者 守備位置',
    });

    fireEvent.change(firstPositionSelect, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('home', 0, 'position', '');
  });

  it('守備位置を選択した場合は数値として onChange に渡される', () => {
    const onChange = vi.fn();

    render(
      <LineupSection
        values={{ home: createLineupRows(), away: createLineupRows() }}
        errors={{ home: Array(9).fill(''), away: Array(9).fill('') }}
        onChange={onChange}
        onAddBench={vi.fn()}
      />
    );

    const firstPositionSelect = screen.getByRole('combobox', {
      name: 'ホーム 1 番打者 守備位置',
    });

    fireEvent.change(firstPositionSelect, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith('home', 0, 'position', 2);
  });

  it('打順入力欄に行文脈を含む aria-label が付与される', () => {
    render(
      <LineupSection
        values={{ home: createLineupRows(), away: createLineupRows() }}
        errors={{ home: Array(9).fill(''), away: Array(9).fill('') }}
        onChange={vi.fn()}
        onAddBench={vi.fn()}
      />
    );

    const firstPlayerInput = screen.getByRole('textbox', {
      name: 'ホーム 1 番打者 選手名',
    });
    expect(firstPlayerInput).toBeTruthy();
  });
});
