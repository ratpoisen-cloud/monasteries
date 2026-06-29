import React from 'react';
import type { LetopisCard, Player } from '../types/game';
import { Scroll, Skull, Coins, Wheat, Check } from 'lucide-react';
import { Dice } from './Dice';

interface EventModalProps {
  card: LetopisCard | null;
  player: Player;
  diceRollResult: number | null;
  diceRolling: boolean;
  showBribeDialog: boolean;
  onBribe: (method: 'silver' | 'bread' | 'none') => void;
  onUseHelper: (helper: 'warrior' | 'bear' | 'none') => void;
  onRollDice: () => void;
  onResolve: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  card,
  player,
  diceRollResult,
  diceRolling,
  showBribeDialog,
  onBribe,
  onUseHelper,
  onRollDice,
  onResolve,
}) => {
  if (!card) return null;

  const hasHelpers = player.helpers.warrior || player.helpers.bear;
  const isDeathCheck = card.actionType === 'monk_death_check';
  const showHelperChoice = isDeathCheck && hasHelpers && diceRollResult !== null && diceRollResult % 2 !== 0 && !showBribeDialog;
  const showStandardAccept = !isDeathCheck && !card.requiresDiceRoll;
  const showDirectRoll = isDeathCheck && !showBribeDialog && diceRollResult === null && !diceRolling;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* parchment container */}
      <div className="parchment-bg max-w-lg w-full rounded-3xl p-8 relative flex flex-col items-center gap-6 animate-scale-in text-center">
        {/* Header Icon */}
        <Scroll className="w-12 h-12 text-amber-900 border-2 border-amber-900/35 p-2 rounded-full" />

        {/* Card Title */}
        <h2 className="text-4xl text-oldrus text-amber-950 font-bold tracking-wider">
          {card.title}
        </h2>

        {/* Slavonic Quote */}
        {card.quote && (
          <p className="text-md italic text-amber-800 text-oldrus font-semibold leading-relaxed border-y border-amber-900/10 py-3 w-full">
            {card.quote}
          </p>
        )}

        {/* Card Description */}
        <p className="text-sm font-semibold leading-relaxed text-amber-950 px-4">
          {card.description}
        </p>

        {/* Dice Area (when active) */}
        {(card.requiresDiceRoll || isDeathCheck) && !showBribeDialog && (
          <div className="my-2">
            <Dice result={diceRollResult} rolling={diceRolling} />
          </div>
        )}

        {/* --- DYNAMIC ACTIONS PANEL --- */}
        <div className="w-full flex flex-col gap-2 mt-4">
          {/* 1. Bandit Bribe Options */}
          {showBribeDialog && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Выберите действие:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onBribe('silver')}
                  disabled={player.resources.silver < 1}
                  className={`py-3 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all text-xs ${
                    player.resources.silver >= 1
                      ? 'bg-amber-950/10 text-amber-950 border-amber-900/40 hover:bg-amber-950/20'
                      : 'opacity-40 bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Coins size={16} />
                  <span>1 Серебро</span>
                </button>
                <button
                  onClick={() => onBribe('bread')}
                  disabled={player.resources.bread < 2}
                  className={`py-3 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all text-xs ${
                    player.resources.bread >= 2
                      ? 'bg-amber-950/10 text-amber-950 border-amber-900/40 hover:bg-amber-950/20'
                      : 'opacity-40 bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Wheat size={16} />
                  <span>2 Хлеба</span>
                </button>
                <button
                  onClick={() => onBribe('none')}
                  className="py-3 px-2 bg-red-900 text-red-100 border border-red-950 rounded-xl font-bold hover:bg-red-950 transition-all text-xs flex flex-col items-center justify-center gap-1"
                >
                  <Skull size={16} />
                  <span>Испытать судьбу</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Direct Roll Dice (Threat event trigger) */}
          {showDirectRoll && (
            <button
              onClick={onRollDice}
              className="w-full py-3 btn-red-gold font-bold rounded-xl text-sm cursor-pointer text-oldrus tracking-widest"
            >
              Бросить кубик (Чет — спасение)
            </button>
          )}

          {/* 3. Helper Sacrifice Option on Odd roll (Death risk) */}
          {showHelperChoice && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs font-bold text-red-800 bg-red-500/10 py-1 rounded-full border border-red-500/20 uppercase tracking-wider">
                Монах под угрозой гибели!
              </span>
              <div className="grid grid-cols-2 gap-2">
                {player.helpers.warrior && (
                  <button
                    onClick={() => onUseHelper('warrior')}
                    className="py-2 px-1 bg-amber-950/5 text-amber-950 border border-amber-900/30 hover:bg-amber-950/15 rounded-xl font-bold flex flex-col items-center justify-center gap-2 text-xs transition-all"
                  >
                    <img src="/assets/warrior.png" alt="Дружинник" className="w-10 h-14 object-cover rounded border border-amber-750/30 shadow-sm" />
                    <span>Пожертвовать Дружинником</span>
                  </button>
                )}
                {player.helpers.bear && (
                  <button
                    onClick={() => onUseHelper('bear')}
                    className="py-2 px-1 bg-amber-950/5 text-amber-950 border border-amber-900/30 hover:bg-amber-950/15 rounded-xl font-bold flex flex-col items-center justify-center gap-2 text-xs transition-all"
                  >
                    <img src="/assets/bear.png" alt="Медведь" className="w-10 h-14 object-cover rounded border border-amber-750/30 shadow-sm" />
                    <span>Пожертвовать Медведем</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => onUseHelper('none')}
                className="w-full py-2 bg-red-900 text-red-100 hover:bg-red-950 rounded-xl font-semibold transition-all text-xs"
              >
                Принять гибель Монаха (+1 ПО «Житие»)
              </button>
            </div>
          )}

          {/* 4. Accept/Resolve Standard card (or successful threat save) */}
          {(showStandardAccept || (isDeathCheck && diceRollResult !== null && (diceRollResult % 2 === 0 || !hasHelpers))) && (
            <button
              onClick={onResolve}
              className="w-full py-3 btn-red-gold font-bold rounded-xl text-sm flex items-center justify-center gap-1 cursor-pointer text-oldrus tracking-widest"
            >
              <Check size={18} />
              <span>Принять летопись</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
