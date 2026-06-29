import React, { useState } from 'react';
import type { Player } from '../types/game';
import { ShoppingCart, RefreshCw, X } from 'lucide-react';

interface TradeModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onTrade: (ops: {
    buyBread?: number;
    buyWax?: number;
    sellSalt?: number;
    sellBread?: number;
    sellWax?: number;
    exchangeSaltToBread?: number;
    exchangeSaltToWax?: number;
  }) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  player,
  isOpen,
  onClose,
  onTrade,
}) => {
  const [sellSalt, setSellSalt] = useState<number>(0);
  const [sellBread, setSellBread] = useState<number>(0);
  const [sellWax, setSellWax] = useState<number>(0);
  const [buyBread, setBuyBread] = useState<number>(0);
  const [buyWax, setBuyWax] = useState<number>(0);
  const [saltToBread, setSaltToBread] = useState<number>(0);
  const [saltToWax, setSaltToWax] = useState<number>(0);

  if (!isOpen) return null;

  // Calculate resource balance
  const silverFromSales = sellSalt + Math.floor(sellBread / 3) + Math.floor(sellWax / 2);
  const silverSpent = Math.ceil(buyBread / 3) + Math.ceil(buyWax / 2);
  const netSilver = player.resources.silver + silverFromSales - silverSpent;
  const saltUsed = sellSalt + saltToBread + saltToWax;
  const saltOk = saltUsed <= player.resources.salt;
  const netOk = netSilver >= 0 && saltOk;

  const handleConfirm = () => {
    if (!netOk) return;
    onTrade({
      buyBread: buyBread > 0 ? buyBread : undefined,
      buyWax: buyWax > 0 ? buyWax : undefined,
      sellSalt: sellSalt > 0 ? sellSalt : undefined,
      sellBread: sellBread > 0 ? sellBread : undefined,
      sellWax: sellWax > 0 ? sellWax : undefined,
      exchangeSaltToBread: saltToBread > 0 ? saltToBread : undefined,
      exchangeSaltToWax: saltToWax > 0 ? saltToWax : undefined,
    });
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

        {/* Sell Salt for Silver */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Продать Соль (1 Соль = 1 Серебро)</span>
            <span className="text-amber-800 font-mono">+{sellSalt} Серебра</span>
          </label>
          <input type="range" min="0" max={player.resources.salt} value={sellSalt}
            onChange={(e) => setSellSalt(parseInt(e.target.value))} className="w-full accent-red-800" />
        </div>

        {/* Sell Bread for Silver */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Продать Хлеб (3 Хлеба = 1 Серебро)</span>
            <span className="text-amber-800 font-mono">+{Math.floor(sellBread / 3)} Серебра</span>
          </label>
          <input type="range" min="0" max={player.resources.bread} value={sellBread}
            onChange={(e) => setSellBread(parseInt(e.target.value))} className="w-full accent-red-800" />
        </div>

        {/* Sell Wax for Silver */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Продать Воск (2 Воска = 1 Серебро)</span>
            <span className="text-amber-800 font-mono">+{Math.floor(sellWax / 2)} Серебра</span>
          </label>
          <input type="range" min="0" max={player.resources.wax} value={sellWax}
            onChange={(e) => setSellWax(parseInt(e.target.value))} className="w-full accent-red-800" />
        </div>

        <hr className="border-amber-900/10" />

        {/* Buy Bread with Silver */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Купить Хлеб (3 Хлеба = 1 Серебро)</span>
            <span className="text-red-900 font-mono">-{Math.ceil(buyBread / 3)} Серебра</span>
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setBuyBread(Math.max(0, buyBread - 3))}
              className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer">-3</button>
            <span className="flex-1 text-center font-bold text-amber-950 font-mono">{buyBread} ед.</span>
            <button onClick={() => setBuyBread(buyBread + 3)}
              className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer">+3</button>
          </div>
        </div>

        {/* Buy Wax with Silver */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Купить Воск (2 Воска = 1 Серебро)</span>
            <span className="text-red-900 font-mono">-{Math.ceil(buyWax / 2)} Серебра</span>
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setBuyWax(Math.max(0, buyWax - 2))}
              className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer">-2</button>
            <span className="flex-1 text-center font-bold text-amber-950 font-mono">{buyWax} ед.</span>
            <button onClick={() => setBuyWax(buyWax + 2)}
              className="px-3 py-1 bg-red-800 text-yellow-100 rounded hover:bg-red-950 font-bold transition-all cursor-pointer">+2</button>
          </div>
        </div>

        <hr className="border-amber-900/10" />

        {/* Direct Salt → Bread */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Обменять Соль на Хлеб (1 Соль = 3 Хлеба)</span>
            <span className="text-emerald-800 font-mono">+{saltToBread * 3} Хлеба</span>
          </label>
          <input type="range" min="0" max={player.resources.salt - sellSalt - saltToWax} value={saltToBread}
            onChange={(e) => setSaltToBread(parseInt(e.target.value))} className="w-full accent-red-800" />
        </div>

        {/* Direct Salt → Wax */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-950 flex justify-between">
            <span>Обменять Соль на Воск (1 Соль = 2 Воска)</span>
            <span className="text-emerald-800 font-mono">+{saltToWax * 2} Воска</span>
          </label>
          <input type="range" min="0" max={player.resources.salt - sellSalt - saltToBread} value={saltToWax}
            onChange={(e) => setSaltToWax(parseInt(e.target.value))} className="w-full accent-red-800" />
        </div>

        {/* Trade Balance Summary */}
        <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-1 text-center font-bold ${
          netOk
            ? 'bg-amber-900/10 text-amber-950 border-amber-900/20'
            : 'bg-red-500/10 text-red-900 border-red-500/20'
        }`}>
          <span>Баланс серебра: {netSilver}</span>
          <span>Соли задействовано: {saltUsed} / {player.resources.salt}</span>
          {!netOk && (
            <span className="text-xs font-semibold text-red-800">
              Недостаточно ресурсов для обмена!
            </span>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={netSilver < 0}
          className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
            netSilver >= 0
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
