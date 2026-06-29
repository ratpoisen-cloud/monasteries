import React from 'react';
import type { Cell as CellType, Player } from '../types/game';
import { useGameStore } from '../stores/useGameStore';
import { Tooltip } from './Tooltip';

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

  let bgClass = 'bg-stone-850 hover:bg-stone-800';
  let borderClass = 'border-stone-800/40';
  let cellName = '';
  let cellDescription = '';
  let icon: React.ReactNode = null;

  switch (cell.type) {
    case 'empty':
      bgClass = 'bg-transparent hover:bg-white/10 border-amber-900/10';
      cellName = 'Неосвоенные земли';
      cellDescription = 'При входе — откройте карту Летописи.';
      icon = null;
      break;
    case 'city_prince':
      bgClass = 'bg-amber-950/15 border-amber-600/30 hover:bg-amber-950/30';
      cellName = 'Княжий терем';
      cellDescription = 'Задобрите Князя 5 Молвой. Чёт на кубике = 1 Серебро.';
      icon = <div className="text-[10px] font-bold text-amber-500 bg-stone-950/60 px-1.5 py-0.5 rounded border border-amber-700/20 text-oldrus">Князь</div>;
      break;
    case 'city_bishop':
      bgClass = 'bg-indigo-950/15 border-indigo-600/30 hover:bg-indigo-950/30';
      cellName = 'Епископский двор';
      cellDescription = 'Пожертвуйте 4 Молвы — получите жетон Благословения.';
      icon = <div className="text-[10px] font-bold text-indigo-400 bg-stone-950/60 px-1.5 py-0.5 rounded border border-indigo-700/20 text-oldrus">Епископ</div>;
      break;
    case 'city_fair':
      bgClass = 'bg-emerald-950/15 border-emerald-600/30 hover:bg-emerald-950/30';
      cellName = 'Ярмарка';
      cellDescription = 'Купля-продажа: соль → серебро, серебро → хлеб/воск.';
      icon = (cell.x === 4 && cell.y === 3) ? (
        <div className="text-[10px] font-bold text-emerald-450 bg-stone-950/60 px-1.5 py-0.5 rounded border border-emerald-700/20 text-oldrus">Ярмарка</div>
      ) : (
        <img src="/assets/fair.png" alt="Ярмарка" className="w-10 h-10 object-contain drop-shadow" />
      );
      break;
    case 'city_artel':
      bgClass = 'bg-orange-950/15 border-orange-600/30 hover:bg-orange-950/30';
      cellName = 'Артель плотников';
      cellDescription = 'Наймите Артель за 1 Серебро — нужна для Звонницы и Собора.';
      icon = <div className="text-[10px] font-bold text-orange-400 bg-stone-950/60 px-1.5 py-0.5 rounded border border-orange-700/20 text-oldrus">Артель</div>;
      break;
    case 'village':
      bgClass = 'bg-gradient-to-br from-lime-950/20 to-emerald-950/10 border-lime-800/30';
      cellName = 'Село';
      cellDescription = 'Своё село: чёт на кубике = +1 Хлеб. Чужое — ресурсов не даёт.';
      icon = <img src="/assets/village.png" alt="Село" className="w-10 h-10 object-contain drop-shadow" />;
      break;
    case 'saltworks':
      bgClass = 'bg-gradient-to-br from-cyan-950/15 to-blue-950/10 border-cyan-800/20';
      cellName = 'Солеварня';
      cellDescription = 'Своя солеварня: чёт на кубике = +1 Соль.';
      icon = <img src="/assets/saltworks.png" alt="Солеварня" className="w-10 h-10 object-contain drop-shadow" />;
      break;
    case 'river':
      bgClass = 'bg-blue-950/10 border-blue-900/10';
      cellName = 'Река';
      cellDescription = 'Бросок кубика: чёт — переправа, нечет — остаётесь на месте.';
      icon = <img src="/assets/river.png" alt="Река" className="w-10 h-10 object-contain drop-shadow" />;
      break;
    case 'fortress':
      bgClass = 'bg-stone-950/10 border-stone-800/20';
      cellName = 'Крепость';
      cellDescription = 'Нанять Дружинника за 2 Хлеба. Защитит монаха от гибели.';
      icon = <img src="/assets/fortress.png" alt="Крепость" className="w-10 h-10 object-contain drop-shadow" />;
      break;
    case 'chapel':
      bgClass = 'bg-amber-950/20 border-amber-600/30';
      cellName = 'Часовня';
      cellDescription = 'Безопасное место. Построена на месте гибели монаха.';
      icon = <img src="/assets/chapel.png" alt="Часовня" className="w-10 h-10 object-contain drop-shadow" />;
      break;
    case 'windfall':
      bgClass = 'bg-red-950/20 border-red-900/30';
      cellName = 'Непроходимый Бурелом';
      cellDescription = 'Нельзя вступить на эту клетку. Обходите стороной.';
      icon = <img src="/assets/windfall.png" alt="Бурелом" className="w-10 h-10 object-contain drop-shadow" />;
      break;
  }

  let startMarker: React.ReactNode = null;
  const startPlayer = Object.values(players).find(
    (p) => p.startCell.x === cell.x && p.startCell.y === cell.y
  );
  if (startPlayer) {
    startMarker = (
      <div
        className="absolute inset-0 rounded-lg border-2 border-dashed pointer-events-none"
        style={{ borderColor: startPlayer.color }}
      />
    );
  }

  const cellDiv = (
    <div
      onClick={() => isAvailableMove && onMove(cell.x, cell.y)}
      className={`relative w-full aspect-square border ${borderClass} rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer select-none transition-all duration-200 ${bgClass} ${
        isAvailableMove
          ? 'ring-4 ring-amber-500 border-amber-400 scale-[1.02] shadow-amber-500/30 shadow-lg animate-pulse'
          : ''
      }`}
    >
      {startMarker}

      {owner && (
        <Tooltip
          text={`Владелец: ${owner.name}\n${cell.type === 'village' ? 'Село приносит хозяину хлеб при посещении.' : 'Солеварня приносит хозяину соль при посещении.'}`}
          className="absolute top-1 right-1 z-30"
          multiline
        >
          <span
            className="block w-3 h-3 rounded-full border border-stone-900 shadow-md"
            style={{ backgroundColor: owner.color }}
          />
        </Tooltip>
      )}

      <span className="absolute bottom-0.5 left-1 text-[8px] text-stone-600/50 font-mono pointer-events-none">
        {cell.x},{cell.y}
      </span>

      <div className="z-10 pointer-events-none">{icon}</div>

      {occupant && (() => {
        let imgName = 'monk_1.png';
        if (occupant.id === 'player_2') imgName = 'monk_3.png';
        else if (occupant.id === 'player_3') imgName = 'monk_1.png';
        else if (occupant.id === 'player_4') imgName = 'monk_2.png';

        const isCurrentActive = occupant.id === activePlayerId && phase === 'MOVE';

        return (
          <div
            className={`absolute z-20 bottom-1.5 w-16 h-20 transition-transform hover:scale-110 cursor-pointer flex flex-col items-center justify-end ${
              isCurrentActive ? 'animate-drift' : ''
            }`}
            style={{
              filter: `drop-shadow(0 0 4px ${occupant.color}) drop-shadow(0 3px 4px rgba(0,0,0,0.6))`
            }}
          >
            <img
              src={`/assets/${imgName}`}
              alt="Монах"
              className="w-full h-full object-contain pointer-events-none z-10"
            />
            <div
              className="absolute bottom-[-1px] w-9 h-[5px] rounded-full z-0 opacity-80"
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
