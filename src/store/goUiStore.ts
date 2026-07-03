import { create } from "zustand";

interface GoUiState {
  detailOpen: boolean;
  listOpen: boolean;
  hasStickyBar: boolean;
  setDetailOpen: (open: boolean) => void;
  setListOpen: (open: boolean) => void;
  setHasStickyBar: (open: boolean) => void;
}

export const useGoUiStore = create<GoUiState>((set) => ({
  detailOpen: false,
  listOpen: false,
  hasStickyBar: false,
  setDetailOpen: (open) => set({ detailOpen: open }),
  setListOpen: (open) => set({ listOpen: open }),
  setHasStickyBar: (open) => set({ hasStickyBar: open }),
}));
