import React from 'react';

interface DiceProps {
  result: number | null;
  rolling: boolean;
}

export const Dice: React.FC<DiceProps> = ({ result, rolling }) => {
  const renderDots = (num: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeDots = dotsMap[num] || [];

    return Array.from({ length: 9 }).map((_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full bg-amber-950 transition-opacity duration-200 ${
          activeDots.includes(i) ? 'opacity-100' : 'opacity-0'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`w-20 h-20 bg-amber-50 rounded-xl border-4 border-amber-800 shadow-2xl flex flex-wrap p-3 items-center justify-center gap-1 transition-transform duration-500 ${
          rolling ? 'animate-spin scale-110' : ''
        }`}
        style={{
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.3)',
        }}
      >
        {rolling ? (
          <div className="text-2xl font-bold text-amber-900 text-oldrus animate-pulse">?</div>
        ) : result ? (
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5 justify-items-center items-center">
            {renderDots(result)}
          </div>
        ) : (
          <div className="text-xl font-bold text-amber-800 text-oldrus">Куб</div>
        )}
      </div>
      {!rolling && result !== null && (
        <span className="text-sm font-semibold text-amber-600 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/50">
          Выпало: {result} ({result % 2 === 0 ? 'Чет' : 'Нечет'})
        </span>
      )}
    </div>
  );
};
