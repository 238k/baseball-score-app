'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldingPosition, SubstitutionType } from '@/types/game';
import { useGameStore } from '@/store/gameStore';

const FIELDING_POSITION_LABELS: Record<FieldingPosition, string> = {
  1: '投手 (P)',
  2: '捕手 (C)',
  3: '一塁 (1B)',
  4: '二塁 (2B)',
  5: '三塁 (3B)',
  6: '遊撃 (SS)',
  7: '左翼 (LF)',
  8: '中堅 (CF)',
  9: '右翼 (RF)',
  10: '指名打者 (DH)',
};

const FIELDING_POSITIONS: FieldingPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SUBSTITUTION_TYPES: SubstitutionType[] = ['代打', '代走', '守備交代', '投手交代'];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter((element) => !element.hasAttribute('disabled'));
}

interface SubstitutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  attackingSide: 'home' | 'away';
  currentInning: number;
}

export function SubstitutionPanel({
  isOpen,
  onClose,
  gameId,
  attackingSide,
  currentInning,
}: SubstitutionPanelProps) {
  const { substitutePlayer, getCurrentBatter } = useGameStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [substitutionType, setSubstitutionType] = useState<SubstitutionType>('代打');
  const [battingOrder, setBattingOrder] = useState<number>(1);
  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState<FieldingPosition | ''>('');

  const currentPlayer = getCurrentBatter(gameId, attackingSide, battingOrder);

  const isDefensiveChange = substitutionType === '守備交代';
  // 守備交代: 現在の選手が存在する打順にのみ実行可能（空 playerName の書き込みを防ぐ）
  // その他: 新しい選手名と守備位置が必須
  const canSubmit = isDefensiveChange
    ? currentPlayer !== undefined && position !== ''
    : playerName.trim() !== '' && position !== '';

  const resetForm = useCallback(() => {
    setSubstitutionType('代打');
    setBattingOrder(1);
    setPlayerName('');
    setPosition('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    substitutePlayer({
      gameId,
      side: attackingSide,
      battingOrder,
      playerName: isDefensiveChange ? (currentPlayer?.playerName ?? playerName.trim()) : playerName.trim(),
      position: isDefensiveChange
        ? (position !== '' ? position : (currentPlayer?.position ?? 7))
        : (position as FieldingPosition),
      enteredInning: currentInning,
      substitutionType,
    });

    // フォームをリセットして閉じる
    resetForm();
    onClose();
  }, [
    canSubmit,
    isDefensiveChange,
    substitutePlayer,
    gameId,
    attackingSide,
    battingOrder,
    currentPlayer?.playerName,
    currentPlayer?.position,
    playerName,
    position,
    currentInning,
    substitutionType,
    resetForm,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const currentFocusable = getFocusableElements(dialog);
      if (currentFocusable.length === 0) return;

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!active || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* パネル本体 */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="substitution-dialog-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 space-y-5"
      >
        <h2 id="substitution-dialog-title" className="text-lg font-bold text-zinc-900">選手交代</h2>

        {/* 交代種別 */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">交代種別</label>
          <div className="grid grid-cols-2 gap-2">
            {SUBSTITUTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSubstitutionType(type)}
                className={`min-h-[44px] rounded-lg border text-sm font-medium transition-colors ${
                  substitutionType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 交代する打順 */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">交代する打順</label>
          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((order) => (
              <button
                key={order}
                type="button"
                onClick={() => setBattingOrder(order)}
                className={`min-h-[40px] rounded border text-sm font-medium transition-colors ${
                  battingOrder === order
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {order}
              </button>
            ))}
          </div>
          {currentPlayer && (
            <p className="text-xs text-zinc-500 mt-1">
              現在: {currentPlayer.playerName}
            </p>
          )}
        </div>

        {/* 新しい選手名（守備交代以外） */}
        {!isDefensiveChange && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">新しい選手名</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="選手名を入力"
              className="w-full min-h-[44px] px-3 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 守備位置（守備交代・投手交代・代打は必須、代走は任意） */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            守備位置
            {substitutionType === '代走' && (
              <span className="ml-1 text-xs text-zinc-400">（任意）</span>
            )}
          </label>
          <select
            value={position}
            onChange={(e) =>
              setPosition(e.target.value === '' ? '' : (Number(e.target.value) as FieldingPosition))
            }
            className="w-full min-h-[44px] px-3 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {FIELDING_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {FIELDING_POSITION_LABELS[pos]}
              </option>
            ))}
          </select>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 min-h-[48px] rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 min-h-[48px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
