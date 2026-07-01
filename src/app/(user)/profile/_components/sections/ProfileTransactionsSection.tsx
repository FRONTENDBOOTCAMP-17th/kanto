"use client";

import { useEffect, useState } from "react";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyTransactions, type TransactionWithPost } from "@/app/(user)/profile/_lib/actions";

const PAGE_SIZE = 8;
const HIDDEN_STATUSES = new Set(["cancelled", "expired"]);

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

export function ProfileTransactionsSection() {
  const t = useTranslations("Profile.history");
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<TransactionWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMyTransactions()
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const statusLabel: Record<string, { text: string; className: string }> = {
    pending:  { text: t("statusPending"),  className: "bg-yellow-50 text-yellow-600" },
    paid:     { text: t("statusPaid"),     className: "bg-blue-50 text-blue-600" },
    released: { text: t("statusReleased"), className: "bg-teal-50 text-teal-600" },
  };

  const filtered = transactions.filter((tx) => !HIDDEN_STATUSES.has(tx.status));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="w-4 h-4 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        </div>

        {loading ? (
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3.5">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <Receipt className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">{t("empty")}</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {paged.map((tx) => {
                const isBuyer = tx.buyer_id === user?.id;
                const role = isBuyer ? t("buyer") : t("seller");
                const status = statusLabel[tx.status] ?? { text: tx.status, className: "bg-gray-100 text-gray-400" };
                const date = new Date(tx.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                });

                return (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tx.posts?.title ?? t("deletedPost")}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>{date}</span>
                        <span>·</span>
                        <span>{role}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        ₱{tx.amount.toLocaleString()}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} total={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
