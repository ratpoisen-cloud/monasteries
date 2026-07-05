import React from 'react';
import type { LetopisCard, Player } from '../types/game';
import { Scroll, Coins, Wheat, Check } from 'lucide-react';
import { Dice } from './Dice';
import { asset } from '../utils/paths';

interface EventModalProps {
  card: LetopisCard | null;
  player: Player;
  diceRollResult: number | null;
  diceRolling: boolean;
  onBribe: (method: 'silver' | 'bread' | 'wax') => void;
  onUseHelper: (helper: 'warrior' | 'bear' | 'none') => void;
  onRollDice: () => void;
  onResolve: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  card,
  player,
  diceRollResult,
  diceRolling,
  onBribe,
  onUseHelper,
  onRollDice,
  onResolve,
}) => {
  if (!card) return null;

  const hasHelpers = player.helpers.warrior || player.helpers.bear;
  const isDeathCheck = card.actionType === 'monk_death_check';
  const hasRolled = diceRollResult !== null;
  const rollIsOdd = hasRolled && diceRollResult % 2 !== 0;
  const rollIsEven = hasRolled && diceRollResult % 2 === 0;
  const bribeOptions = card.actionPayload?.bribeOptions as Record<string, number> | undefined;

  const showRollButton = isDeathCheck && !hasRolled && !diceRolling;
  const showDangerChoice = isDeathCheck && rollIsOdd;
  const showAccept = (!isDeathCheck && !card.requiresDiceRoll) || (isDeathCheck && rollIsEven);

  const renderRewardItems = () => {
    const items: React.ReactNode[] = [];

    if (card.actionType === 'resource_gain' && card.actionPayload) {
      const payload = card.actionPayload;
      const resLabels: Record<string, string> = { bread: 'Хлеб', silver: 'Серебро', wax: 'Воск', salt: 'Соль', molva: 'Молва' };
      Object.entries(payload).forEach(([res, val]) => {
        if (typeof val === 'number') {
          items.push(
            <div key={`gain_${res}`} className="flex items-center gap-2.5 px-3 py-1 text-center">
              <img src={asset(`resources/${res}.png`)} alt={resLabels[res] || res} className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl hover:scale-110 transition-transform" />
              <span className="text-xl sm:text-2xl font-bold text-amber-950 text-oldrus drop-shadow">+{val} {resLabels[res] || res}</span>
            </div>
          );
        }
      });
    } else if (card.actionType === 'resource_loss' && card.actionPayload) {
      const payload = card.actionPayload;
      const resLabels: Record<string, string> = { bread: 'Хлеб', silver: 'Серебро', wax: 'Воск', salt: 'Соль', molva: 'Молва' };
      Object.entries(payload).forEach(([res, val]) => {
        if (typeof val === 'number') {
          items.push(
            <div key={`loss_${res}`} className="flex items-center gap-2.5 px-3 py-1 text-center">
              <img src={asset(`resources/${res}.png`)} alt={resLabels[res] || res} className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-xl opacity-90 hover:scale-110 transition-transform" />
              <span className="text-xl sm:text-2xl font-bold text-red-900 text-oldrus drop-shadow">-{val} {resLabels[res] || res}</span>
            </div>
          );
        }
      });
    } else if (card.actionType === 'place_token' && card.actionPayload) {
      const tokenType = card.actionPayload.type;
      const tokenNames: Record<string, string> = {
        village: 'Жетон «Село»',
        saltworks: 'Жетон «Солеварня»',
        river: 'Жетон «Река»',
        fortress: 'Жетон «Крепость»',
        windfall: 'Жетон «Бурелом»',
      };
      items.push(
        <div key="token" className="flex items-center gap-3 px-3 py-1">
          <img src={asset(`${tokenType}.png`)} alt={tokenNames[tokenType]} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xl hover:scale-110 transition-transform" />
          <span className="text-lg sm:text-xl font-bold text-amber-950 text-oldrus drop-shadow">{tokenNames[tokenType] || 'Новый жетон'}</span>
        </div>
      );
    } else if (card.actionType === 'get_helper' && card.actionPayload) {
      const helperType = card.actionPayload.type;
      const helperNames: Record<string, string> = { warrior: 'Помощник «Дружинник»', bear: 'Помощник «Медведь»' };
      items.push(
        <div key="helper" className="flex items-center gap-3 px-3 py-1">
          <img src={asset(`${helperType}.png`)} alt={helperNames[helperType]} className="w-11 h-14 object-cover rounded-xl border border-amber-900/40 shadow-lg hover:scale-110 transition-transform" />
          <span className="text-lg sm:text-xl font-bold text-amber-950 text-oldrus drop-shadow">{helperNames[helperType] || 'Помощник'}</span>
        </div>
      );
    } else if (card.actionType === 'wildcard') {
      items.push(
        <div key="obraz" className="flex items-center gap-3 px-3 py-1">
          <img src={asset('obraz.png')} alt="Образ" className="w-9 h-12 object-contain drop-shadow-xl hover:scale-110 transition-transform" />
          <span className="text-lg sm:text-xl font-bold text-amber-950 text-oldrus drop-shadow">Карта «Образ» (+1 ПО)</span>
        </div>
      );
    }

    if (items.length === 0) return null;

    return (
      <div className="flex flex-col items-center gap-1.5 w-full my-2">
        <span className="text-xs font-bold text-amber-900/80 text-oldrus tracking-widest uppercase">
          {card.actionType === 'resource_loss' ? 'Потери:' : 'Выпадающие предметы / Эффект:'}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {items}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="parchment-codex max-w-lg w-full p-8 sm:p-10 flex flex-col gap-5 shadow-2xl relative items-center justify-center border-4 double border-amber-900/80 rounded-3xl animate-scale-in text-center">
        <div className="absolute top-3 left-3 right-3 bottom-3 border border-amber-900/20 pointer-events-none rounded-2xl" />

        {/* Illuminated Relic Graphic */}
        <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-600/40 p-2 flex items-center justify-center shadow-inner gold-glow my-1">
          <Scroll className="w-8 h-8 text-amber-950" />
        </div>

        <h2 className="text-3xl sm:text-4xl text-oldrus text-amber-950 font-bold tracking-wider drop-shadow-sm">
          {card.title}
        </h2>

        {card.quote && (
          <div className="border-y border-amber-900/20 py-3 w-full flex flex-col gap-1 items-center">
            <p className="text-base italic text-amber-900/90 font-medium leading-relaxed">
              {card.quote}
            </p>
            {card.quoteSource && (
              <span className="text-xs font-semibold text-amber-900/70 tracking-wide">
                {card.quoteSource}
              </span>
            )}
          </div>
        )}

        <p className="text-sm sm:text-base font-semibold leading-relaxed text-amber-950 px-2">
          {card.description}
        </p>

        {renderRewardItems()}

        {(card.requiresDiceRoll || isDeathCheck) && !diceRolling && (
          <div className="my-2">
            <Dice result={diceRollResult} rolling={diceRolling} />
          </div>
        )}

        <div className="w-full flex flex-col gap-3 mt-2 z-10">
          {/* 1. Roll Dice button */}
          {showRollButton && (
            <button
              onClick={onRollDice}
              className="w-full py-3.5 btn-red-gold font-bold rounded-2xl text-base cursor-pointer text-oldrus tracking-widest shadow-xl"
            >
              Бросить кубик (Чет — спасение)
            </button>
          )}

          {/* 2. Danger choice after odd roll: bribe + helper + accept death */}
          {showDangerChoice && (
            <div className="flex flex-col gap-3.5 w-full">
              <span className="text-xs font-bold text-red-900 bg-red-500/15 py-1.5 px-3 rounded-full border border-red-600/30 uppercase tracking-widest shadow-sm">
                ⚠️ Монах под угрозой гибели!
              </span>

              {/* Bribe options */}
              {bribeOptions && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(bribeOptions).map(([resource, cost]) => {
                    const resKey = resource as keyof Player['resources'];
                    const canPay = player.resources[resKey] >= cost;
                    const labels: Record<string, string> = {
                      silver: 'Серебро',
                      bread: 'Хлеб',
                      wax: 'Воск',
                    };
                    return (
                      <button
                        key={resource}
                        onClick={() => onBribe(resource as 'silver' | 'bread')}
                        disabled={!canPay}
                        className={`py-3 px-2 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 border text-xs transition-all shadow ${
                          canPay
                            ? 'bg-amber-950/15 text-amber-950 border-amber-900/40 hover:bg-amber-950/25 cursor-pointer'
                            : 'opacity-40 bg-stone-300 text-stone-600 border-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {resource === 'silver' ? <Coins size={18} /> : <Wheat size={18} />}
                        <span>Откупиться ({cost} {labels[resource]})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Helper sacrifice */}
              {hasHelpers && (
                <div className="grid grid-cols-2 gap-3">
                  {player.helpers.warrior && (
                    <button
                      onClick={() => onUseHelper('warrior')}
                      className="py-2.5 px-2 bg-amber-950/10 text-amber-950 border border-amber-900/40 hover:bg-amber-950/20 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 text-xs transition-all cursor-pointer shadow"
                    >
                      <img src={asset('warrior.png')} alt="Дружинник" className="w-10 h-14 object-cover rounded-xl border border-amber-800/40 shadow" />
                      <span>Пожертвовать Дружинником</span>
                    </button>
                  )}
                  {player.helpers.bear && (
                    <button
                      onClick={() => onUseHelper('bear')}
                      className="py-2.5 px-2 bg-amber-950/10 text-amber-950 border border-amber-900/40 hover:bg-amber-950/20 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 text-xs transition-all cursor-pointer shadow"
                    >
                      <img src={asset('bear.png')} alt="Медведь" className="w-10 h-14 object-cover rounded-xl border border-amber-800/40 shadow" />
                      <span>Пожертвовать Медведем</span>
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => onUseHelper('none')}
                className="w-full py-3 bg-gradient-to-r from-red-900 to-red-950 text-red-100 hover:from-red-850 hover:to-red-900 rounded-2xl font-bold transition-all text-xs border border-red-700/50 shadow cursor-pointer"
              >
                Принять гибель Монаха (+1 ПО «Житие»)
              </button>
            </div>
          )}

          {/* 3. Accept/Resolve for standard cards or even roll (safe) */}
          {showAccept && (
            <button
              onClick={onResolve}
              className="w-full py-3.5 btn-red-gold font-bold rounded-2xl text-base flex items-center justify-center gap-2 cursor-pointer text-oldrus tracking-widest shadow-xl"
            >
              <Check size={20} />
              <span>Принять летопись</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
