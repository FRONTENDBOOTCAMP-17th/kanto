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

/** N분 전, N시간 전, N일 전 형태로 포맷 */
export function formatTimeAgo(isoString: string): string {
  const now = Date.now();
  const postCreated = new Date(isoString).getTime();
  const minutes = Math.floor((now - postCreated) / 60000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}달 전`;
  const years = Math.floor(days / 365);
  return `${years}년 전`;
}

/** 마감일까지 남은 기간을 D-7 / 오늘 마감 / 마감 형태로 포맷 */
export function formatDeadline(deadline: string): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDay = Math.round(
    (startOfDay(new Date(deadline)).getTime() - startOfDay(new Date()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDay < 0) return "마감";
  if (diffDay === 0) return "오늘 마감";
  return `D-${diffDay}`;
}

export function formatDateDivider(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatSellerInfoCreatedAt(date: string | null): string {
  if (!date) {
    return `가입일 정보 없음`;
  }
  const accession = new Date(date);
  return `${accession.getFullYear()}년 ${accession.getMonth() + 1}월 가입`;
}
