import type { Building, Cell, Player, Resources, Tokens } from '../types/game';

export const BUILDING_SEQ: Building[] = ['cells', 'church', 'walls', 'belfry', 'cathedral'];

export const BUILDING_NAMES: Record<Building, string> = {
  cells: 'Кельи',
  church: 'Церковь',
  walls: 'Стены',
  belfry: 'Звонница',
  cathedral: 'Собор',
};

export const BUILDING_NAMES_ACC: Record<Building, string> = {
  cells: 'Кельи',
  church: 'Церковь',
  walls: 'Стены',
  belfry: 'Звонницу',
  cathedral: 'Собор',
};

export const BUILDING_DESCRIPTIONS: Record<Building, string> = {
  cells: 'Увеличивает вместимость братии. Можно нанять больше монахов.',
  church: 'Духовный центр обители. Требует Благословения Епископа.',
  walls: 'Крепкие стены защищают обитель от напастей.',
  belfry: 'Звонница — гордость обители. Требует Артель мастеров.',
  cathedral: 'Величественный Собор — венец строительства. Требует Артель и Благословение.',
};

export const BUILDING_COST_LABELS: Record<Building, string> = {
  cells: '1 Молва, 1 Хлеб, 1 Монах',
  church: '2 Молвы, 2 Хлеба, 1 Воск, Благословение, 2 Монаха',
  walls: '3 Молвы, 3 Хлеба, 3 Монаха',
  belfry: '4 Молвы, 4 Хлеба, Артель, 3 Монаха',
  cathedral: '5 Молв, 5 Хлеба, 2 Воска, Артель, Благословение, 3 Монаха',
};

export function isAdjacentStep(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function getPlayerEntryCells(player: Player): { x: number; y: number }[] {
  const { x, y } = player.startCell;
  if (x === 0) return [{ x: 0, y: 3 }, { x: 0, y: 4 }];
  if (x === 7) return [{ x: 7, y: 3 }, { x: 7, y: 4 }];
  if (y === 0) return [{ x: 3, y: 0 }, { x: 4, y: 0 }];
  if (y === 7) return [{ x: 3, y: 7 }, { x: 4, y: 7 }];
  return [];
}

export function findPlayerCell(board: Cell[][], playerId: string): Cell | null {
  for (const row of board) {
    const found = row.find((c) => c.occupantId === playerId);
    if (found) return found;
  }
  return null;
}

export function getNextBuilding(player: Player): Building | null {
  return BUILDING_SEQ.find((b) => !player.buildings[b]) ?? null;
}

export function canAffordBuilding(p: Player, structure: Building): boolean {
  const res = p.resources;
  switch (structure) {
    case 'cells':
      return res.molva >= 1 && p.monksCount >= 1 && res.bread >= 1;
    case 'church':
      return res.molva >= 2 && p.monksCount >= 2 && res.bread >= 2 && res.wax >= 1 && p.tokens.blessing;
    case 'walls':
      return res.molva >= 3 && p.monksCount >= 3 && res.bread >= 3;
    case 'belfry':
      return res.molva >= 4 && p.monksCount >= 3 && res.bread >= 4 && p.tokens.artel;
    case 'cathedral':
      return res.molva >= 5 && p.monksCount >= 3 && res.bread >= 5 && res.wax >= 2 && p.tokens.artel && p.tokens.blessing;
  }
}

/**
 * Возвращает новые ресурсы/жетоны после списания стоимости, либо null если не хватает.
 */
export function applyBuildingCost(p: Player, structure: Building): { resources: Resources; tokens: Tokens } | null {
  if (!canAffordBuilding(p, structure)) return null;

  const resources: Resources = { ...p.resources };
  const tokens: Tokens = { ...p.tokens };

  switch (structure) {
    case 'cells':
      resources.molva -= 1;
      resources.bread -= 1;
      break;
    case 'church':
      resources.molva -= 2;
      resources.bread -= 2;
      resources.wax -= 1;
      tokens.blessing = false; // blessing consumed
      break;
    case 'walls':
      resources.molva -= 3;
      resources.bread -= 3;
      break;
    case 'belfry':
      resources.molva -= 4;
      resources.bread -= 4;
      tokens.artel = false;
      break;
    case 'cathedral':
      resources.molva -= 5;
      resources.bread -= 5;
      resources.wax -= 2;
      tokens.artel = false;
      tokens.blessing = false;
      break;
  }

  return { resources, tokens };
}