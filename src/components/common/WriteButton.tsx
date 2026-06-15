"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function WriteButton({ href, label }: { href: string; label: string }) {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleClick = () => {
    if (user?.deleted_at) {
      alert("탈퇴 예정 계정은 새 글을 작성할 수 없습니다.");
      return;
    }
    router.push(href);
  };

  return (
    <Button variant="teal" className="cursor-pointer gap-1" onClick={handleClick}>
      <Plus className="w-4 h-4" />
      {label}
    </Button>
  );
}
