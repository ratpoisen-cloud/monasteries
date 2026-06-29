import { useEffect, useState, useRef } from 'react';
import { Tooltip } from './components/Tooltip';
import { useGameStore } from './stores/useGameStore';
import { Board } from './components/Board';
import { MonasteryPanel } from './components/MonasteryPanel';
import { EventModal } from './components/EventModal';
import { TradeModal } from './components/TradeModal';
import { Scroll, Award, RotateCcw, Flame, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function App() {
  const {
    players,
    playerOrder,
    activePlayerId,
    board,
    phase,
    turnNumber,
    diceRollResult,
    diceRolling,
    gameLog,
    activeEventCard,
    showTradeDialog,
    showFortressDialog,
    showDestructionDialog,
    initGame,
    rollDice,
    movePlayer,
    resolveEventWithBribe,
    resolveEventWithHelper,
    resolveActiveEvent,
    buildStructure,
    visitCityLocation,
    skipLocationAction,
    recruitMonkAttempt,
    tradeResources,
    hireWarriorAtFortress,
    skipFortressAction,
    performCellResourceAction,
    skipCellResourceAction,
    destroyBuilding,
    endTurn,
  } = useGameStore();

  const [playerCount, setPlayerCount] = useState<number>(2);
  const buildingNames: Record<string, string> = {
    cells: 'Кельи',
    church: 'Церковь',
    walls: 'Стены',
    belfry: 'Звонницу',
    cathedral: 'Собор',
  };
  const buildOrder = ['cells', 'church', 'walls', 'belfry', 'cathedral'] as const;
  const [loading, setLoading] = useState<boolean>(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the game logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog]);

  // Show confetti when game is over
  useEffect(() => {
    if (phase === 'GAME_OVER' && Object.keys(players).length > 0) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, animate a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [phase, players]);

  // Calculate winner
  const getWinnerInfo = () => {
    let maxPts = -1;
    let winnerName = '';
    let winnerColor = '';

    Object.values(players).forEach((p) => {
      const buildingsCount = Object.values(p.buildings).filter(Boolean).length;
      const pts = buildingsCount + p.victoryCards.obraz + p.victoryCards.zhitie;
      if (pts > maxPts) {
        maxPts = pts;
        winnerName = p.name;
        winnerColor = p.color;
      }
    });

    return { name: winnerName, points: maxPts, color: winnerColor };
  };

  const activePlayer = players[activePlayerId];
  
  // Find current cell of active player to know if they are in town
  let activePlayerCellType = '';
  if (activePlayer) {
    for (const row of board) {
      const found = row.find((c) => c.occupantId === activePlayerId);
      if (found) {
        activePlayerCellType = found.type;
        break;
      }
    }
  }

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url('/edited-image.jpg')" }}
      >
        <div className="parchment-bg max-w-md w-full rounded-3xl p-10 flex flex-col gap-6 shadow-2xl relative items-center justify-center border-4 double border-amber-900">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-amber-900/10 pointer-events-none rounded-2xl" />
          <div className="relative">
            <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
            <Loader2 className="w-16 h-16 text-amber-900/40 absolute -top-2 -left-2 animate-spin" />
          </div>
          <h2 className="text-3xl text-amber-950 text-oldrus font-bold mt-2">
            Пишется летопись обителей...
          </h2>
          <p className="text-sm text-amber-900 italic font-semibold">
            Пожалуйста, подождите, пока монахи приготовят пергамент и чернила
          </p>
        </div>
      </div>
    );
  }

  // --- LOBBY / SETUP VIEW ---
  if (Object.keys(players).length === 0) {
    const handleStart = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        initGame(playerCount);
      }, 1500);
    };

    return (
      <div 
        className="relative w-full h-screen bg-cover bg-center flex flex-col items-center justify-start pt-32 p-6 select-none"
        style={{ backgroundImage: "url('/edited-image.jpg')" }}
      >
        {/* Semi-transparent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/35 z-0"></div>

        {/* Title Container */}
        <div className="relative z-10 text-center flex flex-col items-center animate-scale-in">
          <h1 
            className="text-7xl md:text-9xl text-[#b91c1c] drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]"
            style={{ 
              fontFamily: "'Monomakh Unicode', serif", 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' 
            }}
          >
            Монастыри
          </h1>
          
          <h2 
            className="mt-2 text-xl md:text-3xl text-[#fef08a] uppercase tracking-[0.3em] font-medium drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] text-oldrus"
          >
            Настольная игра
          </h2>
        </div>

        {/* Player Selection Box */}
        <div className="relative z-10 mt-12 bg-black/45 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center flex flex-col items-center max-w-sm w-full shadow-2xl animate-fade-in">
          <label className="text-sm font-bold text-[#fef08a] uppercase tracking-wider mb-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
            Количество участников:
          </label>
          <div className="flex gap-4">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`w-12 h-12 rounded-xl text-lg font-bold border transition-all cursor-pointer ${
                  playerCount === n
                    ? 'bg-[#b91c1c] text-[#fef08a] border-[#fef08a] shadow-lg scale-105'
                    : 'bg-black/40 text-[#fef08a]/60 border-[#fef08a]/20 hover:bg-black/70 hover:text-[#fef08a]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="relative z-10 mt-auto mb-20 animate-fade-in">
          <Tooltip text="Начать игру. Каждый игрок получает 1 Молву, 1 Серебро и 1 Хлеб." multiline>
            <button 
              onClick={handleStart}
              className="px-10 py-4 bg-[#b91c1c] text-[#fef08a] text-2xl font-bold rounded shadow-[0_4px_14px_0_rgba(0,0,0,0.7)] hover:bg-red-800 transition-all uppercase tracking-widest border border-[#fef08a]/30 cursor-pointer hover:scale-105 active:scale-95 text-oldrus"
              style={{ fontFamily: "'Monomakh Unicode', serif" }}
            >
              Войти в игру
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // --- VICTORY SCREEN ---
  if (phase === 'GAME_OVER') {
    const winner = getWinnerInfo();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black/40">
        <div className="parchment-bg max-w-lg w-full rounded-3xl p-10 flex flex-col gap-6 shadow-2xl relative animate-scale-in items-center">
          <Award className="w-16 h-16 text-amber-500 border-2 border-amber-600/30 p-2 rounded-full animate-bounce" />
          
          <h1 className="text-4xl text-amber-950 text-oldrus font-bold">
            Конец Летописи
          </h1>

          <div className="p-6 bg-amber-950/10 rounded-2xl border border-amber-900/20 w-full flex flex-col gap-2 items-center">
            <span className="text-sm text-amber-800 uppercase tracking-widest font-semibold">Победитель:</span>
            <span
              className="text-2xl font-bold text-oldrus"
              style={{ color: winner.color }}
            >
              {winner.name}
            </span>
            <span className="text-lg font-sans font-bold text-amber-950">
              Набрано очков: {winner.points} ПО
            </span>
          </div>

          <p className="text-sm text-amber-900 italic">
            «И прославися обитель оная делами своими на вечные времена...»
          </p>

          <button
            onClick={() => initGame(playerOrder.length)}
            className="w-full py-3 btn-red-gold font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-oldrus tracking-wider"
          >
            <RotateCcw size={20} />
            <span>Начать заново</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN GAMEPLAY VIEW ---
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 pb-12">
      {/* Modals */}
      <EventModal
        card={activeEventCard}
        player={activePlayer}
        diceRollResult={diceRollResult}
        diceRolling={diceRolling}
        onBribe={resolveEventWithBribe}
        onUseHelper={resolveEventWithHelper}
        onRollDice={() => rollDice()}
        onResolve={resolveActiveEvent}
      />

      <TradeModal
        player={activePlayer}
        isOpen={showTradeDialog}
        onClose={() => useGameStore.setState({ showTradeDialog: false })}
        onTrade={tradeResources}
      />

      {showFortressDialog && activePlayer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="parchment-bg max-w-sm w-full rounded-3xl p-8 relative flex flex-col items-center gap-6 animate-scale-in text-center">
            <h2 className="text-3xl text-oldrus text-amber-950 font-bold">Крепость</h2>
            <p className="text-sm text-amber-950 font-semibold">
              В крепости можно нанять Дружинника за 2 ед. Хлеба. Дружинник защитит монаха от опасностей.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={hireWarriorAtFortress}
                disabled={activePlayer.resources.bread < 2 || activePlayer.helpers.warrior}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer text-oldrus tracking-wider ${
                  activePlayer.resources.bread >= 2 && !activePlayer.helpers.warrior
                    ? 'btn-red-gold'
                    : 'bg-stone-300 text-stone-500 border border-stone-400 cursor-not-allowed'
                }`}
              >
                Нанять (2 Хлеба)
              </button>
              <button
                onClick={skipFortressAction}
                className="flex-1 py-3 bg-stone-700 text-stone-300 border border-stone-600 hover:bg-stone-650 rounded-xl font-semibold transition-all cursor-pointer"
              >
                Уйти
              </button>
            </div>
          </div>
        </div>
      )}

      {showDestructionDialog && activePlayer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="parchment-bg max-w-sm w-full rounded-3xl p-8 relative flex flex-col items-center gap-5 animate-scale-in text-center">
            <h2 className="text-3xl text-oldrus text-amber-950 font-bold">Великий пожар</h2>
            <p className="text-sm text-amber-950 font-semibold leading-relaxed">
              Страшный пожар охватил ваш монастырь. Выберите здание, которое сгорит. Если в нём была реликвия — она сгорает безвозвратно.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {buildOrder.map((key) => {
                if (!activePlayer.buildings[key]) return null;
                return (
                  <button
                    key={key}
                    onClick={() => destroyBuilding(key)}
                    className="w-full py-3 btn-red-gold rounded-xl font-bold text-sm transition-all cursor-pointer text-oldrus tracking-wider"
                  >
                    {buildingNames[key]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-[1200px] flex justify-between items-center bg-stone-950/50 border border-stone-850 p-4 rounded-2xl mb-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-amber-300 text-oldrus tracking-wide">
            Монастыри
          </span>
          <span className="text-xs text-stone-500 font-mono">
            Ход {turnNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-400">Активный ход:</span>
          <span
            className="font-bold text-oldrus flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-900/10 bg-amber-950/10"
            style={{ color: activePlayer.color }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: activePlayer.color }}
            />
            {activePlayer.name}
          </span>
        </div>
      </header>

      {/* Main grid / content layout */}
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Game Board */}
        <div className="flex-1 flex flex-col items-center gap-3 w-full">
          <div className="bg-stone-950/30 p-2 rounded-2xl border border-stone-900 w-full max-w-[600px] flex items-center justify-center">
            <Board
              board={board}
              players={players}
              activePlayerId={activePlayerId}
              phase={phase}
              onMove={movePlayer}
            />
          </div>
          <div className="text-center">
            {phase === 'MOVE' && (
              <Tooltip text="Кликните на подсвеченную соседнюю клетку, чтобы переместить монаха." multiline>
                <span className="text-sm font-semibold text-amber-400 bg-amber-950/30 border border-amber-500/20 px-4 py-1.5 rounded-full animate-pulse">
                  Фаза перемещения: Сделайте шаг на соседнюю клетку
                </span>
              </Tooltip>
            )}
            {phase === 'EVENT_ACTION' && (
              <Tooltip text="Откройте карту Летописи или выполните действие клетки, на которой стоите." multiline>
                <span className="text-sm font-semibold text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-4 py-1.5 rounded-full animate-pulse">
                  Фаза события: Ждем выполнения действия на клетке
                </span>
              </Tooltip>
            )}
            {phase === 'BUILD' && (
              <Tooltip text="Постройте следующее здание монастыря или завершите ход кнопкой справа." multiline>
                <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                  Фаза строительства: Возведите постройку или завершите ход
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Sidebar logs / history panel (Scroll design) */}
        <div className="w-full lg:w-[350px] chronicle-scroll p-5 rounded-2xl flex flex-col h-[520px] justify-between border-t-8 border-b-8 border-[#3d2508]/80">
          <div className="flex items-center gap-2 border-b border-amber-900/20 pb-3 mb-3 text-amber-950 font-bold text-oldrus">
            <Scroll size={20} className="text-amber-900" />
            <span className="text-lg">Летопись обители</span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 text-sm text-stone-900 scrollbar-thin">
            {gameLog.map((log, i) => (
              <div
                key={i}
                className={`py-1.5 border-b border-amber-900/10 leading-relaxed ${
                  log.includes('построил') || log.includes('победа')
                    ? 'text-emerald-800 font-semibold'
                    : log.includes('гибель') || log.includes('погиб')
                    ? 'text-red-800 font-bold'
                    : log.includes('[Фаза дохода]')
                    ? 'text-blue-900 font-semibold'
                    : 'text-stone-900 font-medium'
                }`}
              >
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Sheets (Monasteries panels) */}
      <MonasteryPanel
        players={players}
        activePlayerId={activePlayerId}
        phase={phase}
        onBuild={buildStructure}
        onRecruitMonk={recruitMonkAttempt}
        onEndTurn={endTurn}
        onVisitCity={visitCityLocation}
        onSkipLocation={skipLocationAction}
        onPerformCellAction={performCellResourceAction}
        onSkipCellAction={skipCellResourceAction}
        currentCellType={activePlayerCellType}
      />
    </div>
  );
}

export default App;
