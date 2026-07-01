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
import { asset } from '../utils/paths';

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

          return (
            <React.Fragment key={p.id}>
              {/* ===== ДЕСКТОП (md+): collapsed / expanded ===== */}
              <div className="hidden xl:block">
                {!isExpanded ? (
                  /* --- COLLAPSED --- */
                  <div
                    onClick={() => toggleExpand(p.id)}
                    className={`parchment-codex p-2 xl:p-3 rounded-2xl xl:rounded-3xl flex flex-row xl:flex-col items-center gap-1.5 xl:gap-3 cursor-pointer hover:scale-[1.02] xl:hover:scale-[1.03] transition-all border-4 shadow-2xl w-full xl:max-w-[155px] xl:mx-auto relative ${
                      isActive
                        ? 'border-amber-400 ring-2 xl:ring-4 ring-amber-400/40 gold-border-glow'
                        : 'border-amber-900/60 opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-row xl:flex-col items-center gap-1 xl:gap-1.5 xl:w-full xl:border-b xl:border-amber-900/20 xl:pb-2 xl:text-center flex-shrink-0">
                      <div className="flex items-center gap-1 xl:gap-1.5 justify-center">
                        <span className="w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-full shadow-sm ring-1 ring-amber-900/30 flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <h3 className="text-[10px] xl:text-sm font-bold text-amber-950 text-oldrus tracking-wide truncate max-w-[50px] xl:max-w-[100px]" title={p.name}>
                          {p.name.replace('монастырь', '').trim()}
                        </h3>
                      </div>
                      {isActive && (
                        <span className="text-[7px] xl:text-[9px] bg-amber-500/25 text-amber-950 px-1 xl:px-2 py-0 rounded-full xl:py-0.5 border border-amber-600/40 font-bold animate-pulse text-oldrus tracking-wider hidden xl:inline">Ходит ⚜️</span>
                      )}
                      <span className="text-[8px] xl:text-[11px] font-sans bg-amber-900/15 px-1.5 xl:px-2.5 py-0.5 rounded-full text-amber-950 border border-amber-900/30 font-bold whitespace-nowrap">🏆 {victoryPoints}</span>
                    </div>
                    <div className="flex flex-row xl:flex-col gap-0.5 xl:gap-2 xl:w-full xl:py-1 xl:px-1 flex-shrink-0">
                      {[
                        { key: 'molva', label: 'Молва', val: p.resources.molva },
                        { key: 'silver', label: 'Серебро', val: p.resources.silver },
                        { key: 'bread', label: 'Хлеб', val: p.resources.bread },
                        { key: 'salt', label: 'Соль', val: p.resources.salt },
                        { key: 'wax', label: 'Воск', val: p.resources.wax },
                      ].map((res) => (
                        <Tooltip key={res.key} text={`${res.label}: ${res.val}`} className="flex-shrink-0">
                          <div className="flex items-center gap-0.5 xl:justify-between xl:w-full xl:px-1.5 xl:py-0.5 xl:rounded-xl hover:bg-amber-900/10 transition-colors">
                            <img src={asset(`resources/${res.key}.png`)} alt={res.label} className="w-4 h-4 xl:w-9 xl:h-10 object-contain drop-shadow-md" />
                            <span className="text-[9px] xl:text-xl font-bold text-amber-950 text-oldrus drop-shadow">{res.val}</span>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 xl:flex-col xl:gap-1 xl:w-full xl:border-t xl:border-amber-900/20 xl:pt-2.5 flex-shrink-0">
                      <div className="hidden xl:flex flex-col items-center gap-1 w-full">
                        <span className="text-[10px] font-bold text-amber-950 text-oldrus tracking-wider">Здание:</span>
                      </div>
                      <div className="w-6 h-8 xl:w-18 xl:h-24 rounded-md xl:rounded-2xl overflow-hidden border border-amber-800 xl:border-2 shadow-md relative group flex-shrink-0">
                        <img src={asset(`buildings/${currentBuildingDisplay}.jpg`)} alt={getBuildingLabel(currentBuildingDisplay)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-0 xl:py-1 text-center border-t border-stone-900/60">
                          <span className="text-[5px] xl:text-[9px] font-sans font-bold text-amber-200 tracking-wider block truncate px-0.5">{getBuildingLabel(currentBuildingDisplay)}</span>
                        </div>
                        {p.relics[currentBuildingDisplay] && (
                          <span className={`absolute top-0 left-0 text-[5px] xl:text-[8px] font-bold px-0.5 xl:px-1 rounded-sm xl:rounded-full border shadow z-10 ${
                            p.relics[currentBuildingDisplay] === 'obraz' ? 'bg-amber-600 text-yellow-100 border-amber-400' : 'bg-indigo-700 text-indigo-100 border-indigo-400'
                          }`}>{p.relics[currentBuildingDisplay] === 'obraz' ? 'О' : 'Ж'}</span>
                        )}
                      </div>
                      <div className="flex xl:hidden gap-0.5 items-center">
                        {p.tokens.blessing && <span className="text-[6px] bg-indigo-700 text-indigo-100 px-1 py-0.5 rounded border border-indigo-400 font-bold">Б</span>}
                        {p.tokens.artel && <img src={asset('artel.png')} alt="Арт" className="w-3.5 h-4 object-cover rounded" />}
                        {p.helpers.warrior && <img src={asset('warrior.png')} alt="Др" className="w-3.5 h-4 object-cover rounded" />}
                        {p.helpers.bear && <img src={asset('bear.png')} alt="Мед" className="w-3.5 h-4 object-cover rounded" />}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(p.id); }}
                      className="xl:w-full py-1 xl:py-1.5 px-1.5 xl:px-2 rounded-xl bg-amber-900/15 border border-amber-900/30 text-amber-950 font-bold text-[9px] xl:text-xs text-oldrus tracking-wider flex items-center justify-center gap-0.5 xl:gap-1 hover:bg-amber-900/25 transition-all shadow-sm cursor-pointer flex-shrink-0"
                    >
                      <span className="hidden xl:inline">Раскрыть</span>
                      <ChevronDown size={12} />
                    </button>
                  </div>
                ) : (
                  /* --- EXPANDED --- */
                  <div className={`parchment-codex p-3 xl:p-5 rounded-2xl xl:rounded-3xl flex flex-col gap-3 xl:gap-5 relative shadow-2xl border-4 transition-all duration-300 w-full ${
                    isActive ? 'border-amber-400 ring-2 xl:ring-4 ring-amber-400/40 gold-border-glow' : 'border-amber-900/60 opacity-95'
                  }`}>
                    <div className="flex justify-between items-center border-b border-amber-900/20 pb-2">
                      <div className="flex items-center gap-1.5 xl:gap-2">
                        <span className="w-3 h-3 xl:w-3.5 xl:h-3.5 rounded-full shadow-sm ring-1 ring-amber-900/30 flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <h3 className="text-base xl:text-xl text-amber-950 text-oldrus font-bold tracking-wide truncate max-w-[160px] xl:max-w-none">{p.name}</h3>
                        {isActive && (
                          <span className="text-[8px] xl:text-[10px] bg-amber-500/25 text-amber-950 px-1.5 xl:px-2 py-0.5 rounded-full border border-amber-600/40 font-bold animate-pulse text-oldrus tracking-wider flex-shrink-0">Ходит ⚜️</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 xl:gap-2 flex-shrink-0">
                        <span className="text-[10px] xl:text-xs font-sans bg-amber-900/15 px-2 xl:px-2.5 py-0.5 rounded-full text-amber-950 border border-amber-900/30 font-bold">🏆 {victoryPoints} ПО</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 xl:gap-2 text-center">
                      {[ 
                        { key: 'molva', label: 'Молва', val: p.resources.molva },
                        { key: 'silver', label: 'Серебро', val: p.resources.silver },
                        { key: 'bread', label: 'Хлеб', val: p.resources.bread },
                        { key: 'salt', label: 'Соль', val: p.resources.salt },
                        { key: 'wax', label: 'Воск', val: p.resources.wax },
                      ].map((res) => (
                        <Tooltip key={res.key} text={res.label} multiline>
                          <div className="flex flex-col items-center gap-0.5 hover:scale-105 transition-transform cursor-pointer">
                            <img src={asset(`resources/${res.key}.png`)} alt={res.label} className="w-12 h-12 xl:w-14 xl:h-14 object-contain drop-shadow-xl" />
                            <span className="text-[10px] xl:text-[11px] text-amber-950 font-bold text-oldrus">{res.label}</span>
                            <span className="text-2xl xl:text-3xl font-bold text-amber-950 text-oldrus drop-shadow">{res.val}</span>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 xl:gap-2 text-[11px] xl:text-xs font-bold text-amber-950 border-y border-amber-900/20 py-1.5 xl:py-2">
                      <span className={`px-2 xl:px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.blessing ? 'bg-indigo-900/20 border-indigo-600/50 text-indigo-950' : 'opacity-40 border-stone-400'}`}>
                        <Heart size={12} className={p.tokens.blessing ? "fill-indigo-700 text-indigo-700" : ""} />Благословение
                      </span>
                      <span className={`px-2 xl:px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.artel ? 'bg-orange-900/20 border-orange-600/50 text-orange-950' : 'opacity-40 border-stone-400'}`}>
                        {p.tokens.artel && <img src={asset('artel.png')} alt="Артель" className="w-4 h-5 object-cover rounded" />}Артель
                      </span>
                      <span className={`px-2 xl:px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.warrior ? 'bg-amber-900/20 border-amber-600/50 text-amber-950' : 'opacity-40 border-stone-400'}`}>
                        {p.helpers.warrior && <img src={asset('warrior.png')} alt="Дружинник" className="w-4 h-5 object-cover rounded" />}Дружинник
                      </span>
                      <span className={`px-2 xl:px-2.5 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.bear ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-950' : 'opacity-40 border-stone-400'}`}>
                        {p.helpers.bear && <img src={asset('bear.png')} alt="Медведь" className="w-4 h-5 object-cover rounded" />}Медведь
                      </span>
                    </div>
                    {/* Relic cards (Desktop) */}
                    {Object.values(p.relics).filter(Boolean).length > 0 && (
                      <div>
                        <h4 className="text-sm xl:text-base text-amber-950 text-oldrus mb-1.5 xl:mb-2 font-bold">Реликвии:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(Object.entries(p.relics) as [string, string][]).filter(([, v]) => v).map(([building, relicType]) => (
                            <div key={building} className="flex items-center gap-1.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl px-2.5 py-1.5 border border-amber-600/40 shadow-sm">
                              <img src={asset(`${relicType}.png`)} alt={relicType === 'obraz' ? 'Образ' : 'Житие'} className="w-8 h-8 xl:w-10 xl:h-10 object-contain drop-shadow-md" />
                              <div className="flex flex-col">
                                <span className="text-[10px] xl:text-xs font-bold text-amber-950 text-oldrus">{relicType === 'obraz' ? 'Образ' : 'Житие'}</span>
                                <span className="text-[8px] xl:text-[9px] text-amber-800 font-semibold">({getBuildingLabel(building)})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm xl:text-base text-amber-950 text-oldrus mb-1.5 xl:mb-2 font-bold">Строительство обители:</h4>
                      <div className="grid grid-cols-3 xl:grid-cols-5 gap-1.5 xl:gap-2">
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
                                  className={`w-full h-full rounded-lg xl:rounded-xl border-2 flex flex-col items-stretch justify-end transition-all relative overflow-hidden shadow-md ${
                                    built ? 'border-emerald-700 ring-1 ring-emerald-600/60 scale-[0.98]' : activeNext ? costMet ? 'border-amber-400 ring-2 xl:ring-4 ring-amber-400 gold-glow cursor-pointer scale-105 animate-bounce' : 'border-amber-900/40 ring-1 ring-amber-900/20' : 'border-stone-900/30 opacity-30 grayscale'
                                  }`}
                                >
                                  <img src={asset(`buildings/${b}.jpg`)} alt={getBuildingLabel(b)} className={`absolute inset-0 w-full h-full object-cover transition-all ${built ? '' : 'grayscale opacity-40'}`} />
                                  <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-1 text-center border-t border-stone-900/60 z-10">
                                    <span className="text-[7px] xl:text-[9px] font-sans font-bold text-amber-200 tracking-wider block truncate px-0.5">{getBuildingLabel(b)}</span>
                                  </div>
                                  {built && (
                                    <span className="absolute top-0.5 xl:top-1 right-0.5 xl:right-1 bg-emerald-700 text-white p-0.5 rounded-full border border-emerald-300 shadow z-10">
                                      <CheckCircle2 size={10} />
                                    </span>
                                  )}
                                  {p.relics[b] && (
                                    <span className={`absolute top-0.5 xl:top-1 left-0.5 xl:left-1 text-[6px] xl:text-[8px] font-bold px-1 xl:px-1.5 py-0.5 rounded-full border shadow z-10 ${
                                      p.relics[b] === 'obraz' ? 'bg-amber-600 text-yellow-100 border-amber-400' : 'bg-indigo-700 text-indigo-100 border-indigo-400'
                                    }`}>{p.relics[b] === 'obraz' ? 'О' : 'Ж'}</span>
                                  )}
                                </button>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 xl:gap-3 border-t-2 border-amber-900/20 pt-3 xl:pt-4 mt-auto w-full">
                      <button type="button" onClick={() => toggleExpand(p.id)} className="px-3 xl:px-3.5 py-2 xl:py-2.5 rounded-xl bg-amber-900/15 border border-amber-900/30 text-amber-950 hover:bg-amber-900/25 transition-all flex items-center gap-1 xl:gap-1.5 text-[10px] xl:text-xs font-bold text-oldrus shadow-sm cursor-pointer">
                        <span>Свернуть</span>
                        <ChevronUp size={13} />
                      </button>
                      {isActive && (
                        <div className="flex flex-wrap gap-2 items-center justify-end">
                          {p.monksCount < 3 && (
                            <button onClick={onRecruitMonk} className="px-3 xl:px-4 py-2 xl:py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-indigo-100 border border-indigo-400/60 hover:from-indigo-850 hover:to-indigo-900 rounded-xl text-[10px] xl:text-xs font-bold transition-all flex items-center gap-1 xl:gap-1.5 shadow-lg cursor-pointer">
                              <PlusCircle size={14} /><span>Постриг монаха</span>
                            </button>
                          )}
                          {currentCellType.startsWith('city_') && phase === 'EVENT_ACTION' && (
                            <>
                              <button onClick={() => onVisitCity(currentCellType.replace('city_', '') as any)} className="px-4 py-2 xl:px-5 xl:py-2.5 btn-red-gold rounded-xl text-[10px] xl:text-xs font-bold transition-all cursor-pointer text-oldrus tracking-wider shadow-lg">Выполнить действие</button>
                              <button onClick={onSkipLocation} className="px-3 xl:px-4 py-2 xl:py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-[10px] xl:text-xs font-semibold transition-all cursor-pointer">Пропустить</button>
                            </>
                          )}
                          {phase === 'EVENT_ACTION' && (currentCellType === 'village' || currentCellType === 'saltworks') && (
                            <>
                              <button onClick={() => onPerformCellAction(currentCellType as 'village' | 'saltworks')} className="px-4 py-2 xl:px-5 xl:py-2.5 btn-green-gold rounded-xl text-[10px] xl:text-xs font-bold transition-all cursor-pointer shadow-lg">{currentCellType === 'village' ? 'Собрать урожай' : 'Добыть соль'}</button>
                              <button onClick={onSkipCellAction} className="px-3 xl:px-4 py-2 xl:py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-[10px] xl:text-xs font-semibold transition-all cursor-pointer">Пропустить</button>
                            </>
                          )}
                          {phase === 'BUILD' && (
                            <button onClick={onEndTurn} className="px-5 py-2.5 xl:px-6 xl:py-3 btn-red-gold font-bold rounded-xl text-sm transition-all gold-glow cursor-pointer text-oldrus tracking-widest shadow-xl">Завершить ход ➔</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ===== МОБИЛКА (<md): всегда развёрнутый карточка игрока ===== */}
              <div className={`xl:hidden parchment-codex p-3 rounded-2xl flex flex-col gap-2.5 border-4 shadow-2xl w-full ${
                isActive ? 'border-amber-400 ring-2 ring-amber-400/40 gold-border-glow' : 'border-amber-900/60'
              }`}>
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shadow-sm ring-1 ring-amber-900/30 flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-bold text-amber-950 text-oldrus">{p.name.replace('монастырь', '').trim()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isActive && <span className="text-[8px] bg-amber-500/25 text-amber-950 px-1.5 py-0.5 rounded-full border border-amber-600/40 font-bold animate-pulse text-oldrus tracking-wider">Ходит ⚜️</span>}
                    <span className="text-[10px] font-sans bg-amber-900/15 px-2 py-0.5 rounded-full text-amber-950 border border-amber-900/30 font-bold">🏆 {victoryPoints} ПО</span>
                  </div>
                </div>

                {/* Resources row */}
                <div className="flex justify-around items-center bg-amber-950/5 rounded-xl py-2 border border-amber-900/15">
                  {[
                    { key: 'molva', val: p.resources.molva },
                    { key: 'silver', val: p.resources.silver },
                    { key: 'bread', val: p.resources.bread },
                    { key: 'salt', val: p.resources.salt },
                    { key: 'wax', val: p.resources.wax },
                  ].map((res) => (
                    <div key={res.key} className="flex flex-col items-center gap-0">
                      <img src={asset(`resources/${res.key}.png`)} alt="" className="w-9 h-9 object-contain drop-shadow-md" />
                      <span className="text-base font-bold text-amber-950 text-oldrus drop-shadow">{res.val}</span>
                    </div>
                  ))}
                </div>

                {/* Buildings row */}
                <div className="flex gap-1.5">
                  {buildingSeq.map((b) => {
                    const built = p.buildings[b];
                    const activeNext = nextBuilding === b;
                    const costMet = canBuild(p, b);
                    return (
                      <div key={b} className="flex-1 relative">
                        <button
                          onClick={() => costMet && onBuild(b)}
                          disabled={!costMet}
                          className={`w-full aspect-[3/4] rounded-lg border-2 flex flex-col items-stretch justify-end overflow-hidden shadow-sm relative ${
                            built ? 'border-emerald-700 ring-1 ring-emerald-600/60' : activeNext ? costMet ? 'border-amber-400 ring-2 ring-amber-400 gold-glow cursor-pointer animate-bounce' : 'border-amber-900/40' : 'border-stone-900/30 opacity-30 grayscale'
                          }`}
                        >
                          <img src={asset(`buildings/${b}.jpg`)} alt="" className={`absolute inset-0 w-full h-full object-cover ${built ? '' : 'grayscale opacity-40'}`} />
                          <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-0.5 text-center border-t border-stone-900/60 z-10">
                            <span className="text-[6px] font-sans font-bold text-amber-200 tracking-wider block truncate px-0.5">{getBuildingLabel(b)}</span>
                          </div>
                          {built && <span className="absolute top-0.5 right-0.5 bg-emerald-700 text-white p-0.5 rounded-full border border-emerald-300 shadow z-10"><CheckCircle2 size={8} /></span>}
                          {p.relics[b] && (
                            <span className={`absolute top-0.5 left-0.5 text-[5px] font-bold px-0.5 py-0.5 rounded-full border shadow z-10 ${
                              p.relics[b] === 'obraz' ? 'bg-amber-600 text-yellow-100 border-amber-400' : 'bg-indigo-700 text-indigo-100 border-indigo-400'
                            }`}>{p.relics[b] === 'obraz' ? 'О' : 'Ж'}</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Tokens */}
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-amber-950">
                  <span className={`px-2 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.blessing ? 'bg-indigo-900/20 border-indigo-600/50 text-indigo-950' : 'opacity-40 border-stone-400'}`}>
                    <Heart size={11} className={p.tokens.blessing ? "fill-indigo-700 text-indigo-700" : ""} />Благосл
                  </span>
                  <span className={`px-2 py-1 rounded-xl border flex items-center gap-1 ${p.tokens.artel ? 'bg-orange-900/20 border-orange-600/50 text-orange-950' : 'opacity-40 border-stone-400'}`}>
                    {p.tokens.artel && <img src={asset('artel.png')} alt="" className="w-3 h-4 object-cover rounded" />}Артель
                  </span>
                  <span className={`px-2 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.warrior ? 'bg-amber-900/20 border-amber-600/50 text-amber-950' : 'opacity-40 border-stone-400'}`}>
                    {p.helpers.warrior && <img src={asset('warrior.png')} alt="" className="w-3 h-4 object-cover rounded" />}Дружин
                  </span>
                  <span className={`px-2 py-1 rounded-xl border flex items-center gap-1 ${p.helpers.bear ? 'bg-yellow-900/20 border-yellow-600/50 text-yellow-950' : 'opacity-40 border-stone-400'}`}>
                    {p.helpers.bear && <img src={asset('bear.png')} alt="" className="w-3 h-4 object-cover rounded" />}Медведь
                  </span>
                </div>

                {/* Relic cards (Mobile) */}
                {Object.values(p.relics).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(p.relics) as [string, string][]).filter(([, v]) => v).map(([building, relicType]) => (
                      <div key={building} className="flex items-center gap-1 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg px-2 py-1 border border-amber-600/40 shadow-sm">
                        <img src={asset(`${relicType}.png`)} alt={relicType === 'obraz' ? 'Образ' : 'Житие'} className="w-5 h-5 object-contain drop-shadow-md" />
                        <span className="text-[8px] font-bold text-amber-950 text-oldrus">{relicType === 'obraz' ? 'Образ' : 'Житие'}</span>
                        <span className="text-[7px] text-amber-800 font-semibold">({getBuildingLabel(building)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {isActive && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-900/20">
                    {p.monksCount < 3 && (
                      <button onClick={onRecruitMonk} className="flex-1 min-w-[100px] py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-indigo-100 border border-indigo-400/60 hover:from-indigo-850 hover:to-indigo-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer">
                        <PlusCircle size={14} /><span>Постриг</span>
                      </button>
                    )}
                    {currentCellType.startsWith('city_') && phase === 'EVENT_ACTION' && (
                      <>
                        <button onClick={() => onVisitCity(currentCellType.replace('city_', '') as any)} className="flex-1 min-w-[100px] py-2.5 btn-red-gold rounded-xl text-xs font-bold transition-all cursor-pointer text-oldrus tracking-wider shadow">Выполнить</button>
                        <button onClick={onSkipLocation} className="flex-1 min-w-[80px] py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-xs font-semibold transition-all cursor-pointer">Пропустить</button>
                      </>
                    )}
                    {phase === 'EVENT_ACTION' && (currentCellType === 'village' || currentCellType === 'saltworks') && (
                      <>
                        <button onClick={() => onPerformCellAction(currentCellType as 'village' | 'saltworks')} className="flex-1 min-w-[100px] py-2.5 btn-green-gold rounded-xl text-xs font-bold transition-all cursor-pointer shadow">{currentCellType === 'village' ? 'Урожай' : 'Добыча'}</button>
                        <button onClick={onSkipCellAction} className="flex-1 min-w-[80px] py-2.5 bg-stone-800 text-stone-300 border border-stone-700 hover:bg-stone-750 rounded-xl text-xs font-semibold transition-all cursor-pointer">Пропустить</button>
                      </>
                    )}
                    {phase === 'BUILD' && (
                      <button onClick={onEndTurn} className="flex-1 py-2.5 btn-red-gold font-bold rounded-xl text-xs transition-all gold-glow cursor-pointer text-oldrus tracking-widest shadow">Завершить ход ➔</button>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
