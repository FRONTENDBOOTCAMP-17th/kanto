import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Transaction, TransactionStatus } from "@/type/transaction";

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

export async function getReleasedTransactionsForChat(
  chatId: number,
): Promise<Transaction[]> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("status", "released")
    .order("released_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });

  return (data as Transaction[]) ?? [];
}

// 결제 대기(pending)가 이 시간을 넘기면 만료로 간주한다. PaymentCard 의 isTimedOut 과 동일 기준.
export const PAYMENT_PENDING_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function hasBlockingTransactionForChat(
  chatId: number,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("id, status, created_at")
    .eq("chat_id", chatId)
    .in("status", ["pending", "paid", "released"]);

  // pending 이 만료 시간(24h)을 지나면 차단에서 제외해 안전결제를 다시 요청할 수 있게 한다.
  // paid(에스크로 입금)·released(완료)는 만료 없이 계속 차단한다.
  const expiryThreshold = Date.now() - PAYMENT_PENDING_EXPIRY_MS;
  const blocking = (data ?? []).filter((t) =>
    t.status === "pending"
      ? new Date(t.created_at).getTime() > expiryThreshold
      : true,
  );
  return blocking.length > 0;
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
    xendit_disbursement_id?: string;
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

export async function claimTransactionRelease(
  id: number,
  buyerId: number,
): Promise<Transaction | null> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", id)
    .eq("buyer_id", buyerId)
    .eq("status", "paid")
    .select()
    .single();

  return (data as Transaction) ?? null;
}

export async function postSystemMessage(
  transaction: Transaction,
  content: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("messages").insert({
    chat_id: transaction.chat_id,
    sender_id: transaction.buyer_id,
    post_id: transaction.post_id,
    content,
    type: "system",
    transaction_id: transaction.id,
    is_read: false,
  });

  if (error) throw new Error(error.message);

  const { data: chat } = await supabaseAdmin
    .from("chats")
    .select("user_id_1")
    .eq("id", transaction.chat_id)
    .single();

  const isUser1 = chat?.user_id_1 === transaction.buyer_id;

  await supabaseAdmin.rpc("increment_unread", {
    p_chat_id: transaction.chat_id,
    p_for_user1: !isUser1,
  });

  await supabaseAdmin
    .from("chats")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_content: content,
    })
    .eq("id", transaction.chat_id);
}
