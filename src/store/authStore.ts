import { create } from "zustand";
import type { User } from "@/type/user";

interface AuthState {
  user: User | null; 
  isLoggedIn: boolean; 

  setUser: (user: User) => void; 
  clearUser: () => void; 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
}));
