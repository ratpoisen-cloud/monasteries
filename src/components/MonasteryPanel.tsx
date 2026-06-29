import React, { useState } from 'react';
import type { Player } from '../types/game';
import {
  Heart,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  filterPlayerIds?: string[];
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
  filterPlayerIds,
}) => {
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedPlayerIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const buildingSeq: ('cells' | 'church' | 'walls' | 'belfry' | 'cathedral')[] = [
    'cells',
    'church',
    'walls',
    'belfry',
    'cathedral',
  ];

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
      case 'cells': return '1 Молва, 1 Хлеб, 1 Монах';
      case 'church': return '2 Молвы, 2 Хлеба, 1 Воск, Благословение, 2 Монаха';
      case 'walls': return '3 Молвы, 3 Хлеба, 3 Монаха';
      case 'belfry': return '4 Молвы, 4 Хлеба, Артель, 3 Монаха';
      case 'cathedral': return '5 Молв, 5 Хлеба, 2 Воска, Артель, Благословение, 3 Монаха';
      default: return '';
    }
  };

  const canBuild = (p: Player, structure: 'cells' | 'church' | 'walls' | 'belfry' | 'cathedral'): boolean => {
    if (p.id !== activePlayerId || phase !== 'BUILD') return false;
    const nextB = buildingSeq.find((b) => !p.buildings[b]);
    if (nextB !== structure) return false;

    const res = p.resources;
    if (structure === 'cells') return res.molva >= 1 && res.bread >= 1 && p.monksCount >= 1;
    if (structure === 'church') return res.molva >= 2 && res.bread >= 2 && res.wax >= 1 && p.tokens.blessing && p.monksCount >= 2;
    if (structure === 'walls') return res.molva >= 3 && res.bread >= 3 && p.monksCount >= 3;
    if (structure === 'belfry') return res.molva >= 4 && res.bread >= 4 && p.tokens.artel && p.monksCount >= 3;
    if (structure === 'cathedral') return res.molva >= 5 && res.bread >= 5 && res.wax >= 2 && p.tokens.artel && p.tokens.blessing && p.monksCount >= 3;
    return false;
  };

  const rawPlayerList = Object.values(players);
  const playerList = filterPlayerIds
    ? rawPlayerList.filter((p) => filterPlayerIds.includes(p.id))
    : rawPlayerList;

  if (playerList.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      <div className="flex flex-col gap-6 items-center xl:items-stretch">
        {playerList.map((p) => {
          const isActive = p.id === activePlayerId;
          const isExpanded = !!expandedPlayerIds[p.id];
          const buildingsCount = Object.values(p.buildings).filter(Boolean).length;
          const relicCount = Object.values(p.relics).filter(Boolean).length;
          const victoryPoints = buildingsCount + relicCount;
          const nextBuilding = buildingSeq.find((b) => !p.buildings[b]);

          const lastBuilt = [...buildingSeq].reverse().find((b) => p.buildings[b]);
          const currentBuildingDisplay = lastBuilt || 'cells';

          // --- COLLAPSED STATE (Минималистичный вертикальный столбец с крупными иконками) ---
          if (!isExpanded) {
            return (
              <div
                key={p.id}
                onClick={() => toggleExpand(p.id)}
                className={`parchment-codex p-3 sm:p-3.5 rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:scale-[1.03] transition-all border-4 shadow-2xl w-full max-w-[145px] sm:max-w-[155px] mx-auto relative ${
                  isActive
                    ? 'border-amber-400 ring-4 ring-amber-400/40 gold-border-glow'
                    : 'border-amber-900/60 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Header Badge */}
                <div className="flex flex-col items-center gap-1 w-full border-b border-amber-900/20 pb-2 text-center">
                  <div className="flex items-center gap-1.5 justify-center w-full">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-amber-900/30 flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950 text-oldrus tracking-wide truncate max-w-[100px]" title={p.name}>
                      {p.name.replace('монастырь', '').trim()}
                    </h3>
                  </div>
                  {isActive && (
                    <span className="text-[9px] bg-amber-500/25 text-amber-950 px-2 py-0.5 rounded-full border border-amber-600/40 font-bold animate-pulse text-oldrus tracking-wider">
                      Ходит ⚜️
                    </span>
                  )}
                  <span className="text-[11px] font-sans bg-amber-900/15 px-2.5 py-0.5 rounded-full text-amber-950 border border-amber-900/30 font-bold mt-0.5">
                    🏆 {victoryPoints} ПО
                  </span>
                </div>

                {/* Vertical Stack of Resources (Larger Icons + Numbers, NO labels) */}
                <div className="flex flex-col gap-2 w-full py-1 px-1">
                  {[
                    { key: 'molva', label: 'Молва', val: p.resources.molva },
                    { key: 'silver', label: 'Серебро', val: p.resources.silver },
                    { key: 'bread', label: 'Хлеб', val: p.resources.bread },
                    { key: 'salt', label: 'Соль', val: p.resources.salt },
                    { key: 'wax', label: 'Воск', val: p.resources.wax },
                  ].map((res) => (
                    <Tooltip key={res.key} text={`${res.label}: ${res.val}`} className="w-full">
                      <div className="flex items-center justify-between gap-1.5 w-full px-1.5 py-0.5 rounded-xl hover:bg-amber-900/10 transition-colors">
                        <img src={`/assets/resources/${res.key}.png`} alt={res.label} className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
                        <span className="text-xl sm:text-2xl font-bold text-amber-950 text-oldrus drop-shadow">{res.val}</span>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Larger Thumbnail of Current Monastery Building */}
                <div className="flex flex-col items-center gap-1 border-t border-amber-900/20 pt-2.5 w-full">
                  <span className="text-[10px] font-bold text-amber-950 text-oldrus tracking-wider">
                    Здание:
                  </span>
                  <div className="w-18 h-24 sm:w-20 sm:h-26 rounded-2xl overflow-hidden border-2 border-amber-800 shadow-md relative group">
                    <img
                      src={`/assets/buildings/${currentBuildingDisplay}.jpg`}
                      alt={getBuildingLabel(currentBuildingDisplay)}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-1 text-center border-t border-stone-900/60">
                      <span className="text-[9px] font-sans font-bold text-amber-200 tracking-wider block truncate px-0.5">
                        {getBuildingLabel(currentBuildingDisplay)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explicit Expand Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(p.id);
                  }}
                  className="w-full py-1.5 px-2 rounded-xl bg-amber-900/15 border border-amber-900/30 text-amber-950 font-bold text-xs text-oldrus tracking-wider flex items-center justify-center gap-1 hover:bg-amber-900/25 transition-all shadow-sm mt-1 cursor-pointer"
                >
                  <span>Раскрыть</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            );
          }

          // --- EXPANDED STATE (Раскрытый полный кодекс обители) ---
          return (
            <div
              key={p.id}
              className={`parchment-codex p-5 sm:p-6 rounded-3xl flex flex-col gap-5 relative shadow-2xl border-4 transition-all duration-300 w-full ${
                isActive
                  ? 'border-amber-400 ring-4 ring-amber-400/40 gold-border-glow'
                  : 'border-amber-900/60 opacity-95'
              }`}
            >
              {/* Header Badge */}
              <div className="flex justify-between items-center border-b border-amber-900/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-amber-900/30"
                    style={{ backgroundColor: p.color }}
                  />
                  <h3 className="text-lg sm:text-xl text-amber-950 text-oldrus font-bold tracking-wide">
                    {p.name}
                  </h3>
                  {isActive && (
                    <span className="text-[10px] bg-amber-500/25 text-amber-950 px-2 py-0.5 rounded-full border border-amber-600/40 font-bold animate-pulse text-oldrus tracking-wider">
                      Ходит ⚜️
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans bg-amber-900/15 px-2.5 py-0.5 rounded-full text-amber-950 border border-amber-900/30 font-bold">
                    🏆 {victoryPoints} ПО
                  </span>
                </div>
              </div>

              {/* Resource icons Grid */}
              <div className="grid grid-cols-5 gap-2 text-center py-1">
                <Tooltip text="Молва" multiline>
                  <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                    <img src="/assets/resources/molva.png" alt="Молва" className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />
                    <span className="text-[11px] text-amber-950 font-bold text-oldrus">Молва</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{p.resources.molva}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Серебро" multiline>
                  <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                    <img src="/assets/resources/silver.png" alt="Серебро" className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />
                    <span className="text-[11px] text-amber-950 font-bold text-oldrus">Серебро</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{p.resources.silver}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Хлеб" multiline>
                  <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                    <img src="/assets/resources/bread.png" alt="Хлеб" className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />
                    <span className="text-[11px] text-amber-950 font-bold text-oldrus">Хлеб</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{p.resources.bread}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Соль" multiline>
                  <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                    <img src="/assets/resources/salt.png" alt="Соль" className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />
                    <span className="text-[11px] text-amber-950 font-bold text-oldrus">Соль</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{p.resources.salt}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Воск" multiline>
                  <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                    <img src="/assets/resources/wax.png" alt="Воск" className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl" />
                    <span className="text-[11px] text-amber-950 font-bold text-oldrus">Воск</span>
                    <span className="text-2xl sm:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{p.resources.wax}</span>
                  </div>
                </Tooltip>
              </div>

              {/* Special Tokens & Relics Bar */}
              <div className="flex flex-wrap gap-2 text-xs font-bold text-amber-950 border-y border-amber-900/20 py-2">
                <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.blessing ? 'bg-indigo-900/20 border-indigo-600/50 text-indigo-950' : 'opacity-40 border-stone-400'}`}>
                  <Heart size={13} className={p.tokens.blessing ? "fill-indigo-700 text-indigo-700" : ""} />
                  Благословение
                </span>
                <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.artel ? 'bg-orange-900/20 border-orange-600/50 text-orange-950' : 'opacity-40 border-stone-400'}`}>
                  {p.tokens.artel && <img src="/assets/artel.png" alt="Артель" className="w-3.5 h-4.5 object-cover rounded" />}
                  Артель
                </span>
                <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.warrior ? 'bg-amber-900/20 border-amber-600/50 text-amber-950' : 'opacity-40 border-stone-400'}`}>
                  {p.helpers.warrior && <img src="/assets/warrior.png" alt="Дружинник" className="w-3.5 h-4.5 object-cover rounded" />}
                  Дружинник
                </span>
                <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.bear ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-950' : 'opacity-40 border-stone-400'}`}>
                  {p.helpers.bear && <img src="/assets/bear.png" alt="Медведь" className="w-3.5 h-4.5 object-cover rounded" />}
                  Медведь
                </span>
              </div>

              {/* Buildings Track for Construction */}
              <div>
                <h4 className="text-base text-amber-950 text-oldrus mb-2 font-bold">Строительство обители:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {buildingSeq.map((b) => {
                    const built = p.buildings[b];
                    const activeNext = nextBuilding === b;
                    const costMet = canBuild(p, b);

                    return (
                      <Tooltip key={b} text={`${getBuildingLabel(b)}\n${getBuildingDesc(b)}\nСтоимость: ${renderBuildingCost(b)}${p.relics[b] ? `\n🔖 Реликвия: ${p.relics[b] === 'obraz' ? 'Образ' : 'Житие'}` : ''}`} multiline>
                        <div className="aspect-[3/4] relative w-full">
                          <button
                            onClick={() => costMet && onBuild(b)}
                            disabled={!costMet}
                            className={`w-full h-full rounded-xl border-2 flex flex-col items-stretch justify-end transition-all relative overflow-hidden shadow-md ${
                              built
                                ? 'border-emerald-700 ring-1 ring-emerald-600/60 scale-[0.98]'
                                : activeNext
                                ? costMet
                                  ? 'border-amber-400 ring-4 ring-amber-400 gold-glow cursor-pointer scale-105 animate-bounce'
                                  : 'border-amber-900/40 ring-1 ring-amber-900/20'
                                : 'border-stone-900/30 opacity-30 grayscale'
                            }`}
                          >
                            <img
                              src={`/assets/buildings/${b}.jpg`}
                              alt={getBuildingLabel(b)}
                              className={`absolute inset-0 w-full h-full object-cover transition-all ${
                                built ? '' : 'grayscale opacity-40'
                              }`}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-1 text-center border-t border-stone-900/60 z-10">
                              <span className="text-[9px] font-sans font-bold text-amber-200 tracking-wider block truncate px-0.5">
                                {getBuildingLabel(b)}
                              </span>
                            </div>
                            {built && (
                              <span className="absolute top-1 right-1 bg-emerald-700 text-white p-0.5 rounded-full border border-emerald-300 shadow z-10">
                                <CheckCircle2 size={12} />
                              </span>
                            )}
                            {p.relics[b] && (
                              <span className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full border shadow z-10 ${
                                p.relics[b] === 'obraz'
                                  ? 'bg-amber-600 text-yellow-100 border-amber-400'
                                  : 'bg-indigo-700 text-indigo-100 border-indigo-400'
                              }`}>
                                {p.relics[b] === 'obraz' ? 'О' : 'Ж'}
                              </span>
                            )}
                          </button>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Tray: Explicit Collapse Button at Bottom Left + Turn Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-amber-900/20 pt-4 mt-auto w-full">
                <button
                  type="button"
                  onClick={() => toggleExpand(p.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-900/15 border border-amber-900/30 text-amber-950 hover:bg-amber-900/25 transition-all flex items-center gap-1.5 text-xs font-bold text-oldrus shadow-sm cursor-pointer"
                >
                  <span>Свернуть</span>
                  <ChevronUp size={15} />
                </button>

                {isActive && (
                  <div className="flex flex-wrap gap-2.5 items-center justify-end">
                    {p.monksCount < 3 && (
                      <button
                        onClick={onRecruitMonk}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-indigo-100 border border-indigo-400/60 hover:from-indigo-850 hover:to-indigo-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <PlusCircle size={16} />
                        <span>Постриг монаха</span>
                      </button>
                    )}

                    {currentCellType.startsWith('city_') && phase === 'EVENT_ACTION' && (
                      <>
                        <button
                          onClick={() => onVisitCity(currentCellType.replace('city_', '') as any)}
                          className="px-5 py-2.5 btn-red-gold rounded-xl text-xs font-bold transition-all cursor-pointer text-oldrus tracking-wider shadow-lg"
                        >
                          Выполнить действие
                        </button>
                        <button
                          onClick={onSkipLocation}
                          className="px-4 py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          Пропустить
                        </button>
                      </>
                    )}

                    {phase === 'EVENT_ACTION' && (currentCellType === 'village' || currentCellType === 'saltworks') && (
                      <>
                        <button
                          onClick={() => onPerformCellAction(currentCellType as 'village' | 'saltworks')}
                          className="px-5 py-2.5 btn-green-gold rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
                        >
                          {currentCellType === 'village' ? 'Собрать урожай' : 'Добыть соль'}
                        </button>
                        <button
                          onClick={onSkipCellAction}
                          className="px-4 py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          Пропустить
                        </button>
                      </>
                    )}

                    {phase === 'BUILD' && (
                      <button
                        onClick={onEndTurn}
                        className="px-6 py-3 btn-red-gold font-bold rounded-xl text-sm transition-all gold-glow cursor-pointer text-oldrus tracking-widest shadow-xl"
                      >
                        Завершить ход ➔
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
