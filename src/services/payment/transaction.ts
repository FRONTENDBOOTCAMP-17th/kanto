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

export async function hasBlockingTransactionForChat(
  chatId: number,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("chat_id", chatId)
    .in("status", ["pending", "paid", "released"])
    .limit(1);
  return (data?.length ?? 0) > 0;
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
): Promise<Transaction | null> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", id)
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
