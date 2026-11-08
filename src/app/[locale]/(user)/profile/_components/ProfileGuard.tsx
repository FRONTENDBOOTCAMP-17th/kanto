"use client";

import { useAuthStore } from "@/store/authStore";
import { ProfileCardSkeleton } from "./ProfileCardSkeleton";

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <ProfileCardSkeleton />;
  return <>{children}</>;
}
