"use client";

import { useEffect } from "react";
import { useSuspended } from "@/hooks/useSuspended";

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const { isSuspended, openModal } = useSuspended();

  useEffect(() => {
    if (isSuspended) {
      openModal();
    }
  }, [isSuspended]);

  if (isSuspended) return null;
  return <>{children}</>;
}
