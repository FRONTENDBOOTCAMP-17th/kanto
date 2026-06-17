import { Search } from "lucide-react";

interface AdminUsersInput {
  search: string;
  setSearch: (value: string) => void;
}

export default function AdminUsersInput({
  search,
  setSearch,
}: AdminUsersInput) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2/5 -translate-y-1/2 text-gray-300" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름 또는 이메일로 검색..."
        className="border rounded-lg border-gray-300 py-2 pl-9 mb-4 "
      />
    </div>
  );
}
