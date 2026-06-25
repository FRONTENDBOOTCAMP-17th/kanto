import { createAdminClient } from "@/utils/supabase/admin";

export interface AdminTransaction {
  id: number;
  external_id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  released_at: string | null;
  xendit_invoice_id: string | null;
  xendit_disbursement_id: string | null;
  buyer: { id: number; name: string; email: string | null } | null;
  seller: { id: number; name: string; email: string | null } | null;
  post: { id: number; title: string } | null;
}

export async function getAdminTransactions(): Promise<AdminTransaction[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transactions")
    .select(
      `id, external_id, amount, status, created_at, paid_at, released_at,
       xendit_invoice_id, xendit_disbursement_id,
       buyer:users!transactions_buyer_id_fkey(id, name, email),
       seller:users!transactions_seller_id_fkey(id, name, email),
       post:posts(id, title)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AdminTransaction[];
}
