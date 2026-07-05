import type { Cell, Player } from '../types/game';

export function getActivePlayerCell(board: Cell[], activePlayerId: string): Cell | null {
  return board.find((cell) => cell.occupantId === activePlayerId) || null;
}

export function getPlayerEntryCells(player: Player): { x: number; y: number }[] {
  const { x, y } = player.startCell;
  if (x === 0) return [{ x: 0, y: 3 }, { x: 0, y: 4 }];
  if (x === 7) return [{ x: 7, y: 3 }, { x: 7, y: 4 }];
  if (y === 0) return [{ x: 3, y: 0 }, { x: 4, y: 0 }];
  if (y === 7) return [{ x: 3, y: 7 }, { x: 4, y: 7 }];
  return [];
}

export function isAdjacentStep(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}
