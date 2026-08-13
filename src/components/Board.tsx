import React from 'react';
import type { Cell as CellType, Player } from '../types/game';
import { Cell } from './Cell';
import { asset } from '../utils/paths';
import { findPlayerCell, getPlayerEntryCells, isAdjacentStep } from '../utils/rules';

interface BoardProps {
  board: CellType[][];
  players: Record<string, Player>;
  activePlayerId: string;
  phase: string;
  onMove: (x: number, y: number) => void;
  onSkipEntryMove?: () => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  players,
  activePlayerId,
  phase,
  onMove,
  onSkipEntryMove,
}) => {
  // Find current position of active player
  const activePlayerCell = findPlayerCell(board, activePlayerId);

  const checkAvailableMove = (x: number, y: number): boolean => {
    if (phase !== 'MOVE') return false;

    const activePlayer = players[activePlayerId];
    if (!activePlayer) return false;

    const hasEntered = activePlayer.hasEntered ?? false;
    if (!hasEntered) {
      // Must step on one of the entry cells on their start edge
      return getPlayerEntryCells(activePlayer).some((c) => c.x === x && c.y === y);
    }

    if (!activePlayerCell) return false;
    const targetCell = board[y]?.[x];
    if (!targetCell) return false;

    // Check occupied or windfall
    if (targetCell.occupantId && targetCell.occupantId !== activePlayerId) return false;
    if (targetCell.type === 'windfall') return false;

    // Cannot stay on the same cell two turns in a row
    if (activePlayerCell.x === x && activePlayerCell.y === y) return false;

    // Adjacent orthogonal step
    return isAdjacentStep(activePlayerCell, { x, y });
  };

  const unenteredMonks = Object.values(players).filter((p) => !p.hasEntered);
  const activePlayer = players[activePlayerId];
  const canStayAtGates = phase === 'MOVE' && !!activePlayer && !activePlayer.hasEntered;

  return (
    <div className="relative w-full aspect-square flex items-center justify-center select-none shadow-2xl transition-all duration-300"
        style={{ maxWidth: 'min(1050px, calc(100vh - 140px))' }}
      >
      <div 
        className="relative w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5 sm:gap-1.5 rounded-2xl shadow-2xl border border-amber-900/30"
        style={{ 
          backgroundImage: `url('${asset('map_clean.jpg')}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Stay-at-gates option for a player who has not yet entered the board */}
        {canStayAtGates && onSkipEntryMove && (
          <button
            onClick={onSkipEntryMove}
            className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-amber-950/90 text-amber-100 border border-amber-500/60 hover:bg-amber-900 shadow-xl text-[11px] sm:text-sm font-bold text-oldrus tracking-wider transition-all cursor-pointer animate-pulse"
          >
            Остаться у врат
          </button>
        )}
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
            posClass = "absolute left-[-26px] sm:left-[-40px] top-[50%] -translate-y-1/2 w-[11%] h-[16%] z-30"; // Left (Green)
          } else if (p.startCell.x === 7) {
            posClass = "absolute right-[-26px] sm:right-[-40px] top-[50%] -translate-y-1/2 w-[11%] h-[16%] z-30"; // Right (Blue)
          } else if (p.startCell.y === 0) {
            posClass = "absolute top-[-30px] sm:top-[-44px] left-[50%] -translate-x-1/2 w-[11%] h-[16%] z-30"; // Top (Yellow)
          } else if (p.startCell.y === 7) {
            posClass = "absolute bottom-[-30px] sm:bottom-[-44px] left-[50%] -translate-x-1/2 w-[11%] h-[16%] z-30"; // Bottom (Red)
          }

          if (!posClass) return null;

          let imgName = 'monk_1.png';
          if (p.id === 'player_2') imgName = 'monk_3.png';
          else if (p.id === 'player_3') imgName = 'monk_1.png';
          else if (p.id === 'player_4') imgName = 'monk_2.png';

          const isCurrentActive = p.id === activePlayerId && phase === 'MOVE';

          return (
            <div
              key={p.id}
              className={posClass}
              style={{
                filter: `drop-shadow(0 0 10px ${p.color}) drop-shadow(0 5px 8px rgba(0,0,0,0.85))`
              }}
            >
              <div className={`relative w-full h-full flex flex-col items-center justify-end ${
                isCurrentActive ? 'animate-drift animate-pulse-ring' : ''
              }`}>
                <img
                  src={asset(imgName)}
                  alt="Монах"
                  className={`w-full h-full object-contain pointer-events-none z-10 ${p.id === 'player_1' ? '-scale-x-100' : ''}`}
                />
                <div
                  className="absolute bottom-[-2px] w-10 sm:w-12 h-[6px] sm:h-[8px] rounded-full z-0 opacity-90 blur-[1px]"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
