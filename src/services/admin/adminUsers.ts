import { createAdminClient } from "@/utils/supabase/admin";

const SANCTION_LABEL: Record<string, string> = {
  "7d": "7일 정지",
  "30d": "30일 정지",
  perm: "영구 정지",
  lifted: "제재 해제",
};

export interface SanctionRecord {
  id: number;
  label: string;
  sanction_type: string;
  expires_at: string | null;
  created_at: string | null;
  admin_name: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  post_count: number | null;
  created_at: string | null;
  report_count: number;
  suspended_until: string | null;
  sanctions: SanctionRecord[];
}

export async function getAdminUsers(): Promise<User[]> {
  const admin = createAdminClient();

  const [usersRes, reportsRes, sanctionsRes] = await Promise.all([
    admin
      .from("users")
      .select("id, name, email, post_count, created_at, suspended_until")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: Array<{
        id: number;
        name: string;
        email: string | null;
        post_count: number | null;
        created_at: string | null;
        suspended_until: string | null;
      }> | null;
      error: unknown;
    }>,
    admin
      .from("common_reports")
      .select("target_id")
      .eq("target_type", "user"),
    admin
      .from("user_sanctions")
      .select("id, user_id, admin_id, sanction_type, expires_at, created_at")
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: Array<{
        id: number;
        user_id: number;
        admin_id: number | null;
        sanction_type: string;
        expires_at: string | null;
        created_at: string | null;
      }> | null;
      error: unknown;
    }>,
  ]);

  if (usersRes.error) throw usersRes.error;

  const allSanctions = sanctionsRes.data ?? [];

  const adminIds = [
    ...new Set(
      allSanctions
        .filter((s) => s.admin_id != null)
        .map((s) => s.admin_id as number),
    ),
  ];
  const { data: adminUsers } = adminIds.length
    ? await admin.from("users").select("id, name").in("id", adminIds)
    : { data: [] as { id: number; name: string }[] };

  const adminMap = new Map(
    (adminUsers ?? []).map((u) => [u.id, u.name]),
  );

  const sanctionsByUser = new Map<number, SanctionRecord[]>();
  for (const s of allSanctions) {
    const record: SanctionRecord = {
      id: s.id,
      label: SANCTION_LABEL[s.sanction_type] ?? s.sanction_type,
      sanction_type: s.sanction_type,
      expires_at: s.expires_at,
      created_at: s.created_at,
      admin_name: s.admin_id ? (adminMap.get(s.admin_id) ?? null) : null,
    };
    const existing = sanctionsByUser.get(s.user_id) ?? [];
    existing.push(record);
    sanctionsByUser.set(s.user_id, existing);
  }

  const reportCountMap = new Map<number, number>();
  for (const r of reportsRes.data ?? []) {
    if (r.target_id == null) continue;
    reportCountMap.set(r.target_id, (reportCountMap.get(r.target_id) ?? 0) + 1);
  }

  return (usersRes.data ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    post_count: user.post_count,
    created_at: user.created_at,
    suspended_until: user.suspended_until ?? null,
    report_count: reportCountMap.get(user.id) ?? 0,
    sanctions: sanctionsByUser.get(user.id) ?? [],
  }));
}

export async function getAdminUserById(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", Number(id))
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminUserPosts(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, post_type, view_count, created_at")
    .eq("user_id", Number(id))
    .in("post_type", ["used_goods", "jobs", "rental"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
