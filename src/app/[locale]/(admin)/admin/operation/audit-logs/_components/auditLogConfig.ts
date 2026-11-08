import {
  AlertTriangle,
  Bell,
  FileText,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trash2,
  UserX,
} from "lucide-react";
import type { AuditTargetType } from "@/services/admin/auditLog";

export type ActorRole = "admin" | "super_admin";

export const PAGE_SIZE = 10;

export const ACTION_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  resolve_report:    { label: "신고 처리",      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   icon: AlertTriangle },
  dismiss_report:    { label: "신고 기각",      color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  icon: AlertTriangle },
  delete_post:       { label: "게시글 삭제",    color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  delete_comment:    { label: "댓글 삭제",      color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  sanction_user:     { label: "유저 제재",      color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   icon: UserX },
  revoke_sanction:   { label: "제재 해제",      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: UserX },
  write_notice:      { label: "공지 등록",      color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  delete_notice:     { label: "공지 삭제",      color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  set_maintenance:   { label: "점검 설정",      color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: Settings },
  update_spam:       { label: "스팸 설정 변경", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", icon: MessageSquare },
  add_profanity:     { label: "금칙어 추가",    color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  delete_profanity:  { label: "금칙어 삭제",    color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  grant_permission:  { label: "권한 부여",      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: ShieldCheck },
  revoke_permission: { label: "권한 회수",      color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  icon: ShieldCheck },
  promote_admin:     { label: "어드민 등록",    color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-100",   icon: ShieldCheck },
  revoke_admin:      { label: "어드민 해제",    color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  icon: ShieldCheck },
};

export const TARGET_LABELS: Record<AuditTargetType, string> = {
  user: "유저",
  post: "게시글",
  report: "신고",
  notice: "공지",
  maintenance: "점검",
  spam_config: "스팸 설정",
  profanity: "금칙어",
};

export function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatShortDate(iso: string) {
  return iso.replace(/-/g, ".").slice(2);
}
