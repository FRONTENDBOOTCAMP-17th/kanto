import { create } from "zustand";
import { useAuthStore } from "@/store/authStore";

interface SuspendedModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useSuspendedModalStore = create<SuspendedModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export function useSuspended() {
  const { user } = useAuthStore();
  const { open } = useSuspendedModalStore();
  const until = user?.suspended_until;
  const isSuspended = !!until && new Date(until) > new Date();
  return { isSuspended, suspendedUntil: isSuspended ? until : null, openModal: open };
}
