interface Props {
  totalUsers: number;
  activeUsers: number;
  todaySignups: number;
  totalPosts: number;
  todayPosts: number;
  totalReleasedTx: number;
  totalReleasedAmount: number;
}

export default function KpiCards({
  totalUsers,
  activeUsers,
  todaySignups,
  totalPosts,
  todayPosts,
  totalReleasedTx,
  totalReleasedAmount,
}: Props) {
  const KPIS = [
    { label: "총 회원수", value: totalUsers.toLocaleString(), unit: "명" },
    { label: "활성 사용자 (7일)", value: activeUsers.toLocaleString(), unit: "명" },
    { label: "오늘 신규 가입", value: `+${todaySignups}`, unit: "명" },
    { label: "총 게시글", value: totalPosts.toLocaleString(), unit: "건" },
    { label: "오늘 신규 게시글", value: `+${todayPosts}`, unit: "건" },
    { label: "완료 거래 건수", value: totalReleasedTx.toLocaleString(), unit: "건" },
    { label: "총 거래 금액", value: `₱${totalReleasedAmount.toLocaleString()}`, unit: "" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
      {KPIS.map((k) => (
        <div
          key={k.label}
          className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          <span className="text-[13px] font-semibold text-slate-500">
            {k.label}
          </span>
          <div className="mt-3.5">
            <div className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {k.value}
              <span className="ml-0.5 text-[14px] font-semibold text-slate-400">
                {k.unit}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
