import Card from "./Card";

interface Props {
  reportTypes: { name: string; count: number; pct: string; w: string; color: string }[];
  reportStats: { weekResolved: number; resolveRate: number; avgHours: number | null };
}

export default function ReportTypes({ reportTypes, reportStats }: Props) {
  const total = reportTypes.reduce((s, t) => s + t.count, 0);

  return (
    <Card className="flex h-[520px] flex-[1_1_300px] flex-col">
      <div className="mb-[18px]">
        <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
          신고 유형 분포
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-400">총 {total}건</p>
      </div>
      {reportTypes.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-slate-400">
          신고 내역이 없습니다
        </p>
      ) : (
        <div className="flex flex-col gap-[15px]">
          {reportTypes.map((t) => (
            <div key={t.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700">
                  {t.name}
                </span>
                <span className="text-[13px] text-slate-400">
                  <span className="font-bold text-slate-900">{t.count}</span>건 · {t.pct}
                </span>
              </div>
              <div className="h-[9px] overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: t.w, background: t.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1" />
      <div className="mt-[18px] flex flex-wrap gap-2.5 border-t border-[#f1f4f6] pt-4">
        {[
          {
            label: "이번 주 처리",
            value: `${reportStats.weekResolved}건`,
            color: "text-slate-900",
          },
          {
            label: "처리율",
            value: `${reportStats.resolveRate}%`,
            color: "text-emerald-600",
          },
          {
            label: "평균 처리",
            value:
              reportStats.avgHours !== null
                ? `${reportStats.avgHours}시간`
                : "—",
            color: "text-slate-900",
          },
        ].map((s) => (
          <div key={s.label} className="flex min-w-[90px] flex-1 flex-col gap-0.5">
            <span className="text-[12px] font-medium text-slate-400">{s.label}</span>
            <span className={`text-[17px] font-extrabold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
