"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import type { User } from "@/type/user";

function getDaysRemaining(deletedAt: string): number {
  const deletedDate = new Date(deletedAt);
  const expiresAt = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

export function DeletionPendingBanner() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const deletedAt = user?.deleted_at;
  const authId = user?.auth_id;
  if (!deletedAt || !authId) return null;

  const daysRemaining = getDaysRemaining(deletedAt);

  const handleRestore = async () => {
    setLoading(true);
    const res = await fetch("/api/user", { method: "PATCH" });
    if (!res.ok) {
      alert("탈퇴 철회에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at")
      .eq("auth_id", authId)
      .single();
    if (data) setUser(data as User);
    setLoading(false);
  };

  return (
    <div className="w-full bg-red-500 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-semibold">탈퇴 예정 계정</span>입니다.{" "}
          {daysRemaining > 0
            ? `${daysRemaining}일 후 모든 데이터가 영구 삭제됩니다.`
            : "오늘 데이터가 삭제될 예정입니다."}
        </p>
        <button
          type="button"
          onClick={handleRestore}
          disabled={loading}
          className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg bg-white text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-70"
        >
          {loading ? "처리 중..." : "탈퇴 철회"}
        </button>
      </div>
    </div>
  );
}
