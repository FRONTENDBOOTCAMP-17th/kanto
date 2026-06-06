import Link from "next/link";

const pages = [
  {
    category: "인증",
    items: [
      { label: "로그인", path: "/login", status: "done" },
      { label: "회원가입", path: "/signup", status: "done" },
      { label: "프로필", path: "/profile", status: "done" },
    ],
  },
  {
    category: "중고마켓",
    items: [
      { label: "목록", path: "/usedgoods", status: "done" },
      { label: "상세", path: "/usedgoods/1", status: "wip" },
      { label: "글쓰기", path: "/usedgoods/create", status: "wip" },
    ],
  },
  {
    category: "채팅",
    items: [
      { label: "채팅 목록", path: "/chat", status: "wip" },
    ],
  },
];

const statusStyle: Record<string, string> = {
  done: "bg-teal-100 text-teal-700",
  wip: "bg-yellow-100 text-yellow-700",
  todo: "bg-gray-100 text-gray-500",
};

const statusLabel: Record<string, string> = {
  done: "완료",
  wip: "진행중",
  todo: "예정",
};

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kanto Dev</h1>
          <p className="text-sm text-gray-400 mt-1">개발 환경 페이지 목록</p>
        </div>

        <div className="flex flex-col gap-6">
          {pages.map(({ category, items }) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {category}
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {items.map(({ label, path, status }) => (
                  <Link
                    key={path}
                    href={path}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-800">
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">{path}</span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[status]}`}
                    >
                      {statusLabel[status]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
