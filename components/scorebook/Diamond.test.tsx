import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Diamond } from './Diamond';

describe('Diamond', () => {
  it('reachedBase=1 のとき、ホーム→一塁の走塁パスが描画される', () => {
    const { container } = render(<Diamond reachedBase={1} isOut={false} />);
    const lines = container.querySelectorAll('line[stroke="#3b82f6"]');
    // 1セグメント（home→first）
    expect(lines.length).toBe(1);
  });

  it('reachedBase=4 のとき、全4セグメントの走塁パスが描画される', () => {
    const { container } = render(<Diamond reachedBase={4} isOut={false} />);
    const lines = container.querySelectorAll('line[stroke="#3b82f6"]');
    // 4セグメント（home→1st, 1st→2nd, 2nd→3rd, 3rd→home）
    expect(lines.length).toBe(4);
  });

  it('isOut=true のとき、×印が表示される', () => {
    const { container } = render(<Diamond reachedBase={0} isOut={true} />);
    const crossLines = container.querySelectorAll('line[stroke="#ef4444"]');
    expect(crossLines.length).toBe(2);
  });

  it('reachedBase=null のとき、走塁パスが描画されない', () => {
    const { container } = render(<Diamond reachedBase={null} isOut={false} />);
    const bluelines = container.querySelectorAll('line[stroke="#3b82f6"]');
    expect(bluelines.length).toBe(0);
  });

  it('size プロパティが SVG に反映される', () => {
    const { container } = render(<Diamond reachedBase={null} isOut={false} size={60} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('60');
    expect(svg?.getAttribute('height')).toBe('60');
  });
});
