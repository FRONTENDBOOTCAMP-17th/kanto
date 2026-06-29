"use client";

import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { AdminPagination } from "@/app/(admin)/admin/_components/AdminPagination";
import type { AdminTransaction } from "@/services/admin/adminTransactions";

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending:   { label: "결제대기",  className: "bg-yellow-50 text-yellow-600" },
  paid:      { label: "결제완료",  className: "bg-blue-50 text-blue-600" },
  released:  { label: "거래완료",  className: "bg-teal-50 text-teal-600" },
  cancelled: { label: "취소됨",    className: "bg-gray-100 text-gray-400" },
  expired:   { label: "만료됨",    className: "bg-gray-100 text-gray-400" },
};

const STATUS_FILTERS = ["전체", "pending", "paid", "released", "cancelled", "expired"];
const PAGE_SIZE = 20;

interface Props {
  transactions: AdminTransaction[];
}

export default function AdminPaymentsClient({ transactions }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (statusFilter !== "전체" && tx.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tx.buyer?.name?.toLowerCase().includes(q) ||
        tx.seller?.name?.toLowerCase().includes(q) ||
        tx.post?.title?.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const releasedTotal = filtered
    .filter((tx) => tx.status === "released")
    .reduce((sum, tx) => sum + tx.amount, 0);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="whitespace-nowrap text-[31px] font-extrabold tracking-tight text-slate-900">
              결제내역 관리
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">
            플랫폼 내 모든 거래 내역을 조회하세요
          </p>
        </div>
        <div className="whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[14px] py-[9px] text-[13px] font-medium text-slate-500">
          총 <span className="font-bold text-slate-900">{transactions.length}</span>건
          {releasedTotal > 0 && (
            <span className="ml-2 font-bold text-teal-600">
              · 완료 ₱{releasedTotal.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2.5 rounded-[14px] border border-[#e7ebee] bg-white px-4 py-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="게시글 · 구매자 · 판매자 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={[
              "rounded-[9px] px-3.5 py-[7px] text-[13px] font-semibold transition-colors",
              statusFilter === s
                ? "bg-teal-500 text-white"
                : "border border-[#e7ebee] bg-white text-slate-500 hover:bg-slate-50",
            ].join(" ")}
          >
            {s === "전체" ? "전체" : (STATUS_META[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {/* 데스크탑: 테이블 */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f6] bg-slate-50">
                {["ID", "게시글", "구매자", "판매자", "금액", "상태", "생성일", "완료일"].map((h) => (
                  <th
                    key={h}
                    className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((tx) => {
                const meta = STATUS_META[tx.status] ?? { label: tx.status, className: "bg-gray-100 text-gray-400" };
                return (
                  <tr key={tx.id} className="border-t border-[#f3f5f7] hover:bg-slate-50">
                    <td className="px-[18px] py-[15px] font-mono text-[12px] text-slate-400">
                      #{tx.id}
                    </td>
                    <td className="max-w-40 px-[18px] py-[15px]">
                      <span className="block truncate text-[13.5px] text-slate-700">
                        {tx.post?.title ?? <span className="text-slate-300">삭제된 게시글</span>}
                      </span>
                    </td>
                    <td className="px-[18px] py-[15px] text-[13.5px] text-slate-600">
                      {tx.buyer?.name ?? "-"}
                    </td>
                    <td className="px-[18px] py-[15px] text-[13.5px] text-slate-600">
                      {tx.seller?.name ?? "-"}
                    </td>
                    <td className="px-[18px] py-[15px] text-[13.5px] font-semibold text-slate-800">
                      ₱{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-400">
                      {tx.created_at.split("T")[0]}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-400">
                      {tx.released_at ? tx.released_at.split("T")[0] : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 */}
        {pageItems.length > 0 && (
          <div className="lg:hidden divide-y divide-[#f3f5f7]">
            {pageItems.map((tx) => {
              const meta = STATUS_META[tx.status] ?? { label: tx.status, className: "bg-gray-100 text-gray-400" };
              return (
                <div key={tx.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 truncate text-[14px] font-bold text-slate-900">
                      {tx.post?.title ?? <span className="text-slate-300">삭제된 게시글</span>}
                    </span>
                    <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[12.5px] text-slate-500">
                    <span>{tx.buyer?.name ?? "-"} → {tx.seller?.name ?? "-"}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold text-slate-800">₱{tx.amount.toLocaleString()}</span>
                      <span className="text-slate-400">{tx.created_at.split("T")[0]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <CreditCard className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">거래 내역이 없습니다</div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">검색어나 필터를 변경해보세요</div>
          </div>
        )}

        {totalPages > 1 && (
          <AdminPagination
            currentPage={curPage}
            totalPages={totalPages}
            onPageChange={setPage}
            countLabel={<>총 <span className="font-semibold text-slate-600">{filtered.length}</span>건 중 <span className="font-semibold text-slate-600">{filtered.length === 0 ? "0" : `${startIdx + 1}–${startIdx + pageItems.length}`}</span> 표시</>}
          />
        )}
      </div>
    </>
  );
}
