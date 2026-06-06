// 공통 시간 포맷 유틸 함수

/** 오전 10:00 와 같은 형태로 포맷 */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** 어제, 2일전, 3일전 / 1주전 2주전 / 1달전 2달전과 같은 형태로 포맷 */
export function formatChatListTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDay = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  const diffWeeks = Math.floor(diffDay / 7);
  const diffMonths = Math.floor(diffDay / 30);

  if (diffDay === 0) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffMonths < 1) return `${diffWeeks}주 전`;
  return `${diffMonths}달 전`;
}

export function formatDateDivider(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
