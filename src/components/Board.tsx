import React from 'react';
import type { Cell as CellType, Player } from '../types/game';
import { Cell } from './Cell';
import { Tooltip } from './Tooltip';

interface BoardProps {
  board: CellType[][];
  players: Record<string, Player>;
  activePlayerId: string;
  phase: string;
  onMove: (x: number, y: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  players,
  activePlayerId,
  phase,
  onMove,
}) => {
  // Find current position of active player
  let activePlayerCell: CellType | null = null;
  for (const row of board) {
    const found = row.find((c) => c.occupantId === activePlayerId);
    if (found) {
      activePlayerCell = found;
      break;
    }
  }

  const checkAvailableMove = (x: number, y: number): boolean => {
    if (phase !== 'MOVE') return false;

    const activePlayer = players[activePlayerId];
    if (!activePlayer) return false;

    const hasEntered = activePlayer.hasEntered ?? false;
    if (!hasEntered) {
      // Must step on either cell 3 or cell 4 on their start edge
      if (activePlayer.startCell.x === 0) { // Left (Green)
        return x === 0 && (y === 3 || y === 4);
      } else if (activePlayer.startCell.x === 7) { // Right (Blue)
        return x === 7 && (y === 3 || y === 4);
      } else if (activePlayer.startCell.y === 0) { // Top (Yellow)
        return (x === 3 || x === 4) && y === 0;
      } else if (activePlayer.startCell.y === 7) { // Bottom (Red)
        return (x === 3 || x === 4) && y === 7;
      }
      return false;
    }

    if (!activePlayerCell) return false;
    const targetCell = board[y]?.[x];
    if (!targetCell) return false;

    // Check occupied or windfall
    if (targetCell.occupantId && targetCell.occupantId !== activePlayerId) return false;
    if (targetCell.type === 'windfall') return false;

    const dx = Math.abs(activePlayerCell.x - x);
    const dy = Math.abs(activePlayerCell.y - y);
    // Adjacent orthogonal step
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  const unenteredMonks = Object.values(players).filter((p) => !p.hasEntered);

  return (
    <div 
      className="relative w-full max-w-[600px] aspect-square wood-panel p-1.5 grid grid-cols-8 grid-rows-8 gap-0.5 rounded-2xl select-none shadow-inner border-2 border-amber-950/40"
      style={{ 
        backgroundImage: "url('/assets/map.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 8x8 Grid Cells */}
      {board.flat().map((cell) => {
        const x = cell.x;
        const y = cell.y;
        const isCityCell = cell.type.startsWith('city_');

        return (
          <div 
            key={`${x}-${y}`} 
            data-type={isCityCell ? "city" : undefined}
            className="relative flex items-center justify-center w-full h-full"
          >
            <Cell
              cell={cell}
              players={players}
              isAvailableMove={checkAvailableMove(x, y)}
              onMove={onMove}
            />
          </div>
        );
      })}

      {/* Unentered Monks centered on border platforms */}
      {unenteredMonks.map((p) => {
        let posClass = "";
        if (p.startCell.x === 0) {
          posClass = "absolute left-[-40px] top-[43.75%] -translate-y-1/2 w-16 h-20 z-30"; // Left (Green)
        } else if (p.startCell.x === 7) {
          posClass = "absolute right-[-40px] top-[43.75%] -translate-y-1/2 w-16 h-20 z-30"; // Right (Blue)
        } else if (p.startCell.y === 0) {
          posClass = "absolute top-[-45px] left-[43.75%] -translate-x-1/2 w-16 h-20 z-30"; // Top (Yellow)
        } else if (p.startCell.y === 7) {
          posClass = "absolute bottom-[-45px] left-[43.75%] -translate-x-1/2 w-16 h-20 z-30"; // Bottom (Red)
        }

        if (!posClass) return null;

        let imgName = 'monk_1.png';
        if (p.id === 'player_2') imgName = 'monk_3.png'; // Blue (Right)
        else if (p.id === 'player_3') imgName = 'monk_1.png'; // Yellow (Top) - random
        else if (p.id === 'player_4') imgName = 'monk_2.png'; // Red (Bottom)

        const isCurrentActive = p.id === activePlayerId && phase === 'MOVE';

        return (
          <div
            key={p.id}
            className={posClass}
            style={{
              filter: `drop-shadow(0 0 4px ${p.color}) drop-shadow(0 3px 4px rgba(0,0,0,0.6))`
            }}
          >
            <div className={`relative w-full h-full flex flex-col items-center justify-end ${
              isCurrentActive ? 'animate-drift' : ''
            }`}>
              <img
                src={`/assets/${imgName}`}
                alt="Монах"
                className="w-full h-full object-contain pointer-events-none z-10"
              />
              <div
                className="absolute bottom-[-1px] w-9 h-[5px] rounded-full z-0 opacity-80"
                style={{ backgroundColor: p.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
