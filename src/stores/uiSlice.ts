import type { StateCreator } from 'zustand';
import type { GameSlice } from './gameSlice';

export interface UiSlice {
  showTradeDialog: boolean;
  showFortressDialog: boolean;
  showDestructionDialog: boolean;

  openTradeDialog: () => void;
  closeTradeDialog: () => void;
  openFortressDialog: () => void;
  closeFortressDialog: () => void;
  openDestructionDialog: () => void;
  closeDestructionDialog: () => void;
}

export type UiStore = GameSlice & UiSlice;

export const createUiSlice: StateCreator<UiStore, [], [], UiSlice> = (set) => ({
  showTradeDialog: false,
  showFortressDialog: false,
  showDestructionDialog: false,

  openTradeDialog: () => set({ showTradeDialog: true }),
  closeTradeDialog: () => set({ showTradeDialog: false }),
  openFortressDialog: () => set({ showFortressDialog: true }),
  closeFortressDialog: () => set({ showFortressDialog: false }),
  openDestructionDialog: () => set({ showDestructionDialog: true }),
  closeDestructionDialog: () => set({ showDestructionDialog: false }),
});