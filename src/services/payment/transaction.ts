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

/**
 * 거래 진행 알림용 시스템 메시지를 채팅에 삽입한다.
 * 결제 카드가 위로 밀려 상태 변화를 놓치는 문제를 해소하기 위해
 * paid/released 전환 시 채팅 하단에 가운데 정렬 안내를 추가한다.
 * 세션 없는 webhook에서도 호출되므로 supabaseAdmin(service-role)으로 수행한다.
 */
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

  // 채팅 목록의 마지막 메시지/안 읽음 갱신 (postMessage 패턴과 동일)
  const { data: chat } = await supabaseAdmin
    .from("chats")
    .select("user_id_1, user_id_1_unread, user_id_2_unread")
    .eq("id", transaction.chat_id)
    .single();

  const isUser1 = chat?.user_id_1 === transaction.buyer_id;
  const unreadUpdate = isUser1
    ? { user_id_2_unread: (chat?.user_id_2_unread ?? 0) + 1 }
    : { user_id_1_unread: (chat?.user_id_1_unread ?? 0) + 1 };

  await supabaseAdmin
    .from("chats")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_content: content,
      ...unreadUpdate,
    })
    .eq("id", transaction.chat_id);
}
