"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Common");
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
      alert(t("deletionBanner.restoreFailed"));
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
          {t.rich("deletionBanner.notice", {
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}{" "}
          {daysRemaining > 0
            ? t("deletionBanner.daysLeft", { days: daysRemaining })
            : t("deletionBanner.today")}
        </p>
        <button
          type="button"
          onClick={handleRestore}
          disabled={loading}
          className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg bg-white text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-70"
        >
          {loading ? t("processing") : t("deletionBanner.restore")}
        </button>
      </div>
    </div>
  );
}
