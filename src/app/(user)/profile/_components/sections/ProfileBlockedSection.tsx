"use client";

import { useEffect, useState } from "react";
import { UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { getBlockedUsers, type BlockedUser } from "@/services/chat/block";
import { unblockUserStandaloneAction } from "@/services/user/blockUser";

const PAGE_SIZE = 20;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors flex items-center justify-center">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-500">{page} / {total}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === total} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors flex items-center justify-center">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ProfileBlockedSection() {
  const t = useTranslations("Profile.blocked");
  const { user } = useAuthStore();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    getBlockedUsers(user.id)
      .then(setBlocked)
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnblock = async (blockedId: number) => {
    await unblockUserStandaloneAction(blockedId);
    setBlocked((prev) => {
      const next = prev.filter((u) => u.id !== blockedId);
      const maxPage = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      if (page > maxPage) setPage(maxPage);
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(blocked.length / PAGE_SIZE));
  const paged = blocked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <>
            <div className="flex flex-col divide-y divide-gray-100">
              {paged.map((u) => (
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
            <Pagination page={page} total={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
