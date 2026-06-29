import { useEffect, useState, useRef } from 'react';
import { Tooltip } from './components/Tooltip';
import { useGameStore } from './stores/useGameStore';
import { Board } from './components/Board';
import { MonasteryPanel } from './components/MonasteryPanel';
import { EventModal } from './components/EventModal';
import { TradeModal } from './components/TradeModal';
import { Scroll, Award, RotateCcw, Loader2 } from 'lucide-react';
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
      const relicCount = Object.values(p.relics).filter(Boolean).length;
      const pts = buildingsCount + relicCount;
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
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-cover bg-center transition-all duration-1000 select-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), url('/edited-image.jpg')" }}
      >
        <div className="parchment-codex max-w-md w-full p-10 sm:p-12 flex flex-col gap-6 shadow-2xl relative items-center justify-center border-4 double border-amber-900/80 rounded-3xl animate-scale-in">
          <div className="absolute top-3 left-3 right-3 bottom-3 border border-amber-900/20 pointer-events-none rounded-2xl" />
          
          {/* Illuminated Loading Graphic */}
          <div className="relative flex items-center justify-center w-24 h-24 my-2">
            <Loader2 className="w-24 h-24 text-amber-700/50 absolute inset-0 animate-spin" />
            <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-600/40 p-2 flex items-center justify-center shadow-inner gold-glow">
              <Scroll className="w-8 h-8 text-amber-950 animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl text-amber-950 text-oldrus font-bold tracking-wide drop-shadow-sm">
            Пишется летопись обителей...
          </h2>
          <p className="text-base text-amber-900/90 italic font-medium leading-relaxed">
            Пожалуйста, подождите, пока монахи приготовят пергамент и чернила для великого дела.
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
            className="text-7xl md:text-9xl text-[#701a1a] drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] tracking-wide"
            style={{ 
              fontFamily: "'Monomakh Unicode', serif", 
              WebkitTextStroke: '1px rgba(254, 240, 138, 0.5)',
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 25px rgba(254, 240, 138, 0.75), 0 0 45px rgba(212, 175, 55, 0.5)' 
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
        <div className="relative z-10 mt-12 text-center flex flex-col items-center max-w-sm w-full animate-fade-in">
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
                    ? 'bg-[#701a1a] text-[#fef08a] border-[#fef08a] shadow-lg scale-105'
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
          <button 
            onClick={handleStart}
            className="px-10 py-4 bg-gradient-to-b from-[#801818] to-[#541212] text-[#fef08a] text-2xl font-bold rounded shadow-[0_6px_20px_rgba(0,0,0,0.8)] hover:from-[#941c1c] hover:to-[#661616] transition-all uppercase tracking-widest border border-[#fef08a]/40 cursor-pointer hover:scale-105 active:scale-95 text-oldrus"
            style={{ fontFamily: "'Monomakh Unicode', serif" }}
          >
            Войти в игру
          </button>
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
                const relic = activePlayer.relics[key];
                return (
                  <button
                    key={key}
                    onClick={() => destroyBuilding(key)}
                    className="w-full py-3 btn-red-gold rounded-xl font-bold text-sm transition-all cursor-pointer text-oldrus tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>{buildingNames[key]}</span>
                    {relic && (
                      <span className="text-xs bg-red-950/40 px-2 py-0.5 rounded-full border border-red-700/50">
                        {relic === 'obraz' ? 'Образ' : 'Житие'} 🔥
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Floating Glass HUD */}
      <header className="w-full max-w-[1300px] flex justify-between items-center hud-card p-4 sm:p-5 mb-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <span className="text-3xl sm:text-4xl font-bold text-amber-300 text-oldrus tracking-widest drop-shadow-lg">
            ⚜️ Монастыри
          </span>
          <span className="text-xs text-amber-200/70 font-mono bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-inner">
            Летопись: Ход {turnNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-300 font-medium tracking-wide">Ход игрока:</span>
          <span
            className="font-bold text-oldrus flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-amber-400/40 bg-amber-950/80 shadow-lg hud-card-active"
            style={{ color: activePlayer.color }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shadow-md ring-2 ring-white/30"
              style={{ backgroundColor: activePlayer.color }}
            />
            <span className="text-xl">{activePlayer.name}</span>
          </span>
        </div>
      </header>

      {/* Tabletop Main Scene */}
      <div className="w-full max-w-[1850px] px-2">
        {/* --- DESKTOP 3-COLUMN LAYOUT (Strictly side-by-side on desktop, never jumps or wraps) --- */}
        <div className="hidden md:flex flex-row flex-nowrap items-start justify-center gap-4 lg:gap-8 w-full">
          {/* Left Side Column: Player 1 & Player 3 Monasteries */}
          <div className="w-auto flex-shrink-0 flex flex-col gap-6 items-center">
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
              filterPlayerIds={['player_1', 'player_3']}
            />
          </div>

          {/* Center Column: Game Board Container & Chronicle Log directly under it */}
          <div className="flex-1 min-w-0 flex flex-col items-center gap-6 max-w-[1050px]">
            <div className="w-full flex items-center justify-center">
              <Board
                board={board}
                players={players}
                activePlayerId={activePlayerId}
                phase={phase}
                onMove={movePlayer}
              />
            </div>

            {/* Phase Banner */}
            <div className="text-center mt-1">
              {phase === 'MOVE' && (
                <Tooltip text="Кликните на подсвеченную соседнюю клетку, чтобы переместить монаха." multiline>
                  <span className="text-base font-bold text-amber-300 bg-amber-950/90 border-2 border-amber-400/60 px-7 py-2.5 rounded-full shadow-2xl animate-pulse text-oldrus tracking-widest">
                    Фаза перемещения: Сделайте шаг на соседнюю клетку ➔
                  </span>
                </Tooltip>
              )}
              {phase === 'EVENT_ACTION' && (
                <Tooltip text="Откройте карту Летописи или выполните действие клетки, на которой стоите." multiline>
                  <span className="text-base font-bold text-cyan-300 bg-cyan-950/90 border-2 border-cyan-400/60 px-7 py-2.5 rounded-full shadow-2xl animate-pulse text-oldrus tracking-widest">
                    Фаза события: Ждем выполнения действия на клетке 📜
                  </span>
                </Tooltip>
              )}
              {phase === 'BUILD' && (
                <Tooltip text="Постройте следующее здание монастыря или завершите ход кнопкой справа." multiline>
                  <span className="text-base font-bold text-emerald-300 bg-emerald-950/90 border-2 border-emerald-400/60 px-7 py-2.5 rounded-full shadow-2xl text-oldrus tracking-widest">
                    Фаза строительства: Возведите постройку или завершите ход 🏛️
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Chronicle Drawer (Летопись обители log) placed directly UNDER the board map */}
            <div className="w-full chronicle-drawer p-5 sm:p-6 rounded-3xl flex flex-col h-[260px] justify-between border-t-8 border-b-8 border-[#4a2d0b] shadow-2xl mt-2">
              <div className="flex items-center gap-3 border-b-2 border-amber-900/30 pb-3 mb-3 text-amber-950 font-bold text-oldrus">
                <Scroll size={22} className="text-amber-900 drop-shadow" />
                <span className="text-2xl">Летопись обители</span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2 text-sm text-stone-900 scrollbar-thin">
                {gameLog.map((log, i) => (
                  <div
                    key={i}
                    className={`py-1.5 border-b border-amber-900/20 leading-relaxed text-sm ${
                      log.includes('построил') || log.includes('победа')
                        ? 'text-emerald-900 font-bold'
                        : log.includes('гибель') || log.includes('погиб')
                        ? 'text-red-900 font-bold'
                        : log.includes('[Фаза дохода]')
                        ? 'text-blue-950 font-bold'
                        : 'text-stone-950 font-semibold'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Right Side Column: Player 2 & Player 4 Monasteries */}
          <div className="w-auto flex-shrink-0 flex flex-col gap-6 items-center">
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
              filterPlayerIds={['player_2', 'player_4']}
            />
          </div>
        </div>

        {/* --- MOBILE LAYOUT (Board map on top, Monasteries horizontally underneath) --- */}
        <div className="flex md:hidden flex-col items-center gap-6 w-full">
          <div className="w-full flex items-center justify-center">
            <Board
              board={board}
              players={players}
              activePlayerId={activePlayerId}
              phase={phase}
              onMove={movePlayer}
            />
          </div>

          {/* Phase Banner */}
          <div className="text-center mt-1">
            {phase === 'MOVE' && (
              <span className="text-sm font-bold text-amber-300 bg-amber-950/90 border border-amber-400/60 px-4 py-2 rounded-full shadow-xl animate-pulse text-oldrus">
                Фаза перемещения: Шаг на соседнюю клетку ➔
              </span>
            )}
            {phase === 'EVENT_ACTION' && (
              <span className="text-sm font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 px-4 py-2 rounded-full shadow-xl animate-pulse text-oldrus">
                Фаза события: Выполните действие 📜
              </span>
            )}
            {phase === 'BUILD' && (
              <span className="text-sm font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-400/60 px-4 py-2 rounded-full shadow-xl text-oldrus">
                Фаза строительства 🏛️
              </span>
            )}
          </div>

          {/* Monasteries horizontally placed under the board on mobile */}
          <div className="w-full overflow-x-auto py-2 px-1 scrollbar-thin">
            <div className="flex flex-row gap-4 justify-start items-start min-w-max">
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
          </div>

          {/* Chronicle Log on mobile */}
          <div className="w-full chronicle-drawer p-4 rounded-2xl flex flex-col h-[220px] justify-between border-t-4 border-b-4 border-[#4a2d0b] shadow-xl mt-2">
            <div className="flex items-center gap-2 border-b border-amber-900/30 pb-2 mb-2 text-amber-950 font-bold text-oldrus">
              <Scroll size={18} className="text-amber-900 drop-shadow" />
              <span className="text-xl">Летопись обители</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs text-stone-900 scrollbar-thin">
              {gameLog.map((log, i) => (
                <div key={i} className="py-1 border-b border-amber-900/20 leading-snug font-semibold">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
