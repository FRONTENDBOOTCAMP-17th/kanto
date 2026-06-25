import type { Scope } from "@/services/admin/adminContent";

export const SCOPE_OPTIONS: { key: Scope; label: string; style: string }[] = [
  { key: "chat", label: "채팅", style: "border-blue-200 bg-blue-50 text-blue-600" },
  { key: "post", label: "게시글", style: "border-amber-200 bg-amber-50 text-amber-600" },
  { key: "nickname", label: "닉네임", style: "border-purple-200 bg-purple-50 text-purple-600" },
];
