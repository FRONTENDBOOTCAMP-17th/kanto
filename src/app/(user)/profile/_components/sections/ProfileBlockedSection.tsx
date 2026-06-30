"use client";

import { useEffect, useState } from "react";
import { UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { getBlockedUsers, type BlockedUser } from "@/services/chat/block";
import { unblockUserStandaloneAction } from "@/services/user/blockUser";

export function ProfileBlockedSection() {
  const t = useTranslations("Profile.blocked");
  const { user } = useAuthStore();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getBlockedUsers(user.id)
      .then(setBlocked)
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnblock = async (blockedId: number) => {
    await unblockUserStandaloneAction(blockedId);
    setBlocked((prev) => prev.filter((u) => u.id !== blockedId));
  };

  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <UserX className="w-4 h-4 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        </div>

        {!loading && blocked.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <UserX className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">{t("empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {blocked.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm shrink-0">
                  {u.name.charAt(0)}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900">{u.name}</span>
                <button
                  onClick={() => handleUnblock(u.id)}
                  className="text-xs font-semibold text-teal-600 px-3 py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                >
                  {t("unblock")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
