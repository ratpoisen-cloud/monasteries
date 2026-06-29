import React, { useState } from 'react';
import type { Player } from '../types/game';
import { ShoppingCart, RefreshCw, X } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface TradeModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onTrade: (buy: { bread?: number; wax?: number }, sellSaltCount: number) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  player,
  isOpen,
  onClose,
  onTrade,
}) => {
  const [saltToSell, setSaltToSell] = useState<number>(0);
  const [breadToBuy, setBreadToBuy] = useState<number>(0);
  const [waxToBuy, setWaxToBuy] = useState<number>(0);

  if (!isOpen) return null;

  // Calculate silver balance
  const extraSilver = saltToSell;
  const totalSilverAvailable = player.resources.silver + extraSilver;
  const silverSpent = Math.ceil(breadToBuy / 3) + Math.ceil(waxToBuy / 2);
  const netSilverBalance = totalSilverAvailable - silverSpent;

  const handleConfirm = () => {
    if (netSilverBalance < 0) return;
    onTrade(
      {
        bread: breadToBuy > 0 ? breadToBuy : undefined,
        wax: waxToBuy > 0 ? waxToBuy : undefined,
      },
      saltToSell
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="parchment-bg max-w-md w-full rounded-2xl p-6 relative flex flex-col gap-4 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-900 hover:text-amber-950 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl text-oldrus text-amber-950 border-b border-amber-900/20 pb-2 flex items-center gap-2">
          <ShoppingCart />
          <span>Ярмарочный обмен</span>
        </h2>

        <p className="text-sm italic text-amber-900">
          «На ярмарке же купечество великое... соль на серебро променивают, да воск со хлебом приобретают».
        </p>

        {/* Current Balance info */}
        <div className="bg-stone-900/10 p-3 rounded-lg border border-amber-900/10 flex justify-between text-sm font-semibold text-amber-950">
          <span>Ваше серебро: {player.resources.silver}</span>
          <span>Ваша соль: {player.resources.salt}</span>
        </div>

        {/* Sell Salt */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Продать Соль (1 Соль = 1 Серебро)</span>
            <span className="text-amber-800 font-mono">+{saltToSell} Серебра</span>
          </label>
          <Tooltip text="Сколько соли продать (1 Соль = 1 Серебро)">
            <input
              type="range"
              min="0"
              max={player.resources.salt}
              value={saltToSell}
              onChange={(e) => setSaltToSell(parseInt(e.target.value))}
              className="w-full accent-red-800"
            />
          </Tooltip>
        </div>

        {/* Buy Bread */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Купить Хлеб (3 Хлеба = 1 Серебро)</span>
            <span className="text-red-900 font-mono">-{Math.ceil(breadToBuy / 3)} Серебра</span>
          </label>
          <div className="flex items-center gap-2">
            <Tooltip text="Убрать 3 Хлеба (отнять 1 Серебро)">
              <button
                onClick={() => setBreadToBuy(Math.max(0, breadToBuy - 3))}
                className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer"
              >
                -3
              </button>
            </Tooltip>
            <span className="flex-1 text-center font-bold text-amber-950 font-mono">
              {breadToBuy} ед.
            </span>
            <Tooltip text="Купить 3 Хлеба за 1 Серебро">
              <button
                onClick={() => setBreadToBuy(breadToBuy + 3)}
                className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer"
              >
                +3
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Buy Wax */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Купить Воск (2 Воска = 1 Серебро)</span>
            <span className="text-red-900 font-mono">-{Math.ceil(waxToBuy / 2)} Серебра</span>
          </label>
          <div className="flex items-center gap-2">
            <Tooltip text="Убрать 2 Воска (отнять 1 Серебро)">
              <button
                onClick={() => setWaxToBuy(Math.max(0, waxToBuy - 2))}
                className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer"
              >
                -2
              </button>
            </Tooltip>
            <span className="flex-1 text-center font-bold text-amber-950 font-mono">
              {waxToBuy} ед.
            </span>
            <Tooltip text="Купить 2 Воска за 1 Серебро">
              <button
                onClick={() => setWaxToBuy(waxToBuy + 2)}
                className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer"
              >
                +2
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Trade Balance Summary */}
        <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-1 text-center font-bold ${
          netSilverBalance >= 0
            ? 'bg-amber-900/10 text-amber-950 border-amber-900/20'
            : 'bg-red-500/10 text-red-900 border-red-500/20'
        }`}>
          <span>Итоговый баланс серебра: {netSilverBalance}</span>
          {netSilverBalance < 0 && (
            <span className="text-xs font-semibold text-red-800">
              Недостаточно серебра для завершения обмена!
            </span>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={netSilverBalance < 0}
          className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
            netSilverBalance >= 0
              ? 'btn-red-gold cursor-pointer text-oldrus tracking-wider'
              : 'bg-stone-300 text-stone-500 border border-stone-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw size={20} />
          <span>Подтвердить обмен</span>
        </button>
      </div>
    </div>
  );
};
