import type { StateCreator } from 'zustand';
import type { Cell, CellType, GamePhase, LetopisCard, Player, RelicType } from '../types/game';
import { generateLetopisDeck } from '../utils/deckGenerator';
import { applyBuildingCost, BUILDING_NAMES_ACC, BUILDING_SEQ, findPlayerCell, getPlayerEntryCells, isAdjacentStep } from '../utils/rules';
import type { UiSlice } from './uiSlice';

const RELIC_SLOT_ORDER: (keyof Player['relics'])[] = ['cells', 'church', 'walls', 'belfry', 'cathedral'];

function findFirstEmptyRelicSlot(relics: Player['relics']): keyof Player['relics'] | null {
  for (const slot of RELIC_SLOT_ORDER) {
    if (!relics[slot]) return slot;
  }
  return null;
}

export interface GameSlice {
  players: Record<string, Player>;
  playerOrder: string[];
  activePlayerId: string;
  board: Cell[][];
  phase: GamePhase;
  turnNumber: number;
  diceRollResult: number | null;
  diceRolling: boolean;
  gameLog: string[];
  letopisDeck: LetopisCard[];
  discardDeck: LetopisCard[];
  activeEventCard: LetopisCard | null;
  hasBuiltThisTurn: boolean;

  // Actions
  initGame: (playerCount: number) => void;
  rollDice: (onComplete?: (val: number) => void) => void;
  movePlayer: (x: number, y: number) => void;
  executeCellAction: (cell: Cell) => void;
  drawEventCard: () => void;
  resolveEventWithBribe: (method: 'silver' | 'bread' | 'wax') => void;
  resolveEventWithHelper: (helper: 'warrior' | 'bear' | 'none') => void;
  resolveActiveEvent: () => void;
  buildStructure: (structure: keyof Player['buildings']) => void;
  visitCityLocation: (location: 'prince' | 'bishop' | 'artel' | 'fair') => void;
  skipLocationAction: () => void;
  recruitMonkAttempt: () => void;
  tradeResources: (ops: {
    buyBread?: number;
    buyWax?: number;
    sellSalt?: number;
    sellBread?: number;
    sellWax?: number;
    exchangeSaltToBread?: number;
    exchangeSaltToWax?: number;
  }) => void;
  hireWarriorAtFortress: () => void;
  skipFortressAction: () => void;
  performCellResourceAction: (cellType: 'village' | 'saltworks') => void;
  skipCellResourceAction: () => void;
  destroyBuilding: (structure: keyof Player['buildings']) => void;
  skipEntryMove: () => void;
  endTurn: () => void;
}

const START_CELLS = [
  { x: 0, y: 3 }, // Left (Green)
  { x: 7, y: 4 }, // Right (Blue)
  { x: 3, y: 0 }, // Top (Yellow)
  { x: 4, y: 7 }, // Bottom (Red)
];

const PLAYER_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PLAYER_NAMES = [
  'Свято-Никольский монастырь',
  'Монастырь Св. Троицы',
  'Спасо-Преображенский монастырь',
  'Монастырь Св. Сергия',
];

export type GameStore = GameSlice & UiSlice;

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => ({
  players: {},
  playerOrder: [],
  activePlayerId: '',
  board: [],
  phase: 'GAME_OVER',
  turnNumber: 0,
  diceRollResult: null,
  diceRolling: false,
  gameLog: [],
  letopisDeck: [],
  discardDeck: [],
  activeEventCard: null,
  hasBuiltThisTurn: false,

  initGame: (playerCount) => {
    const order: string[] = [];
    const initialPlayers: Record<string, Player> = {};

    for (let i = 0; i < playerCount; i++) {
      const id = `player_${i + 1}`;
      order.push(id);
      initialPlayers[id] = {
        id,
        name: PLAYER_NAMES[i],
        color: PLAYER_COLORS[i],
        monksCount: 1,
        resources: {
          molva: 0,
          silver: 0,
          bread: 0,
          salt: 0,
          wax: 0,
        },
        buildings: {
          cells: false,
          church: false,
          walls: false,
          belfry: false,
          cathedral: false,
        },
        tokens: {
          blessing: false,
          artel: false,
        },
        helpers: {
          warrior: false,
          bear: false,
        },
        relics: {
          cells: null,
          church: null,
          walls: null,
          belfry: null,
          cathedral: null,
        },
        startCell: START_CELLS[i],
        hasEntered: false,
      };
    }

    // Generate 8x8 Board
    const grid: Cell[][] = Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => {
        let type: CellType = 'empty';

        // Central City 2x2
        if (x === 3 && y === 3) type = 'city_artel';
        else if (x === 3 && y === 4) type = 'city_prince';
        else if (x === 4 && y === 3) type = 'city_bishop';
        else if (x === 4 && y === 4) type = 'city_fair';

        return {
          x,
          y,
          type,
          ownerId: null,
          occupantId: null,
        };
      })
    );

    // Note: Players start on border platforms, not inside the grid cells.
    // They will move onto their startCell in their first turn.

    const deck = generateLetopisDeck();

    set({
      players: initialPlayers,
      playerOrder: order,
      activePlayerId: order[0],
      board: grid,
      phase: 'INCOME',
      turnNumber: 1,
      diceRollResult: null,
      gameLog: ['Игра началась! Начало летописи монастырей.'],
      letopisDeck: deck,
      discardDeck: [],
      activeEventCard: null,
      hasBuiltThisTurn: false,
    });

    // Give 1 Molva on income phase start
    const pId = order[0];
    set((state) => {
      const active = state.players[pId];
      return {
        players: {
          ...state.players,
          [pId]: {
            ...active,
            resources: {
              ...active.resources,
              molva: active.resources.molva + 1,
            },
          },
        },
        gameLog: [...state.gameLog, `[Фаза дохода] ${active.name} получает +1 Молва.`],
        phase: 'MOVE',
      };
    });
  },

  rollDice: (onComplete) => {
    if (get().diceRolling) return;
    set({ diceRolling: true, diceRollResult: null });

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      set((state) => ({
        diceRolling: false,
        diceRollResult: roll,
        gameLog: [...state.gameLog, `Бросок кубика: выпало ${roll}.`],
      }));
      if (onComplete) onComplete(roll);
    }, 1000);
  },

  movePlayer: (x, y) => {
    const { board, players, activePlayerId, phase } = get();
    if (phase !== 'MOVE') return;

    const activePlayer = players[activePlayerId];
    const hasEntered = activePlayer.hasEntered ?? false;

    if (hasEntered) {
      // Find current cell of the active player
      const currentCell = findPlayerCell(board, activePlayerId);
      if (!currentCell) return;

      // Cannot stay on the same cell — each turn the player must move
      if (currentCell.x === x && currentCell.y === y) {
        set((state) => ({
          gameLog: [...state.gameLog, `Нельзя стоять на месте два хода подряд!`],
        }));
        return;
      }

      // Validate orthogonal 1-step move
      if (!isAdjacentStep(currentCell, { x, y })) return;
    } else {
      // Player is entering the board. Must click one of their entry cells
      const entryCells = getPlayerEntryCells(activePlayer);
      const isValidEntry = entryCells.some(c => c.x === x && c.y === y);
      if (!isValidEntry) return;
    }

    const targetCell = board[y][x];

    // Cannot step on cell occupied by another player
    if (targetCell.occupantId && targetCell.occupantId !== activePlayerId) {
      set((state) => ({
        gameLog: [...state.gameLog, `Клетка занята другим монахом!`],
      }));
      return;
    }

    // Cannot step on Windfall (Бурелом)
    if (targetCell.type === 'windfall') {
      set((state) => ({
        gameLog: [...state.gameLog, `Путь преграждает непроходимый Бурелом!`],
      }));
      return;
    }

    // River crossing check — when leaving a river cell
    const currentCell = findPlayerCell(board, activePlayerId);
    if (hasEntered && currentCell?.type === 'river') {
      if (activePlayer.riverBlocked) {
        // Already failed once — auto-pass (flag cleared in updatedPlayers below)
      } else {
        get().rollDice((roll) => {
          if (roll % 2 === 0) {
            set((state) => ({
              gameLog: [...state.gameLog, `Четное число (${roll})! Переправа через реку удалась.`],
            }));
            const st = get();
            const freshCell = findPlayerCell(st.board, activePlayerId);
            const rb = st.board.map((row) =>
              row.map((c) => {
                if (freshCell && c.x === freshCell.x && c.y === freshCell.y) {
                  return { ...c, occupantId: null };
                }
                if (c.x === x && c.y === y) {
                  return { ...c, occupantId: activePlayerId };
                }
                return c;
              })
            );
            const rp = {
              ...st.players,
              [activePlayerId]: {
                ...st.players[activePlayerId],
                hasEntered: true,
                prevCell: freshCell ? { x: freshCell.x, y: freshCell.y } : null,
              },
            };
            set({ board: rb, players: rp, phase: 'EVENT_ACTION' });
            get().executeCellAction(rb[y][x]);
          } else {
            set((state) => ({
              players: {
                ...state.players,
                [activePlayerId]: {
                  ...state.players[activePlayerId],
                  riverBlocked: true,
                },
              },
              gameLog: [...state.gameLog, `Нечетное число (${roll}). Течение слишком сильное. Монах остаётся на берегу.`],
              phase: 'BUILD',
            }));
          }
        });
        return;
      }
    }

    // Move player logic
    const updatedBoard = board.map((row) =>
      row.map((c) => {
        if (hasEntered && currentCell && c.x === currentCell.x && c.y === currentCell.y) {
          return { ...c, occupantId: null };
        }
        if (c.x === x && c.y === y) {
          return { ...c, occupantId: activePlayerId };
        }
        return c;
      })
    );

    // Update hasEntered in player list (clear riverBlocked on auto-pass, store prevCell)
    const updatedPlayers = {
      ...players,
      [activePlayerId]: {
        ...activePlayer,
        hasEntered: true,
        riverBlocked: currentCell?.type === 'river' && activePlayer.riverBlocked ? false : activePlayer.riverBlocked,
        prevCell: hasEntered && currentCell ? { x: currentCell.x, y: currentCell.y } : null,
      },
    };

    set((state) => ({
      board: updatedBoard,
      players: updatedPlayers,
      gameLog: [...state.gameLog, `${activePlayer.name} вступил в обитель на клетку (${x}, ${y}).`],
      phase: 'EVENT_ACTION',
    }));

    // Trigger cell event
    get().executeCellAction(updatedBoard[y][x]);
  },

  executeCellAction: (cell: Cell) => {
    const { activePlayerId } = get();
    const p = get().players[activePlayerId];

    // Check cell type
    if (cell.type === 'empty') {
      // Draw Letopis Card
      get().drawEventCard();
    } else if (cell.type.startsWith('city_')) {
      // City actions
      set((state) => ({
        gameLog: [...state.gameLog, `${p.name} вошел в городскую локацию.`],
      }));
    } else if (cell.type === 'village') {
      if (cell.ownerId === activePlayerId) {
        set((state) => ({
          gameLog: [...state.gameLog, `${p.name} вошел в свое Село. Можно собрать урожай (бросок кубика) или пропустить.`],
        }));
      } else {
        set((state) => ({
          gameLog: [...state.gameLog, `Вы зашли в чужое Село. Хозяйство принадлежит другому монастырю. Ресурсов не получено.`],
          phase: 'BUILD',
        }));
      }
    } else if (cell.type === 'saltworks') {
      if (cell.ownerId === activePlayerId) {
        set((state) => ({
          gameLog: [...state.gameLog, `${p.name} вошел во владение Солеварни. Можно добыть соль (бросок кубика) или пропустить.`],
        }));
      } else {
        set((state) => ({
          gameLog: [...state.gameLog, `Чужая Солеварня. Доход принадлежит сопернику.`],
          phase: 'BUILD',
        }));
      }
    } else if (cell.type === 'fortress') {
      set((state) => ({
        gameLog: [...state.gameLog, `Вы зашли в Крепость. Здесь можно нанять Дружинника за 2 Хлеба.`],
        showFortressDialog: true,
      }));
    } else if (cell.type === 'chapel') {
      // Safe chapel cell
      set((state) => ({
        gameLog: [...state.gameLog, `Монах молится в Часовне. Это безопасное освоенное место.`],
        phase: 'BUILD',
      }));
    } else if (cell.type === 'river') {
      set((state) => ({
        gameLog: [...state.gameLog, `Вы на речном берегу. Для переправы в следующий ход потребуется бросок кубика.`],
        phase: 'BUILD',
      }));
    } else {
      set({ phase: 'BUILD' });
    }
  },

  drawEventCard: () => {
    const { letopisDeck } = get();
    const deck = [...letopisDeck];

    if (deck.length === 0) {
      // End of game trigger
      set((state) => ({
        phase: 'GAME_OVER',
        gameLog: [...state.gameLog, `Колода Летописи пуста! Время подсчитывать победные очки!`],
      }));
      return;
    }

    const card = deck.shift()!;
    set({
      letopisDeck: deck,
      activeEventCard: card,
    });

    // Log the event — roll/bribe/helper choice handled in EventModal
    if (card.actionType === 'monk_death_check') {
      set((state) => ({
        gameLog: [...state.gameLog, `Запущено испытание: ${card.title}. Бросьте кубик!`],
      }));
    }
  },

  resolveEventWithBribe: (method) => {
    const { activePlayerId, activeEventCard } = get();
    if (!activeEventCard) return;

    const p = get().players[activePlayerId];
    if (activeEventCard.actionType !== 'monk_death_check') return;
    const cost = activeEventCard.actionPayload.bribeOptions?.[method];
    if (!cost) return;
    const currentResource = p.resources[method];
    if (currentResource < cost) return;

    const resourceLabels: Record<string, string> = {
      silver: 'Серебра',
      bread: 'Хлеба',
      wax: 'Воска',
    };

    set((state) => {
      const active = state.players[activePlayerId];
      const newResources = { ...active.resources };
      if (method === 'silver') newResources.silver -= cost;
      else if (method === 'bread') newResources.bread -= cost;
      else if (method === 'wax') newResources.wax -= cost;
      else return state;
      return {
        players: {
          ...state.players,
          [activePlayerId]: {
            ...active,
            resources: newResources,
          },
        },
        gameLog: [...state.gameLog, `${active.name} откупился ${cost} ед. ${resourceLabels[method] ?? method}.`],
        activeEventCard: null,
        discardDeck: [...state.discardDeck, activeEventCard],
        phase: 'BUILD',
      };
    });
  },

  resolveEventWithHelper: (helper) => {
    const { activePlayerId, activeEventCard } = get();
    if (!activeEventCard) return;

    if (helper !== 'none') {
      // Sacrifice helper
      set((state) => {
        const active = state.players[activePlayerId];
        const updatedHelpers = { ...active.helpers };
        if (helper === 'warrior') updatedHelpers.warrior = false;
        if (helper === 'bear') updatedHelpers.bear = false;

        return {
          players: {
            ...state.players,
            [activePlayerId]: {
              ...active,
              helpers: updatedHelpers,
            },
          },
          gameLog: [...state.gameLog, `${active.name} пожертвовал помощником (${helper === 'warrior' ? 'Дружинник' : 'Медведь'}), чтобы спасти Монаха.`],
          activeEventCard: null,
          discardDeck: [...state.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    } else {
      // No helper used -> Monk dies!
      set((state) => {
        const active = state.players[activePlayerId];
        const newMonksCount = Math.max(0, active.monksCount - 1);
        const slot = findFirstEmptyRelicSlot(active.relics);
        const newRelics = slot ? { ...active.relics, [slot]: 'zhitie' as RelicType } : active.relics;

        const updatedBoard = state.board.map((row) =>
          row.map((c) => {
            if (c.occupantId === activePlayerId) {
              return { ...c, occupantId: null, type: 'chapel' as CellType };
            }
            return c;
          })
        );

        return {
          players: {
            ...state.players,
            [activePlayerId]: {
              ...active,
              monksCount: newMonksCount,
              hasEntered: false,
              relics: newRelics,
            },
          },
          board: updatedBoard,
          gameLog: [
            ...state.gameLog,
            `💀 Монах погиб мученической смертью! Фишка вернулась к воротам монастыря. На месте гибели возведена Часовня. Получено 1 Житие (+1 ПО).`,
          ],
          activeEventCard: null,
          discardDeck: [...state.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    }
  },

  resolveActiveEvent: () => {
    const state = get();
    const { activePlayerId, activeEventCard } = state;
    if (!activeEventCard) return;

    const p = state.players[activePlayerId];

    const curCell = findPlayerCell(state.board, activePlayerId);
    const curX = curCell?.x ?? 0;
    const curY = curCell?.y ?? 0;

    if (activeEventCard.actionType === 'resource_gain') {
      const payload = activeEventCard.actionPayload;
      set((s) => {
        const active = s.players[activePlayerId];
        const newResources = { ...active.resources };
        Object.keys(payload).forEach((k) => {
          const key = k as keyof typeof newResources;
          const amount = payload[key];
          if (typeof amount !== 'number') return;
          newResources[key] += amount;
        });

        return {
          players: {
            ...s.players,
            [activePlayerId]: {
              ...active,
              resources: newResources,
            },
          },
          gameLog: [...s.gameLog, `${active.name} применил эффект карты: ${activeEventCard.title}.`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    } else if (activeEventCard.actionType === 'resource_loss') {
      const payload = activeEventCard.actionPayload;
      set((s) => {
        const active = s.players[activePlayerId];
        const newResources = { ...active.resources };

        Object.keys(payload).forEach((k) => {
          if (k === 'fallback') return;
          const key = k as keyof typeof newResources;
          const amount = payload[key];
          if (typeof amount !== 'number') return;
          if (newResources[key] >= amount) {
            newResources[key] -= amount;
          } else if (payload.fallback) {
            const fallbackKey = payload.fallback as keyof typeof newResources;
            if (newResources[fallbackKey] >= 1) {
              newResources[fallbackKey] -= 1;
            }
          }
        });

        return {
          players: {
            ...s.players,
            [activePlayerId]: {
              ...active,
              resources: newResources,
            },
          },
          gameLog: [...s.gameLog, `${active.name} претерпел лишения: ${activeEventCard.title}.`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    } else if (activeEventCard.actionType === 'place_token') {
      const { type } = activeEventCard.actionPayload;
      const isPrivate = type === 'village' || type === 'saltworks';

      const active = state.players[activePlayerId];
      const newResources = { ...active.resources };
      let resourceLog = '';
      if (type === 'village') {
        newResources.bread += 1;
        resourceLog = ' Село приносит 1 ед. Хлеба.';
      } else if (type === 'saltworks') {
        newResources.salt += 1;
        resourceLog = ' Солеварня даёт 1 ед. Соли.';
      }
      const tokenName =
        type === 'village' ? 'Село' :
        type === 'saltworks' ? 'Солеварня' :
        type === 'fortress' ? 'Крепость' :
        type === 'river' ? 'Река' :
        'Бурелом';

      // Windfall: retreat and immediately end turn (skip BUILD)
      if (type === 'windfall') {
        const prevCell = active.prevCell;
        const boardWithRetreat = state.board.map((row) =>
          row.map((c) => {
            if (prevCell && c.x === prevCell.x && c.y === prevCell.y) {
              return { ...c, occupantId: activePlayerId };
            }
            if (c.x === curX && c.y === curY) {
              return { ...c, type: 'windfall' as CellType, ownerId: null, occupantId: null };
            }
            return c;
          })
        );

        set((st) => ({
          board: boardWithRetreat,
          players: {
            ...st.players,
            [activePlayerId]: { ...active, resources: newResources, hasEntered: false, prevCell: null },
          },
          gameLog: [...st.gameLog, `${p.name} разместил жетон «${tokenName}» на клетке (${curX}, ${curY}) и отступил назад.${resourceLog}`],
          activeEventCard: null,
          discardDeck: [...st.discardDeck, activeEventCard],
        }));
        get().endTurn();
        return;
      }

      const updatedBoard = state.board.map((row) =>
        row.map((c) => {
          if (c.x === curX && c.y === curY) {
            return { ...c, type, ownerId: isPrivate ? activePlayerId : null };
          }
          return c;
        })
      );

      set((st) => ({
        board: updatedBoard,
        players: {
          ...st.players,
          [activePlayerId]: { ...active, resources: newResources },
        },
        gameLog: [...st.gameLog, `${p.name} разместил жетон «${tokenName}» на клетке (${curX}, ${curY}).${resourceLog}`],
        activeEventCard: null,
        discardDeck: [...st.discardDeck, activeEventCard],
        phase: 'BUILD',
      }));
    } else if (activeEventCard.actionType === 'get_helper') {
      const { type } = activeEventCard.actionPayload;
      set((s) => {
        const active = s.players[activePlayerId];
        const updatedHelpers = { ...active.helpers };
        if (type === 'warrior') updatedHelpers.warrior = true;
        if (type === 'bear') updatedHelpers.bear = true;

        return {
          players: {
            ...s.players,
            [activePlayerId]: {
              ...active,
              helpers: updatedHelpers,
            },
          },
          gameLog: [...s.gameLog, `${active.name} приютил помощника: ${type === 'warrior' ? 'Дружинник' : 'Медведь'}.`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    } else if (activeEventCard.actionType === 'wildcard') {
      // Obraz Card — place in first empty relic slot
      set((s) => {
        const active = s.players[activePlayerId];
        const slot = findFirstEmptyRelicSlot(active.relics);
        if (!slot) {
          return {
            gameLog: [...s.gameLog, `${active.name} получил Образ, но все ячейки заняты.`],
            activeEventCard: null,
            discardDeck: [...s.discardDeck, activeEventCard],
            phase: 'BUILD',
          };
        }
        const newRelics = { ...active.relics, [slot]: 'obraz' as RelicType };
        return {
          players: {
            ...s.players,
            [activePlayerId]: {
              ...active,
              relics: newRelics,
            },
          },
          gameLog: [...s.gameLog, `${active.name} получил благословение Иконы (Образ +1 ПО).`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        };
      });
    } else if (activeEventCard.actionType === 'monk_death_check') {
      const roll = get().diceRollResult;
      if (roll === null) {
        // No roll yet — do nothing; the modal still shows the roll button.
        return;
      } else if (roll % 2 === 0) {
        set((s) => ({
          gameLog: [...s.gameLog, `Четное число (${roll})! Монах благополучно преодолел опасность.`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        }));
      } else {
        const player = get().players[activePlayerId];
        if (player.helpers.warrior || player.helpers.bear) {
          // Wait for user action on helper sacrifice
        } else {
          get().resolveEventWithHelper('none');
        }
      }
    } else if (activeEventCard.actionType === 'building_destruction') {
      // Check if player has any built buildings
      const built = Object.entries(p.buildings).filter(([, v]) => v).map(([k]) => k);
      if (built.length === 0) {
        set((s) => ({
          gameLog: [...s.gameLog, `${p.name}: Пожар бушевал, но монастырь пуст. Ни одно здание не пострадало.`],
          activeEventCard: null,
          discardDeck: [...s.discardDeck, activeEventCard],
          phase: 'BUILD',
        }));
      } else {
        set({ showDestructionDialog: true });
      }
    } else {
      set({
        activeEventCard: null,
        discardDeck: [...get().discardDeck, activeEventCard],
        phase: 'BUILD',
      });
    }
  },

  destroyBuilding: (structure) => {
    const { activePlayerId, activeEventCard } = get();
    const p = get().players[activePlayerId];
    if (!p.buildings[structure]) return;

    const newBuildings = { ...p.buildings, [structure]: false };
    const relicInBuilding = p.relics[structure];
    const newRelics = { ...p.relics, [structure]: null };

    set((state) => ({
      players: {
        ...state.players,
        [activePlayerId]: {
          ...p,
          buildings: newBuildings,
          relics: newRelics,
        },
      },
      gameLog: [
        ...state.gameLog,
        `${p.name} потерял ${BUILDING_NAMES_ACC[structure]} в пожаре.${relicInBuilding ? ` Реликвия (${relicInBuilding === 'obraz' ? 'Образ' : 'Житие'}) в нём сгорела безвозвратно.` : ''}`,
      ],
      showDestructionDialog: false,
      activeEventCard: null,
      discardDeck: activeEventCard ? [...state.discardDeck, activeEventCard] : state.discardDeck,
      phase: 'BUILD',
    }));
  },

  buildStructure: (structure) => {
    const { activePlayerId, players } = get();
    const p = players[activePlayerId];

    if (get().hasBuiltThisTurn) {
      set((state) => ({
        gameLog: [...state.gameLog, `⚠️ Вы уже возвели постройку в этот ход! За один ход можно строить только одно здание.`],
      }));
      return;
    }

    // Strict sequential building check
    const currentIdx = BUILDING_SEQ.indexOf(structure);

    if (currentIdx > 0) {
      const prevStructure = BUILDING_SEQ[currentIdx - 1];
      if (!p.buildings[prevStructure]) {
        set((state) => ({
          gameLog: [...state.gameLog, `Вы не можете строить ${structure}, пока не построена предыдущая постройка (${prevStructure})!`],
        }));
        return;
      }
    }

    if (p.buildings[structure]) {
      set((state) => ({
        gameLog: [...state.gameLog, `Данная постройка уже возведена в вашем монастыре!`],
      }));
      return;
    }

    // Requirements + cost deduction (single source of truth)
    const cost = applyBuildingCost(p, structure);
    if (!cost) {
      set((state) => ({
        gameLog: [...state.gameLog, `Недостаточно ресурсов, монахов или разрешений (Благословение/Артель) для постройки!`],
      }));
      return;
    }

    // Build success
    set((state) => {
      const active = state.players[activePlayerId];
      const updatedBuildings = { ...active.buildings, [structure]: true };

      // Check if cathedral is built -> triggers victory!
      let endOfGame = state.phase;
      const log = [
        ...state.gameLog,
        `🎉 ${active.name} построил ${BUILDING_NAMES_ACC[structure]}!`,
      ];

      if (structure === 'cathedral') {
        endOfGame = 'GAME_OVER';
        log.push(`🏆 ${active.name} построил Собор и завершил строительство Монастыря! Великая победа!`);
      }

      return {
        players: {
          ...state.players,
          [activePlayerId]: {
            ...active,
            resources: cost.resources,
            tokens: cost.tokens,
            buildings: updatedBuildings,
          },
        },
        gameLog: log,
        hasBuiltThisTurn: true,
        phase: endOfGame,
      };
    });
  },

  visitCityLocation: (location) => {
    const { activePlayerId } = get();
    const p = get().players[activePlayerId];
    const res = p.resources;

    const curCell = findPlayerCell(get().board, activePlayerId);

    if (!curCell || curCell.type !== `city_${location}`) {
      set((state) => ({
        gameLog: [...state.gameLog, `Вы должны находиться на клетке ${location} в городе, чтобы совершить это действие!`],
      }));
      return;
    }

    if (location === 'prince') {
      // 5 Молвы -> Even -> 1 Silver. Odd -> 0
      if (res.molva < 5) {
        set((state) => ({
          gameLog: [...state.gameLog, `Князь просит 5 ед. Молвы за аудиенцию! У вас не хватает Молвы.`],
        }));
        return;
      }

      set((state) => {
        const active = state.players[activePlayerId];
        return {
          players: {
            ...state.players,
            [activePlayerId]: {
              ...active,
              resources: { ...active.resources, molva: active.resources.molva - 5 },
            },
          },
          gameLog: [...state.gameLog, `${active.name} подносит Князю 5 ед. Молвы. Бросаем кубик на милость князя...`],
        };
      });

      get().rollDice((roll) => {
        if (roll % 2 === 0) {
          set((state) => {
            const active = state.players[activePlayerId];
            return {
              players: {
                ...state.players,
                [activePlayerId]: {
                  ...active,
                  resources: { ...active.resources, silver: active.resources.silver + 1 },
                },
              },
              gameLog: [...state.gameLog, `Князь милостив (выпало ${roll})! Вы получаете 1 ед. Серебра.`],
              phase: 'BUILD',
            };
          });
        } else {
          set((state) => ({
            gameLog: [...state.gameLog, `Князь суров (выпало ${roll})! Вы не получили Серебра.`],
            phase: 'BUILD',
          }));
        }
      });
    } else if (location === 'bishop') {
      // 4 Молвы -> Blessing token
      if (p.tokens.blessing) {
        set((state) => ({
          gameLog: [...state.gameLog, `У вас уже есть благословение. Используйте его, прежде чем просить новое.`],
        }));
        return;
      }
      if (res.molva < 4) {
        set((state) => ({
          gameLog: [...state.gameLog, `Епископ требует 4 ед. Молвы за благословение!`],
        }));
        return;
      }

      set((state) => {
        const active = state.players[activePlayerId];
        return {
          players: {
            ...state.players,
            [activePlayerId]: {
              ...active,
              resources: { ...active.resources, molva: active.resources.molva - 4 },
              tokens: { ...active.tokens, blessing: true },
            },
          },
          gameLog: [...state.gameLog, `${active.name} жертвует 4 ед. Молвы и получает жетон «Благословение Епископа».`],
          phase: 'BUILD',
        };
      });
    } else if (location === 'artel') {
      // 1 Silver -> Artel token
      if (res.silver < 1) {
        set((state) => ({
          gameLog: [...state.gameLog, `Артель мастеров требует 1 ед. Серебра за работу!`],
        }));
        return;
      }

      set((state) => {
        const active = state.players[activePlayerId];
        return {
          players: {
            ...state.players,
            [activePlayerId]: {
              ...active,
              resources: { ...active.resources, silver: active.resources.silver - 1 },
              tokens: { ...active.tokens, artel: true },
            },
          },
          gameLog: [...state.gameLog, `${active.name} нанимает строительную Артель за 1 ед. Серебра.`],
          phase: 'BUILD',
        };
      });
    } else if (location === 'fair') {
      set({ showTradeDialog: true });
    }
  },

  recruitMonkAttempt: () => {
    const { activePlayerId } = get();
    const p = get().players[activePlayerId];
    const res = p.resources;

    const curCell = findPlayerCell(get().board, activePlayerId);
    // At the start platform: either on own start cell, or not yet entered (piece on platform)
    const atStart = curCell
      ? curCell.x === p.startCell.x && curCell.y === p.startCell.y
      : !p.hasEntered;

    if (!atStart) {
      set((state) => ({
        gameLog: [...state.gameLog, `Нанимать новых монахов можно только у врат своего монастыря (стартовой клетке)!`],
      }));
      return;
    }

    if (p.monksCount >= 3) {
      set((state) => ({
        gameLog: [...state.gameLog, `В вашем монастыре уже максимальное число монахов (3/3)!`],
      }));
      return;
    }

    if (res.molva < 3 || res.bread < 1) {
      set((state) => ({
        gameLog: [...state.gameLog, `Недостаточно припасов! Для пострига нового брата нужно 3 Молвы и 1 Хлеб.`],
      }));
      return;
    }

    // Deduct resources and roll
    set((state) => {
      const active = state.players[activePlayerId];
      return {
        players: {
          ...state.players,
          [activePlayerId]: {
            ...active,
            resources: {
              ...active.resources,
              molva: active.resources.molva - 3,
              bread: active.resources.bread - 1,
            },
          },
        },
        gameLog: [...state.gameLog, `${active.name} совершает обряд пострига. Бросаем кубик...`],
      };
    });

    get().rollDice((roll) => {
      if (roll % 2 === 0) {
        set((state) => {
          const active = state.players[activePlayerId];
          return {
            players: {
              ...state.players,
              [activePlayerId]: {
                ...active,
                monksCount: active.monksCount + 1,
              },
            },
            gameLog: [...state.gameLog, `Успех (выпало ${roll})! В вашей обители новый монах (всего: ${active.monksCount + 1}).`],
            phase: 'BUILD',
          };
        });
      } else {
        set((state) => ({
          gameLog: [...state.gameLog, `Неудача (выпало ${roll}). Послушник не выдержал испытания постом.`],
          phase: 'BUILD',
        }));
      }
    });
  },

  skipLocationAction: () => {
    set((state) => ({
      phase: 'BUILD',
      gameLog: [...state.gameLog, `${state.players[state.activePlayerId]?.name ?? 'Игрок'} пропустил действие на клетке.`],
    }));
  },

  tradeResources: (ops) => {
    const { activePlayerId } = get();
    const p = get().players[activePlayerId];
    const res = p.resources;

    const opsValid = Object.entries(ops).every(([, v]) => typeof v === 'number' && v >= 0);
    if (!opsValid) {
      set((state) => ({
        gameLog: [...state.gameLog, 'Некорректные параметры торговли.'],
      }));
      return;
    }

    let newSilver = res.silver;
    let newBread = res.bread;
    let newWax = res.wax;
    let newSalt = res.salt;

    // 1. Sell salt to silver: 1 salt = 1 silver
    const sellS = ops.sellSalt ?? 0;
    if (sellS > 0 && newSalt >= sellS) {
      newSalt -= sellS;
      newSilver += sellS;
    }

    // 2. Sell bread to silver: 3 bread = 1 silver
    // Only full multiples of 3 are converted (no silent loss of remainder)
    const sellB = ops.sellBread ?? 0;
    if (sellB > 0 && newBread >= sellB) {
      const silverGain = Math.floor(sellB / 3);
      newBread -= silverGain * 3;
      newSilver += silverGain;
    }

    // 3. Sell wax to silver: 2 wax = 1 silver (full multiples only)
    const sellW = ops.sellWax ?? 0;
    if (sellW > 0 && newWax >= sellW) {
      const silverGain = Math.floor(sellW / 2);
      newWax -= silverGain * 2;
      newSilver += silverGain;
    }

    // 4. Buy bread with silver: 1 silver = 3 bread
    const buyB = ops.buyBread ?? 0;
    if (buyB > 0) {
      const cost = Math.ceil(buyB / 3);
      if (newSilver >= cost) {
        newSilver -= cost;
        newBread += buyB;
      }
    }

    // 5. Buy wax with silver: 1 silver = 2 wax
    const buyW = ops.buyWax ?? 0;
    if (buyW > 0) {
      const cost = Math.ceil(buyW / 2);
      if (newSilver >= cost) {
        newSilver -= cost;
        newWax += buyW;
      }
    }

    // 6. Exchange salt → bread: 1 salt = 3 bread
    const saltToB = ops.exchangeSaltToBread ?? 0;
    if (saltToB > 0 && newSalt >= saltToB) {
      newSalt -= saltToB;
      newBread += saltToB * 3;
    }

    // 7. Exchange salt → wax: 1 salt = 2 wax
    const saltToW = ops.exchangeSaltToWax ?? 0;
    if (saltToW > 0 && newSalt >= saltToW) {
      newSalt -= saltToW;
      newWax += saltToW * 2;
    }

    if (newSilver < 0 || newBread < 0 || newWax < 0 || newSalt < 0) {
      set((state) => ({
        gameLog: [...state.gameLog, 'Недостаточно ресурсов для обмена!'],
      }));
      return;
    }

    set((state) => ({
      players: {
        ...state.players,
        [activePlayerId]: {
          ...p,
          resources: {
            ...p.resources,
            silver: newSilver,
            bread: newBread,
            wax: newWax,
            salt: newSalt,
          },
        },
      },
      gameLog: [...state.gameLog, `${p.name} провел торговый обмен на Ярмарке.`],
      showTradeDialog: false,
      phase: 'BUILD',
    }));
  },

  hireWarriorAtFortress: () => {
    const { activePlayerId, players } = get();
    const p = players[activePlayerId];
    if (p.resources.bread >= 2 && !p.helpers.warrior) {
      set((state) => ({
        players: {
          ...state.players,
          [activePlayerId]: {
            ...p,
            resources: { ...p.resources, bread: p.resources.bread - 2 },
            helpers: { ...p.helpers, warrior: true },
          },
        },
        gameLog: [...state.gameLog, `${p.name} нанял Дружинника в Крепости за 2 ед. Хлеба.`],
        showFortressDialog: false,
        phase: 'BUILD',
      }));
    }
  },

  skipFortressAction: () => {
    set({
      showFortressDialog: false,
      phase: 'BUILD',
    });
  },

  performCellResourceAction: (cellType) => {
    const { activePlayerId, board } = get();
    const cell = findPlayerCell(board, activePlayerId);
    if (!cell) return;

    const resourceName = cellType === 'village' ? 'Хлеба' : 'Соли';
    const resourceKey = cellType === 'village' ? 'bread' as const : 'salt' as const;

    get().rollDice((roll) => {
      if (roll % 2 === 0) {
        set((state) => {
          const active = state.players[activePlayerId];
          return {
            players: {
              ...state.players,
              [activePlayerId]: {
                ...active,
                resources: { ...active.resources, [resourceKey]: active.resources[resourceKey] + 1 },
              },
            },
            gameLog: [...state.gameLog, `Четное число (${roll})! ${cellType === 'village' ? 'Село' : 'Солеварня'} приносит 1 ед. ${resourceName}.`],
            phase: 'BUILD',
          };
        });
      } else {
        set((state) => ({
          gameLog: [...state.gameLog, `Нечетное число (${roll}). ${resourceName} не добыто.`],
          phase: 'BUILD',
        }));
      }
    });
  },

  skipCellResourceAction: () => {
    set({ phase: 'BUILD' });
  },

  skipEntryMove: () => {
    const { activePlayerId, players, phase } = get();
    if (phase !== 'MOVE') return;
    const p = players[activePlayerId];
    if (p.hasEntered) return;
    set((state) => ({
      phase: 'BUILD',
      gameLog: [...state.gameLog, `${p.name} остался у врат своей обители.`],
    }));
  },

  endTurn: () => {
    const { playerOrder, activePlayerId, turnNumber } = get();
    const curIdx = playerOrder.indexOf(activePlayerId);
    const nextIdx = (curIdx + 1) % playerOrder.length;
    const nextPlayerId = playerOrder[nextIdx];

    // Increment turn number if round wraps around
    const nextTurn = nextIdx === 0 ? turnNumber + 1 : turnNumber;

    set({
      activePlayerId: nextPlayerId,
      turnNumber: nextTurn,
      phase: 'INCOME',
      diceRollResult: null,
      hasBuiltThisTurn: false,
    });

    // Income phase trigger for next player
    set((state) => {
      const active = state.players[nextPlayerId];
      return {
        players: {
          ...state.players,
          [nextPlayerId]: {
            ...active,
            resources: {
              ...active.resources,
              molva: active.resources.molva + 1,
            },
          },
        },
        gameLog: [...state.gameLog, `--- Ход ${nextTurn}. [Фаза дохода] ${active.name} получает +1 Молва. ---`],
        phase: 'MOVE',
      };
    });
  },
});