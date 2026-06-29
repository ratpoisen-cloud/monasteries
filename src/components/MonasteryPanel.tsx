import React, { useState } from 'react';
import type { Player } from '../types/game';
import {
  Activity,
  Shield,
  Heart,
  PlusCircle,
} from 'lucide-react';
import { Tooltip } from './Tooltip';

interface MonasteryPanelProps {
  players: Record<string, Player>;
  activePlayerId: string;
  phase: string;
  onBuild: (structure: 'cells' | 'church' | 'walls' | 'belfry' | 'cathedral') => void;
  onRecruitMonk: () => void;
  onEndTurn: () => void;
  onVisitCity: (loc: 'prince' | 'bishop' | 'artel' | 'fair') => void;
  onSkipLocation: () => void;
  onPerformCellAction: (type: 'village' | 'saltworks') => void;
  onSkipCellAction: () => void;
  currentCellType: string;
}

export const MonasteryPanel: React.FC<MonasteryPanelProps> = ({
  players,
  activePlayerId,
  phase,
  onBuild,
  onRecruitMonk,
  onEndTurn,
  onVisitCity,
  onSkipLocation,
  onPerformCellAction,
  onSkipCellAction,
  currentCellType,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(activePlayerId);

  React.useEffect(() => {
    setSelectedPlayerId(activePlayerId);
  }, [activePlayerId]);

  const p = players[selectedPlayerId];
  if (!p) return null;

  const isActive = selectedPlayerId === activePlayerId;

  const buildingsCount = Object.values(p.buildings).filter(Boolean).length;
  const victoryPoints = buildingsCount + p.victoryCards.obraz + p.victoryCards.zhitie;

  const buildingSeq: ('cells' | 'church' | 'walls' | 'belfry' | 'cathedral')[] = [
    'cells',
    'church',
    'walls',
    'belfry',
    'cathedral',
  ];
  const nextBuilding = buildingSeq.find((b) => !p.buildings[b]);

  const canBuild = (structure: 'cells' | 'church' | 'walls' | 'belfry' | 'cathedral'): boolean => {
    if (!isActive || phase !== 'BUILD') return false;
    if (nextBuilding !== structure) return false;

    const res = p.resources;
    if (structure === 'cells') {
      return res.molva >= 1 && res.bread >= 1 && p.monksCount >= 1;
    }
    if (structure === 'church') {
      return res.molva >= 2 && res.bread >= 2 && res.wax >= 1 && p.tokens.blessing && p.monksCount >= 2;
    }
    if (structure === 'walls') {
      return res.molva >= 3 && res.bread >= 3 && p.monksCount >= 3;
    }
    if (structure === 'belfry') {
      return res.molva >= 4 && res.bread >= 4 && p.tokens.artel && p.monksCount >= 3;
    }
    if (structure === 'cathedral') {
      return res.molva >= 5 && res.bread >= 5 && res.wax >= 2 && p.tokens.artel && p.tokens.blessing && p.monksCount >= 3;
    }
    return false;
  };

  const getBuildingLabel = (b: string) => {
    switch (b) {
      case 'cells': return 'Кельи';
      case 'church': return 'Церковь';
      case 'walls': return 'Стены';
      case 'belfry': return 'Звонница';
      case 'cathedral': return 'Собор';
      default: return '';
    }
  };

  const getBuildingDesc = (b: string) => {
    switch (b) {
      case 'cells': return 'Увеличивает вместимость братии. Можно нанять больше монахов.';
      case 'church': return 'Духовный центр обители. Требует Благословения Епископа.';
      case 'walls': return 'Крепкие стены защищают обитель от напастей.';
      case 'belfry': return 'Звонница — гордость обители. Требует Артель мастеров.';
      case 'cathedral': return 'Величественный Собор — венец строительства. Требует Артель и Благословение.';
      default: return '';
    }
  };

  const renderBuildingCost = (b: string) => {
    switch (b) {
      case 'cells':
        return '1 Молва, 1 Хлеб, 1 Монах';
      case 'church':
        return '2 Молвы, 2 Хлеба, 1 Воск, Благословение, 2 Монаха';
      case 'walls':
        return '3 Молвы, 3 Хлеба, 3 Монаха';
      case 'belfry':
        return '4 Молвы, 4 Хлеба, Артель, 3 Монаха';
      case 'cathedral':
        return '5 Молв, 5 Хлеба, 2 Воска, Артель, Благословение, 3 Монаха';
      default:
        return '';
    }
  };

  return (
    <div className="w-full mt-6 flex flex-col gap-4 max-w-[1000px]">
      {/* Player Selection Tabs */}
      <div className="flex gap-2 border-b border-stone-800 pb-2 overflow-x-auto">
        {Object.values(players).map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayerId(player.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-all ${
              selectedPlayerId === player.id
                ? 'bg-amber-950/40 text-amber-300 border-amber-600'
                : 'bg-stone-950/20 text-stone-400 border-stone-850 hover:bg-stone-900/50'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-oldrus">{player.name}</span>
            {player.id === activePlayerId && (
              <span className="text-[10px] bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
                Ходит
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Panel Content */}
      <div className="parchment-bg p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-stretch justify-between relative">
        {/* Decorative Gold Arch Background */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-amber-900/5 to-transparent pointer-events-none" />

        {/* 1. Monastery stats & resources */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-amber-950 text-oldrus flex items-center gap-2">
              <span>{p.name}</span>
              <span className="text-sm font-sans bg-amber-900/10 px-3 py-1 rounded-full text-amber-900 border border-amber-900/20 font-bold">
                {victoryPoints} ПО
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-900/70 font-semibold">Братия ({p.monksCount}/3):</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((num) => {
                  const active = num <= p.monksCount;
                  return (
                    <Tooltip
                      key={num}
                      text={active ? 'Монах — один из братии. Требуется для постройки зданий.' : 'Пустая келья. Наймите нового монаха через "Постриг монаха".'}
                      multiline
                    >
                      <div
                        className={`relative w-8 h-11 rounded border overflow-hidden transition-all ${
                          active
                            ? 'border-amber-500/70 shadow shadow-amber-950/50'
                            : 'border-stone-400 opacity-20'
                        }`}
                      >
                        <img src="/assets/monk.png" alt="Монах" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-5 gap-2">
            <Tooltip text="Молва — основной ресурс. Тратится на строительство, подношения Князю/Епископу, постриг монахов.\nДобыча: +1 в начале каждого хода, карты Летописи." multiline>
              <div className="bg-amber-900/5 border border-amber-900/15 p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                <img src="/assets/resources/molva.png" alt="Молва" className="w-8 h-8 object-contain pointer-events-none" />
                <span className="text-xs text-amber-900/70 font-semibold pointer-events-none">Молва</span>
                <span className="text-xl font-bold font-mono text-blue-900 pointer-events-none">{p.resources.molva}</span>
              </div>
            </Tooltip>
            <Tooltip text="Серебро — ценный ресурс. Тратится на найм Артели, покупку на Ярмарке.\nДобыча: у Князя (чёт на кубике = 1 Серебро)." multiline>
              <div className="bg-amber-900/5 border border-amber-900/15 p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                <img src="/assets/resources/silver.png" alt="Серебро" className="w-8 h-8 object-contain pointer-events-none" />
                <span className="text-xs text-amber-900/70 font-semibold pointer-events-none">Серебро</span>
                <span className="text-xl font-bold font-mono text-amber-950 pointer-events-none">{p.resources.silver}</span>
              </div>
            </Tooltip>
            <Tooltip text="Хлеб — нужен для строительства, найма Дружинника, пострига монахов.\nДобыча: в Селе (чёт на кубике = +1 Хлеб)." multiline>
              <div className="bg-amber-900/5 border border-amber-900/15 p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                <img src="/assets/resources/bread.png" alt="Хлеб" className="w-8 h-8 object-contain pointer-events-none" />
                <span className="text-xs text-amber-900/70 font-semibold pointer-events-none">Хлеб</span>
                <span className="text-xl font-bold font-mono text-yellow-900 pointer-events-none">{p.resources.bread}</span>
              </div>
            </Tooltip>
            <Tooltip text="Соль — продаётся на Ярмарке за Серебро (1:1).\nДобыча: в Солеварне (чёт на кубике = +1 Соль)." multiline>
              <div className="bg-amber-900/5 border border-amber-900/15 p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                <img src="/assets/resources/salt.png" alt="Соль" className="w-8 h-8 object-contain pointer-events-none" />
                <span className="text-xs text-amber-900/70 font-semibold pointer-events-none">Соль</span>
                <span className="text-xl font-bold font-mono text-cyan-900 pointer-events-none">{p.resources.salt}</span>
              </div>
            </Tooltip>
            <Tooltip text="Воск — нужен для строительства Церкви и Собора.\nДобыча: по картам Летописи." multiline>
              <div className="bg-amber-900/5 border border-amber-900/15 p-3 rounded-xl flex flex-col items-center gap-1 shadow-sm">
                <img src="/assets/resources/wax.png" alt="Воск" className="w-8 h-8 object-contain pointer-events-none" />
                <span className="text-xs text-amber-900/70 font-semibold pointer-events-none">Воск</span>
                <span className="text-xl font-bold font-mono text-orange-950 pointer-events-none">{p.resources.wax}</span>
              </div>
            </Tooltip>
          </div>

          {/* Tokens and Helpers */}
          <div className="flex flex-wrap gap-4 text-sm mt-2">
            <Tooltip text="Благословение Епископа — требуется для Церкви и Собора. Сжигается при постройке.\nПолучение: пожертвуйте 4 Молвы в Епископском дворе." multiline>
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                p.tokens.blessing
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-250 shadow-sm font-semibold'
                  : 'bg-amber-900/5 text-amber-900/40 border-amber-900/10'
              }`}>
                <Heart size={16} className="pointer-events-none" />
                <span className="pointer-events-none">Благословение {p.tokens.blessing ? 'активно' : 'нет'}</span>
              </div>
            </Tooltip>
            <Tooltip text="Артель мастеров — требуется для Звонницы и Собора. Сгорает после постройки, нужно нанимать заново.\nПолучение: наймите за 1 Серебро в Артели плотников." multiline>
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                p.tokens.artel
                  ? 'bg-orange-50 text-orange-900 border-orange-250 shadow-sm font-semibold'
                  : 'bg-amber-900/5 text-amber-900/40 border-amber-900/10'
              }`}>
                {p.tokens.artel ? (
                  <img src="/assets/artel.png" alt="Артель" className="w-5 h-7 object-cover rounded border border-orange-500/30 pointer-events-none" />
                ) : (
                  <Activity size={16} />
                )}
                <span className="pointer-events-none">Артель мастеров {p.tokens.artel ? 'нанята' : 'нет'}</span>
              </div>
            </Tooltip>
            <Tooltip text="Дружинник — защищает монаха от гибели в опасных событиях. Сжигается при использовании.\nНаём: 2 Хлеба в Крепости." multiline>
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                p.helpers.warrior
                  ? 'bg-amber-50 text-amber-950 border-amber-250 shadow-sm font-semibold'
                  : 'bg-amber-900/5 text-amber-900/40 border-amber-900/10'
              }`}>
                {p.helpers.warrior ? (
                  <img src="/assets/warrior.png" alt="Дружинник" className="w-5 h-7 object-cover rounded border border-amber-500/30 pointer-events-none" />
                ) : (
                  <Shield size={16} />
                )}
                <span className="pointer-events-none">Дружинник {p.helpers.warrior ? 'нанят' : 'нет'}</span>
              </div>
            </Tooltip>
            <Tooltip text="Медведь — защищает монаха от гибели, как Дружинник. Сжигается при использовании.\nПриручение: по картам Летописи." multiline>
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                p.helpers.bear
                  ? 'bg-yellow-50 text-yellow-950 border-yellow-250 shadow-sm font-semibold'
                  : 'bg-amber-900/5 text-amber-900/40 border-amber-900/10'
              }`}>
                {p.helpers.bear ? (
                  <img src="/assets/bear.png" alt="Медведь" className="w-5 h-7 object-cover rounded border border-yellow-500/30 pointer-events-none" />
                ) : (
                  <Shield size={16} />
                )}
                <span className="pointer-events-none">Медведь {p.helpers.bear ? 'приручен' : 'нет'}</span>
              </div>
            </Tooltip>
          </div>

          {/* Victory cards count */}
          <div className="flex gap-4 text-xs text-amber-900/80">
            <Tooltip text="Святые Образы — победные очки. +1 ПО за каждый Образ.\nПолучение: по картам Летописи." multiline>
              <span className="flex items-center gap-2 bg-amber-900/5 px-3 py-1.5 rounded-xl border border-amber-900/10">
                <img src="/assets/obraz.png" alt="Образ" className="w-5 h-7 object-cover rounded border border-amber-600/30 pointer-events-none" />
                <span className="pointer-events-none">Святые Образы: <strong className="text-amber-950 font-mono text-sm">{p.victoryCards.obraz}</strong></span>
              </span>
            </Tooltip>
            <Tooltip text="Жития святых — победные очки. +1 ПО за каждое Житие.\nПолучение: когда монах погибает мученической смертью." multiline>
              <span className="flex items-center gap-2 bg-amber-900/5 px-3 py-1.5 rounded-xl border border-amber-900/10">
                <img src="/assets/zhitie.png" alt="Житие" className="w-5 h-7 object-cover rounded border border-indigo-650/30 pointer-events-none" />
                <span className="pointer-events-none">Жития святых: <strong className="text-indigo-950 font-mono text-sm">{p.victoryCards.zhitie}</strong></span>
              </span>
            </Tooltip>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px bg-amber-900/10 mx-2" />

        {/* 2. Construction progress & actions */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-lg text-amber-950 text-oldrus mb-3">Строительство обители</h3>
            <div className="flex gap-2 overflow-x-auto py-1">
              {buildingSeq.map((b) => {
                const built = p.buildings[b];
                const activeNext = nextBuilding === b;
                const costMet = canBuild(b);

                return (
                  <Tooltip key={b} text={`${getBuildingLabel(b)}\n${getBuildingDesc(b)}\nСтоимость: ${renderBuildingCost(b)}`} className="flex-1 min-w-[75px] max-w-[90px] aspect-[3/4]" multiline>
                    <div className="w-full h-full">
                      <button
                        onClick={() => costMet && onBuild(b)}
                        disabled={!costMet}
                        className={`w-full h-full rounded-xl border flex flex-col items-stretch justify-end transition-all relative overflow-hidden ${
                          built
                            ? 'border-emerald-600 shadow-md shadow-emerald-950/50'
                            : activeNext
                            ? costMet
                              ? 'border-amber-500 gold-glow cursor-pointer hover:scale-[1.05]'
                              : 'border-stone-850'
                            : 'border-stone-900/50 opacity-40'
                        }`}
                      >
                        <img
                          src={`/assets/buildings/${b}.jpg`}
                          alt={getBuildingLabel(b)}
                          className={`absolute inset-0 w-full h-full object-cover transition-all ${
                            built ? '' : 'grayscale opacity-35'
                          }`}
                        />

                        <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 py-1 text-center border-t border-stone-900/40 z-10">
                          <span className="text-[10px] font-sans font-bold text-amber-200">
                            {getBuildingLabel(b)}
                          </span>
                        </div>

                        {built && (
                          <span className="absolute top-1 right-1 bg-emerald-900 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500 shadow z-10">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Player controls */}
          {isActive && (
            <div className="flex gap-2 items-center justify-end border-t border-stone-850 pt-4 mt-auto">
              {/* Recruting Monk button */}
              {p.monksCount < 3 && (
                <Tooltip text="Потратьте 3 Молвы и 1 Хлеб. Чёт на кубике = успех, найм нового монаха." multiline>
                  <button
                    onClick={onRecruitMonk}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-900 to-indigo-950 text-indigo-200 border border-indigo-700 hover:from-indigo-850 hover:to-indigo-900 rounded-xl text-sm font-semibold transition-all flex items-center gap-1"
                  >
                    <PlusCircle size={16} />
                    <span>Постриг монаха</span>
                  </button>
                </Tooltip>
              )}

              {/* City location actions */}
              {currentCellType.startsWith('city_') && phase === 'EVENT_ACTION' && (
                <>
                  <Tooltip text="Вы находитесь в городской клетке. Используйте её возможность (Князь/Епископ/Артель/Ярмарка)." multiline>
                    <button
                      onClick={() => onVisitCity(currentCellType.replace('city_', '') as any)}
                      className="px-4 py-2 btn-red-gold rounded-xl text-sm font-bold transition-all cursor-pointer text-oldrus tracking-wide"
                    >
                      Выполнить действие локации
                    </button>
                  </Tooltip>
                  <Tooltip text="Пропустите действие на этой клетке и перейдите к строительству." multiline>
                    <button
                      onClick={onSkipLocation}
                      className="px-4 py-2 bg-stone-700 text-stone-300 border border-stone-600 hover:bg-stone-650 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      Пропустить
                    </button>
                  </Tooltip>
                </>
              )}

              {phase === 'EVENT_ACTION' && (currentCellType === 'village' || currentCellType === 'saltworks') && (
                <>
                  <Tooltip text={`Бросок кубика: чёт = +1 ${currentCellType === 'village' ? 'Хлеб' : 'Соль'}.`} multiline>
                    <button
                      onClick={() => onPerformCellAction(currentCellType as 'village' | 'saltworks')}
                      className="px-4 py-2 btn-green-gold rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      {currentCellType === 'village' ? 'Собрать урожай' : 'Добыть соль'}
                    </button>
                  </Tooltip>
                  <Tooltip text="Пропустите сбор и перейдите к строительству." multiline>
                    <button
                      onClick={onSkipCellAction}
                      className="px-4 py-2 bg-stone-700 text-stone-300 border border-stone-600 hover:bg-stone-650 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      Пропустить
                    </button>
                  </Tooltip>
                </>
              )}

              {/* End turn button */}
              {phase === 'BUILD' && (
                <Tooltip text="Завершите ход. Следующий игрок получит +1 Молву." multiline>
                  <button
                    onClick={onEndTurn}
                    className="px-6 py-2 btn-red-gold font-bold rounded-xl text-sm transition-all gold-glow cursor-pointer text-oldrus tracking-wider"
                  >
                    Завершить ход
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
