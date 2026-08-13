import { create } from 'zustand';
import { createGameSlice } from './gameSlice';
import type { GameStore } from './gameSlice';
import { createUiSlice } from './uiSlice';

export const useGameStore = create<GameStore>()((...a) => ({
  ...createGameSlice(...a),
  ...createUiSlice(...a),
}));