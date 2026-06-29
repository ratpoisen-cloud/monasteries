export type GamePhase = 'INCOME' | 'MOVE' | 'EVENT_ACTION' | 'BUILD' | 'GAME_OVER';

export type CellType =
  | 'empty'
  | 'city_prince'
  | 'city_bishop'
  | 'city_fair'
  | 'city_artel'
  | 'village'
  | 'saltworks'
  | 'river'
  | 'fortress'
  | 'chapel'
  | 'windfall'; // Бурелом (непроходимый)

export interface Resources {
  molva: number;
  silver: number;
  bread: number;
  salt: number;
  wax: number;
}

export interface Buildings {
  cells: boolean;
  church: boolean;
  walls: boolean;
  belfry: boolean;
  cathedral: boolean;
}

export interface Tokens {
  blessing: boolean;
  artel: boolean;
}

export interface Helpers {
  warrior: boolean; // Дружинник
  bear: boolean;    // Медведь
}

export type RelicType = 'obraz' | 'zhitie';

export interface Player {
  id: string;
  name: string;
  color: string;
  monksCount: number; // От 1 до 3
  resources: Resources;
  buildings: Buildings;
  tokens: Tokens;
  helpers: Helpers;
  relics: {
    cells: RelicType | null;
    church: RelicType | null;
    walls: RelicType | null;
    belfry: RelicType | null;
    cathedral: RelicType | null;
  };
  startCell: { x: number; y: number };
  hasEntered?: boolean;
  riverBlocked?: boolean; // true если прошлый бросок на реке был неудачным
  prevCell?: { x: number; y: number } | null;
}

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  ownerId?: string | null; // Для Села и Солеварни
  occupantId?: string | null; // ID игрока, чья фишка стоит на клетке
}

export interface LetopisCard {
  id: string;
  title: string;
  quote?: string; // Старославянская цитата
  quoteSource?: string; // Источник цитаты (например, «Повесть временных лет»)
  description: string;
  actionType:
    | 'resource_gain'
    | 'resource_loss'
    | 'place_token'
    | 'monk_death_check' // проверка на смерть монаха (требует броска кубика)
    | 'get_helper'
    | 'wildcard' // Другие кастомные эффекты
    | 'building_destruction'; // Разрушение здания
  actionPayload: any;
  requiresDiceRoll?: boolean;
}
