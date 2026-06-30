"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function refreshKtsScore() {
  const admin = createAdminClient();
  await admin.rpc("recalculate_kts" as never);
  await admin.rpc("recalculate_kpps" as never);
}

export interface TransactionWithPost {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  released_at: string | null;
  buyer_id: number;
  seller_id: number;
  post_id: number;
  chat_id: number;
  posts: { title: string } | null;
}

export async function getMyTransactions(): Promise<TransactionWithPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: me } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!me) return [];

  const { data } = await supabase
    .from("transactions")
    .select("id, amount, status, created_at, paid_at, released_at, buyer_id, seller_id, post_id, chat_id, posts(title)")
    .or(`buyer_id.eq.${me.id},seller_id.eq.${me.id}`)
    .order("created_at", { ascending: false });

  return (data as unknown as TransactionWithPost[]) ?? [];
}
