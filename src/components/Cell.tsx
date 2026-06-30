import React from 'react';
import type { Cell as CellType, Player } from '../types/game';
import { useGameStore } from '../stores/useGameStore';
import { Tooltip } from './Tooltip';
import { asset } from '../utils/paths';

interface CellProps {
  cell: CellType;
  players: Record<string, Player>;
  isAvailableMove: boolean;
  onMove: (x: number, y: number) => void;
}

export const Cell: React.FC<CellProps> = ({
  cell,
  players,
  isAvailableMove,
  onMove,
}) => {
  const activePlayerId = useGameStore((state) => state.activePlayerId);
  const phase = useGameStore((state) => state.phase);

  const occupant = cell.occupantId ? players[cell.occupantId] : null;
  const owner = cell.ownerId ? players[cell.ownerId] : null;

  let bgClass = 'bg-stone-900/40 hover:bg-stone-800/60';
  let borderClass = 'border-amber-900/25';
  let cellName = '';
  let cellDescription = '';
  let icon: React.ReactNode = null;

  switch (cell.type) {
    case 'empty':
      bgClass = 'bg-transparent hover:bg-white/15 border-amber-900/15';
      cellName = 'Неосвоенные земли';
      cellDescription = 'При входе — откройте карту Летописи.';
      icon = null;
      break;
    case 'city_prince':
      bgClass = 'bg-transparent hover:bg-white/10 border-amber-900/10';
      cellName = 'Княжий терем';
      cellDescription = 'Задобрите Князя 5 Молвой. Чёт на кубике = 1 Серебро.';
      icon = (
        <span 
          className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-[#801818] text-oldrus drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none pointer-events-none tracking-wider text-center whitespace-nowrap"
          style={{
            WebkitTextStroke: '0.75px #fef08a',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 10px rgba(254,240,138,0.7)'
          }}
        >
          Князь
        </span>
      );
      break;
    case 'city_bishop':
      bgClass = 'bg-transparent hover:bg-white/10 border-amber-900/10';
      cellName = 'Епископский двор';
      cellDescription = 'Пожертвуйте 4 Молвы — получите жетон Благословения.';
      icon = (
        <span 
          className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-[#801818] text-oldrus drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none pointer-events-none tracking-wider text-center whitespace-nowrap"
          style={{
            WebkitTextStroke: '0.75px #fef08a',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 10px rgba(254,240,138,0.7)'
          }}
        >
          Епископ
        </span>
      );
      break;
    case 'city_fair':
      bgClass = 'bg-transparent hover:bg-white/10 border-amber-900/10';
      cellName = 'Ярмарка';
      cellDescription = 'Купля-продажа: соль → серебро, серебро → хлеб/воск.';
      icon = (cell.x === 4 && cell.y === 4) ? (
        <span 
          className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-[#801818] text-oldrus drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none pointer-events-none tracking-wider text-center whitespace-nowrap"
          style={{
            WebkitTextStroke: '0.75px #fef08a',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 10px rgba(254,240,138,0.7)'
          }}
        >
          Ярмарка
        </span>
      ) : null;
      break;
    case 'city_artel':
      bgClass = 'bg-transparent hover:bg-white/10 border-amber-900/10';
      cellName = 'Артель плотников';
      cellDescription = 'Наймите Артель за 1 Серебро — нужна для Звонницы и Собора.';
      icon = (
        <span 
          className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-[#801818] text-oldrus drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none pointer-events-none tracking-wider text-center whitespace-nowrap"
          style={{
            WebkitTextStroke: '0.75px #fef08a',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 10px rgba(254,240,138,0.7)'
          }}
        >
          Артель
        </span>
      );
      break;
    case 'village':
      bgClass = 'bg-gradient-to-br from-lime-950/40 to-emerald-950/30 border-lime-600/50';
      cellName = 'Село';
      cellDescription = 'Своё село: чёт на кубике = +1 Хлеб. Чужое — ресурсов не даёт.';
      icon = <img src={asset('village.png')} alt="Село" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
    case 'saltworks':
      bgClass = 'bg-gradient-to-br from-cyan-950/35 to-blue-950/30 border-cyan-600/40';
      cellName = 'Солеварня';
      cellDescription = 'Своя солеварня: чёт на кубике = +1 Соль.';
      icon = <img src={asset('saltworks.png')} alt="Солеварня" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
    case 'river':
      bgClass = 'bg-blue-950/30 border-blue-700/40';
      cellName = 'Река';
      cellDescription = 'Бросок кубика: чёт — переправа, нечет — остаётесь на месте.';
      icon = <img src={asset('river.png')} alt="Река" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
    case 'fortress':
      bgClass = 'bg-stone-950/40 border-stone-600/50';
      cellName = 'Крепость';
      cellDescription = 'Нанять Дружинника за 2 Хлеба. Защитит монаха от гибели.';
      icon = <img src={asset('fortress.png')} alt="Крепость" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
    case 'chapel':
      bgClass = 'bg-amber-950/40 border-amber-400/50';
      cellName = 'Часовня';
      cellDescription = 'Безопасное место. Построена на месте гибели монаха.';
      icon = <img src={asset('chapel.png')} alt="Часовня" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
    case 'windfall':
      bgClass = 'bg-red-950/40 border-red-800/50';
      cellName = 'Непроходимый Бурелом';
      cellDescription = 'Нельзя вступить на эту клетку. Обходите стороной.';
      icon = <img src={asset('windfall.png')} alt="Бурелом" className="w-9 h-9 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />;
      break;
  }

  const activePlayer = players[activePlayerId];
  const activeColor = activePlayer ? activePlayer.color : '#fef08a';

  let startMarker: React.ReactNode = null;
  const startPlayer = Object.values(players).find(
    (p) => p.startCell.x === cell.x && p.startCell.y === cell.y
  );
  if (startPlayer) {
    startMarker = (
      <div
        className="absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none opacity-90"
        style={{ borderColor: startPlayer.color }}
      />
    );
  }

  const cellDiv = (
    <div
      onClick={() => isAvailableMove && onMove(cell.x, cell.y)}
      className={`relative w-full aspect-square border ${borderClass} rounded-2xl flex flex-col items-center justify-center p-1 cursor-pointer select-none transition-all duration-250 ${bgClass} ${
        isAvailableMove
          ? 'scale-[1.03] z-20 animate-pulse'
          : ''
      }`}
      style={isAvailableMove ? {
        borderColor: activeColor,
        boxShadow: `0 0 14px ${activeColor}a0, inset 0 0 10px ${activeColor}40`
      } : undefined}
    >
      {startMarker}

      {/* Available Move Player Color Indicator */}
      {isAvailableMove && (
        <span 
          className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full shadow-md pointer-events-none animate-ping"
          style={{ backgroundColor: activeColor }}
        />
      )}

      {owner && (
        <Tooltip
          text={`Владелец: ${owner.name}\n${cell.type === 'village' ? 'Село приносит хозяину хлеб при посещении.' : 'Солеварня приносит хозяину соль при посещении.'}`}
          className="absolute top-1 right-1 z-30"
          multiline
        >
          <span
            className="block w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full border-2 border-stone-950 shadow-lg ring-1 ring-white/20"
            style={{ backgroundColor: owner.color }}
          />
        </Tooltip>
      )}

      <span className="absolute bottom-0.5 left-1 text-[8px] sm:text-[9px] text-stone-300/30 font-mono pointer-events-none">
        {cell.x},{cell.y}
      </span>

      <div className="z-10 pointer-events-none flex items-center justify-center">{icon}</div>

      {occupant && (() => {
        let imgName = 'monk_1.png';
        if (occupant.id === 'player_2') imgName = 'monk_3.png';
        else if (occupant.id === 'player_3') imgName = 'monk_1.png';
        else if (occupant.id === 'player_4') imgName = 'monk_2.png';

        const isCurrentActive = occupant.id === activePlayerId && phase === 'MOVE';

        return (
          <div
            className={`absolute z-30 bottom-0 w-[55%] h-[80%] transition-transform hover:scale-110 cursor-pointer flex flex-col items-center justify-end ${
              isCurrentActive ? 'animate-drift' : ''
            }`}
            style={{
              filter: `drop-shadow(0 0 8px ${occupant.color}) drop-shadow(0 4px 8px rgba(0,0,0,0.8))`
            }}
          >
            <img
              src={asset(imgName)}
              alt="Монах"
              className={`w-full h-full object-contain pointer-events-none z-10 ${occupant.id === 'player_1' ? '-scale-x-100' : ''}`}
            />
            <div
              className="absolute bottom-[-2px] w-[60%] h-[8%] rounded-full z-0 opacity-90 blur-[1px]"
              style={{ backgroundColor: occupant.color }}
            />
          </div>
        );
      })()}
    </div>
  );

  if (cell.type === 'empty') return cellDiv;

  return (
    <Tooltip text={`${cellName}\n${cellDescription}`} className="w-full aspect-square" multiline>
      {cellDiv}
    </Tooltip>
  );
};
