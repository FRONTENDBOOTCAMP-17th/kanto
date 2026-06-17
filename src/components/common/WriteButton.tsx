"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useSuspended } from "@/hooks/useSuspended";

export function WriteButton({ href, label }: { href: string; label: string }) {
  const t = useTranslations("Common");
  const { user } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (isSuspended) {
      openModal();
      return;
    }
    if (user.deleted_at) {
      alert(t("deletedAccount.write"));
      return;
    }
    router.push(href);
  };

  return (
    <>
      <Button variant="teal" className="cursor-pointer gap-1" onClick={handleClick}>
        <Plus className="w-4 h-4" />
        {label}
      </Button>
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
