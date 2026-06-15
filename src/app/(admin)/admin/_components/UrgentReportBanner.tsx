import { AlertTriangle, ArrowRight } from "lucide-react";

interface Props {
  pendingTotal: number;
  pendingUser: number;
  pendingPost: number;
  oldestDays: number | null;
}

export default function UrgentReportBanner({
  pendingTotal,
  pendingUser,
  pendingPost,
  oldestDays,
}: Props) {
  if (pendingTotal === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#fbd5d5] border-l-[5px] border-l-red-500 bg-white px-[22px] py-[18px] shadow-[0_4px_18px_rgba(239,68,68,0.08)]">
      <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-[14px] bg-red-50">
        <AlertTriangle
          className="h-[25px] w-[25px] text-red-500"
          strokeWidth={2.1}
        />
      </div>
      <div className="min-w-[200px] flex-1">
        <div className="text-[17px] font-extrabold text-slate-900">
          <span className="text-red-600">{pendingTotal}건</span>의 신고가
          처리를 기다리고 있어요
        </div>
        <div className="mt-1 text-[14px] text-slate-500">
          회원 신고 {pendingUser}건 · 게시글 신고 {pendingPost}건
          {oldestDays !== null && (
            <>
              {" "}
              — 가장 오래된 신고는{" "}
              <span className="font-semibold text-red-600">{oldestDays}일</span>{" "}
              경과
            </>
          )}
        </div>
      </div>
      <button className="flex items-center gap-1.5 whitespace-nowrap rounded-[11px] bg-red-500 px-5 py-3 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(239,68,68,0.3)] hover:bg-red-600">
        지금 처리하기
        <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
      </button>
    </div>
  );
}
