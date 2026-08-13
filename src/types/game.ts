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

export type ResourceKey = keyof Resources;

export interface Buildings {
  cells: boolean;
  church: boolean;
  walls: boolean;
  belfry: boolean;
  cathedral: boolean;
}

export type Building = keyof Buildings;

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

export type PlaceTokenType = 'village' | 'saltworks' | 'fortress' | 'river' | 'windfall';
export type HelperType = 'warrior' | 'bear';

export type LetopisCardAction =
  | {
      actionType: 'resource_gain';
      actionPayload: Partial<Resources>;
    }
  | {
      actionType: 'resource_loss';
      actionPayload: Partial<Resources> & { fallback?: ResourceKey };
    }
  | {
      actionType: 'place_token';
      actionPayload: { type: PlaceTokenType };
    }
  | {
      actionType: 'monk_death_check'; // проверка на смерть монаха (требует броска кубика)
      actionPayload: { threat: string; bribeOptions?: Partial<Record<ResourceKey, number>> };
    }
  | {
      actionType: 'get_helper';
      actionPayload: { type: HelperType };
    }
  | {
      actionType: 'wildcard'; // Другие кастомные эффекты
      actionPayload: { type: 'obraz' };
    }
  | {
      actionType: 'building_destruction'; // Разрушение здания
      actionPayload: { destroy: 'building'; playerChoice: true };
    };

export interface LetopisCardBase {
  id: string;
  title: string;
  quote?: string; // Старославянская цитата
  quoteSource?: string; // Источник цитаты (например, «Повесть временных лет»)
  description: string;
  requiresDiceRoll?: boolean;
}

export type LetopisCard = LetopisCardBase & LetopisCardAction;
export type LetopisCardTemplate = Omit<LetopisCardBase, 'id'> & LetopisCardAction;