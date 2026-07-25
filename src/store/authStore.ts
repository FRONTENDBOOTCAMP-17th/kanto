import { create } from "zustand";
import type { User } from "@/type/user";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  status: AuthStatus;

  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  status: "initializing",

  setUser: (user) => set({ user, isLoggedIn: true, status: "authenticated" }),
  clearUser: () => set({ user: null, isLoggedIn: false, status: "unauthenticated" }),
}));
