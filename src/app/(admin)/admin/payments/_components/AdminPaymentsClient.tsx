"use client";

import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import type { AdminTransaction } from "@/services/admin/adminTransactions";

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending:   { label: "결제대기", className: "bg-yellow-50 text-yellow-600" },
  paid:      { label: "결제완료", className: "bg-blue-50 text-blue-600" },
  released:  { label: "거래완료", className: "bg-teal-50 text-teal-600" },
  cancelled: { label: "취소됨",   className: "bg-gray-100 text-gray-400" },
  expired:   { label: "만료됨",   className: "bg-gray-100 text-gray-400" },
};

const STATUS_FILTERS = ["전체", "pending", "paid", "released", "cancelled", "expired"];

interface Props {
  transactions: AdminTransaction[];
}

export default function AdminPaymentsClient({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (statusFilter !== "전체" && tx.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tx.external_id.toLowerCase().includes(q) ||
        tx.buyer?.name.toLowerCase().includes(q) ||
        tx.seller?.name.toLowerCase().includes(q) ||
        tx.post?.title.toLowerCase().includes(q) ||
        String(tx.id).includes(q)
      );
    });
  }, [transactions, search, statusFilter]);

  const totalAmount = filtered
    .filter((tx) => tx.status === "released")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-teal-500" />
        <h1 className="text-xl font-extrabold text-slate-900">결제내역 관리</h1>
        <span className="ml-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
          총 {transactions.length}건
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="거래ID · 게시글 · 구매자 · 판매자 검색"
          className="h-9 w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-400"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === s
                  ? "bg-teal-500 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {s === "전체" ? s : (STATUS_META[s]?.label ?? s)}
            </button>
          ))}
        </div>
        {statusFilter === "released" || statusFilter === "전체" ? (
          <span className="ml-auto text-sm font-semibold text-slate-600">
            완료 합계:{" "}
            <span className="text-teal-600">₱{totalAmount.toLocaleString()}</span>
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#edf0f2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <table className="w-full min-w-205 text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[12px] font-bold text-slate-400">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">게시글</th>
              <th className="px-4 py-3">구매자</th>
              <th className="px-4 py-3">판매자</th>
              <th className="px-4 py-3 text-right">금액</th>
              <th className="px-4 py-3 text-center">상태</th>
              <th className="px-4 py-3">생성일</th>
              <th className="px-4 py-3">완료일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                  검색 결과가 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const meta = STATUS_META[tx.status] ?? { label: tx.status, className: "bg-gray-100 text-gray-400" };
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{tx.id}</td>
                    <td className="max-w-40 px-4 py-3">
                      <span className="block truncate font-medium text-slate-800">
                        {tx.post?.title ?? <span className="text-slate-300">삭제된 게시글</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tx.buyer?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.seller?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ₱{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {tx.released_at
                        ? new Date(tx.released_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
