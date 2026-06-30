import { create } from "zustand";

interface GoUiState {
  detailOpen: boolean;
  listOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  setListOpen: (open: boolean) => void;
}

export const useGoUiStore = create<GoUiState>((set) => ({
  detailOpen: false,
  listOpen: false,
  setDetailOpen: (open) => set({ detailOpen: open }),
  setListOpen: (open) => set({ listOpen: open }),
}));
