import type { AdminPermission } from "../actions";

export const PERMISSIONS: { key: AdminPermission; label: string; description: string }[] = [
  { key: "delete_post",   label: "게시글 삭제", description: "게시글·댓글 삭제" },
  { key: "handle_report", label: "신고 처리",   description: "신고 승인·기각" },
  { key: "sanction_user", label: "유저 제재",   description: "정지·영구정지" },
  { key: "write_notice",  label: "공지 작성",   description: "공지 등록·수정" },
  { key: "view_stats",    label: "통계 조회",   description: "DAU/MAU 열람" },
  { key: "view_chat",     label: "채팅 열람",   description: "채팅 내역 조회" },
];
