import { create } from "zustand";
import type { User } from "@/type/user";

interface AuthState {
  user: User | null; // 현재 로그인한 유저 정보 (이름, 이메일, 아바타 등 User 타입의 전체) 로그아웃시에 Null
  isLoggedIn: boolean; // 로그인 여부 (true / false)

  setUser: (user: User) => void; // 로그인에 성공 했을때 유저 정보를 저장한 뒤에 isLoggedIn을 true로 변환
  clearUser: () => void; // 로그아웃했을때 유저 정보를 지우고 isLoggedIn을 false로 변경
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
}));
