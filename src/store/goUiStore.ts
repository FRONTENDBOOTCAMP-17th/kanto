import { create } from "zustand";

// 칸토 go! 지도 화면의 패널 열림 상태.
// - detailOpen: 우측 상세 패널(데스크톱) — 열리면 우측 하단 위젯을 숨겨 겹침 방지
// - listOpen: 목록 패널 — 모바일에서 하단 시트가 올라오면 위젯/챗봇까지 숨김
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
