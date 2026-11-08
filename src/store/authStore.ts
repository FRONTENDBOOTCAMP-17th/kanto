import { create } from "zustand";
import type { User } from "@/type/user";

interface AuthState {
  user: User | null; 
  isLoggedIn: boolean; 
  // 클라이언트에서 Supabase 세션 확인이 끝났는지 (끝나기 전엔 로그인/비로그인 UI를 확정하지 않는다)
  authReady: boolean;

  setUser: (user: User) => void; 
  clearUser: () => void; 
  setAuthReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  authReady: false,

  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
  setAuthReady: () => set({ authReady: true }),
}));
