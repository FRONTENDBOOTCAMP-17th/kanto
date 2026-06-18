"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSuspended } from "@/hooks/useSuspended";

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSuspended, openModal } = useSuspended();

  useEffect(() => {
    if (isSuspended) {
      openModal();
      router.back();
    }
  }, [isSuspended]);

  if (isSuspended) return null;
  return <>{children}</>;
}
