'use client';

// ダイヤモンドの頂点座標（viewBox="0 0 40 40"）
const HOME = { x: 20, y: 36 };
const FIRST = { x: 36, y: 20 };
const SECOND = { x: 20, y: 4 };
const THIRD = { x: 4, y: 20 };

// ベースパスの各辺
const BASE_PATHS = [
  [HOME, FIRST],
  [FIRST, SECOND],
  [SECOND, THIRD],
  [THIRD, HOME],
] as const;

// 型ガード: reachedBase が 1〜4 の範囲かどうか
function isPositiveBase(b: 0 | 1 | 2 | 3 | 4): b is 1 | 2 | 3 | 4 {
  return b > 0;
}

// 走塁経路: reachedBase に到達するまでのベースパス区間を返す
function getRunningSegments(reachedBase: 1 | 2 | 3 | 4): readonly (readonly [{ x: number; y: number }, { x: number; y: number }])[] {
  const segments = [
    [HOME, FIRST],   // 0→1
    [FIRST, SECOND], // 1→2
    [SECOND, THIRD], // 2→3
    [THIRD, HOME],   // 3→4（得点）
  ] as const;
  return segments.slice(0, reachedBase);
}

export interface DiamondProps {
  /** 到達した塁（0=出塁なし/アウト, 1〜4=到達塁, null=未打席） */
  reachedBase: 0 | 1 | 2 | 3 | 4 | null;
  /** アウトかどうか */
  isOut: boolean;
  /** SVGのサイズ (px, default: 40) */
  size?: number;
}

export function Diamond({ reachedBase, isOut, size = 40 }: DiamondProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      {/* ベースパス（グレーのアウトライン） */}
      {BASE_PATHS.map(([from, to], i) => (
        <line
          key={i}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {/* 走塁経路（青の太線） */}
      {reachedBase !== null && isPositiveBase(reachedBase) && !isOut &&
        getRunningSegments(reachedBase).map(([from, to], i) => (
          <line
            key={`run-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))
      }

      {/* ベース（小さな四角） */}
      {[
        { pos: HOME,   label: 'H' },
        { pos: FIRST,  label: '1' },
        { pos: SECOND, label: '2' },
        { pos: THIRD,  label: '3' },
      ].map(({ pos }) => (
        <rect
          key={`${pos.x}-${pos.y}`}
          x={pos.x - 2.5}
          y={pos.y - 2.5}
          width={5}
          height={5}
          fill="#6b7280"
          transform={`rotate(45, ${pos.x}, ${pos.y})`}
        />
      ))}

      {/* アウト時の×印 */}
      {isOut && (
        <>
          <line x1="15" y1="15" x2="25" y2="25" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="25" y1="15" x2="15" y2="25" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
