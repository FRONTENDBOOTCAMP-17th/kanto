export type Notice = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
};

function toNotice(row: { id: number; title: string; starts_at: string; ends_at: string }): Notice {
  return { id: row.id, title: row.title, startsAt: row.starts_at, endsAt: row.ends_at };
}

export async function getNotices(): Promise<Notice[]> {
  const res = await fetch("/api/admin/notices");
  const data = await res.json();
  return data.map(toNotice);
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new Error(body?.error ?? fallback);
}

export async function createNotice(payload: {
  title: string;
  starts_at: string;
  ends_at: string;
}): Promise<Notice> {
  const res = await fetch("/api/admin/notices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwApiError(res, "공지 등록에 실패했습니다.");
  return toNotice(await res.json());
}

export async function updateNotice(
  id: number,
  payload: { title: string; starts_at: string; ends_at: string },
): Promise<Notice> {
  const res = await fetch(`/api/admin/notices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwApiError(res, "공지 수정에 실패했습니다.");
  return toNotice(await res.json());
}

export async function deleteNotice(id: number): Promise<boolean> {
  const res = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
  return res.ok;
}
