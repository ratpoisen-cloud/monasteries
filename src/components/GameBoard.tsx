import React, { useState } from 'react';
import { Tooltip } from './Tooltip';
import { asset } from '../utils/paths';

// MonkToken component matching the meeple mask design with dynamic coloration
interface MonkTokenProps {
  color: string;
}

export const MonkToken: React.FC<MonkTokenProps> = ({ color }) => {
  return (
    <div 
      className="relative w-8 h-10 transition-transform hover:scale-110 cursor-pointer drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-end animate-bounce"
    >
      {/* Robe Color Substrate */}
      <div 
        className="absolute bottom-[2%] w-full h-[55%]" 
        style={{ 
          backgroundColor: color,
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
        }}
      />
      
      {/* Sprite meeple mask */}
      <img 
        src={asset('monk-mask.png')} 
        alt="Монах" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
      />
    </div>
  );
};

interface Player {
  id: string;
  name: string;
  color: string; // hex or color name compatible with CSS
  x: number;
  y: number;
}

interface GameBoardProps {
  players?: Player[];
  onCellClick?: (x: number, y: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players: customPlayers,
  onCellClick,
}) => {
  // Default mock players if none provided (positioned at the 4 start cells described in spec)
  const defaultPlayers: Player[] = [
    { id: '1', name: 'Верхний', color: '#dc2626', x: 3, y: 0 },  // Red
    { id: '2', name: 'Нижний', color: '#2563eb', x: 4, y: 7 },   // Blue
    { id: '3', name: 'Левый', color: '#16a34a', x: 0, y: 4 },    // Green
    { id: '4', name: 'Правый', color: '#ca8a04', x: 7, y: 3 },   // Yellow
  ];

  const [players] = useState<Player[]>(customPlayers || defaultPlayers);

  // Check if a cell is part of the 2x2 central city area
  const isCityCell = (x: number, y: number): boolean => {
    return (x === 3 || x === 4) && (y === 3 || y === 4);
  };

  const handleCellClick = (x: number, y: number) => {
    console.log(`Clicked cell: (${x}, ${y})`);
    if (onCellClick) {
      onCellClick(x, y);
    }
  };

  return (
    <div 
      className="relative w-full max-w-4xl aspect-square wood-panel rounded-3xl overflow-hidden select-none bg-cover bg-center shadow-2xl border-4 double border-amber-900/40"
      style={{ backgroundImage: `url('${asset('high-res-map.jpg')}')` }}
    >
      {/* 8x8 Grid Layer */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 p-2 gap-0.5">
        {Array.from({ length: 64 }).map((_, index) => {
          const x = index % 8;
          const y = Math.floor(index / 8);
          
          // Find player meeple on this cell
          const cellPlayer = players.find((p) => p.x === x && p.y === y);
          const cityCell = isCityCell(x, y);

          return (
            <Tooltip
              key={index}
              text={cityCell ? `Центр города (${x}, ${y})` : `Клетка (${x}, ${y})`}
              className="w-full h-full"
            >
              <div
                onClick={() => handleCellClick(x, y)}
                data-type={cityCell ? "city" : undefined}
                className={`relative flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all duration-150 cursor-pointer w-full h-full ${
                  cityCell ? 'bg-amber-900/5 hover:bg-amber-900/15' : ''
                }`}
              >
                {cityCell && (
                  <div className="absolute inset-0 border border-dashed border-amber-500/20 pointer-events-none" />
                )}

                {cellPlayer && (
                  <MonkToken color={cellPlayer.color} />
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
