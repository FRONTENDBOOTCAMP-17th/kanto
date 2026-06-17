"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useSuspended } from "@/hooks/useSuspended";

export function WriteButton({ href, label }: { href: string; label: string }) {
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
      alert("탈퇴 예정 계정은 새 글을 작성할 수 없습니다.");
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
