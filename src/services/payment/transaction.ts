import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Transaction, TransactionStatus } from "@/type/transaction";

// 거래 쓰기/조회는 모두 service-role(supabaseAdmin)로 수행 — RLS 우회.
// (webhook은 유저 세션이 없으므로 필수, 일관성 위해 server action도 admin 사용)

export async function createTransaction(input: {
  postId: number;
  chatId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  externalId: string;
}): Promise<Transaction> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      post_id: input.postId,
      chat_id: input.chatId,
      buyer_id: input.buyerId,
      seller_id: input.sellerId,
      amount: input.amount,
      external_id: input.externalId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Transaction;
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Transaction) ?? null;
}

export async function getTransactionByExternalId(
  externalId: string,
): Promise<Transaction | null> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("external_id", externalId)
    .single();
  return (data as Transaction) ?? null;
}

export async function updateTransaction(
  id: number,
  patch: {
    status?: TransactionStatus;
    xendit_invoice_id?: string;
    xendit_invoice_url?: string;
    paid_at?: string;
    released_at?: string;
  },
): Promise<Transaction> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Transaction;
}
