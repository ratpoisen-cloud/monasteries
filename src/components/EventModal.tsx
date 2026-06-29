import React from 'react';
import type { LetopisCard, Player } from '../types/game';
import { Scroll, Skull, Coins, Wheat, Check } from 'lucide-react';
import { Dice } from './Dice';

interface EventModalProps {
  card: LetopisCard | null;
  player: Player;
  diceRollResult: number | null;
  diceRolling: boolean;
  onBribe: (method: 'silver' | 'bread') => void;
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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="parchment-bg max-w-lg w-full rounded-3xl p-8 relative flex flex-col items-center gap-6 animate-scale-in text-center">
        <Scroll className="w-12 h-12 text-amber-900 border-2 border-amber-900/35 p-2 rounded-full" />

        <h2 className="text-4xl text-oldrus text-amber-950 font-bold tracking-wider">
          {card.title}
        </h2>

        {card.quote && (
          <p className="text-md italic text-amber-800 text-evangelie font-semibold leading-relaxed border-y border-amber-900/10 py-3 w-full">
            {card.quote}
          </p>
        )}

        <p className="text-sm font-semibold leading-relaxed text-amber-950 px-4 text-izvod">
          {card.description}
        </p>

        {(card.requiresDiceRoll || isDeathCheck) && !diceRolling && (
          <div className="my-2">
            <Dice result={diceRollResult} rolling={diceRolling} />
          </div>
        )}

        <div className="w-full flex flex-col gap-2 mt-4">
          {/* 1. Roll Dice button */}
          {showRollButton && (
            <button
              onClick={onRollDice}
              className="w-full py-3 btn-red-gold font-bold rounded-xl text-sm cursor-pointer text-oldrus tracking-widest"
            >
              Бросить кубик (Чет — спасение)
            </button>
          )}

          {/* 2. Danger choice after odd roll: bribe + helper + accept death */}
          {showDangerChoice && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs font-bold text-red-800 bg-red-500/10 py-1 rounded-full border border-red-500/20 uppercase tracking-wider">
                Монах под угрозой гибели!
              </span>

              {/* Bribe options */}
              {bribeOptions && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(bribeOptions).map(([resource, cost]) => {
                    const resKey = resource as keyof Player['resources'];
                    const canPay = player.resources[resKey] >= cost;
                    const labels: Record<string, string> = {
                      silver: 'Серебро',
                      bread: 'Хлеб',
                      wax: 'Вос',
                    };
                    return (
                      <button
                        key={resource}
                        onClick={() => onBribe(resource as 'silver' | 'bread')}
                        disabled={!canPay}
                        className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border text-xs transition-all ${
                          canPay
                            ? 'bg-amber-950/10 text-amber-950 border-amber-900/40 hover:bg-amber-950/20'
                            : 'opacity-40 bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {resource === 'silver' ? <Coins size={16} /> : <Wheat size={16} />}
                        <span>{cost} {labels[resource]}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Helper sacrifice */}
              {hasHelpers && (
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
              )}

              <button
                onClick={() => onUseHelper('none')}
                className="w-full py-2 bg-red-900 text-red-100 hover:bg-red-950 rounded-xl font-semibold transition-all text-xs"
              >
                Принять гибель Монаха (+1 ПО «Житие»)
              </button>
            </div>
          )}

          {/* 3. Accept/Resolve for standard cards or even roll (safe) */}
          {showAccept && (
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
