"use server";

import { createClient } from "@/utils/supabase/server";
import { postMessage } from "@/services/chat/message";
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  postSystemMessage,
} from "@/services/payment/transaction";
import { createInvoice } from "@/lib/xendit";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function getCurrentUser(supabase: ServerClient): Promise<SellerInfo> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("users")
    .select("id, name, avatar_url, created_at")
    .eq("auth_id", user.id)
    .single();

  if (!data) throw new Error("사용자를 찾을 수 없습니다.");
  return data as SellerInfo;
}

/**
 * 판매자가 채팅에서 안전결제를 요청한다.
 * 거래(pending)를 생성하고, 채팅에 결제요청 카드 메시지를 삽입한다.
 */
export async function createPaymentRequestAction(params: {
  chatId: number;
  postId: number;
  amount: number;
}): Promise<MessageWithSender> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new Error("결제 금액이 올바르지 않습니다.");
  }

  // 호출자가 해당 상품의 판매자(글 작성자)인지 검증
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", params.postId)
    .single();
  if (!post || post.user_id !== me.id) {
    throw new Error("안전결제는 판매자만 요청할 수 있습니다.");
  }

  // 채팅 참여자에서 구매자(판매자가 아닌 쪽) 식별
  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1, user_id_2, user_id_1_left, user_id_2_left")
    .eq("id", params.chatId)
    .single();
  if (!chat) throw new Error("채팅방을 찾을 수 없습니다.");

  const buyerId = chat.user_id_1 === me.id ? chat.user_id_2 : chat.user_id_1;
  if (!buyerId) throw new Error("구매자를 찾을 수 없습니다.");

  const externalId = `txn_${crypto.randomUUID()}`;
  const transaction = await createTransaction({
    postId: params.postId,
    chatId: params.chatId,
    buyerId,
    sellerId: me.id,
    amount: params.amount,
    externalId,
  });

  const message = await postMessage(
    {
      chatId: params.chatId,
      senderId: me.id,
      postId: params.postId,
      content: `안전결제 요청 · ₱${params.amount.toLocaleString()}`,
      type: "payment",
      transactionId: transaction.id,
    },
    supabase,
  );

  // 상대방이 채팅방을 나간 상태라면 다시 활성화
  const isUser1 = chat.user_id_1 === me.id;
  if (isUser1 && chat.user_id_2_left) {
    await supabase
      .from("chats")
      .update({ user_id_2_left: false })
      .eq("id", params.chatId);
  } else if (!isUser1 && chat.user_id_1_left) {
    await supabase
      .from("chats")
      .update({ user_id_1_left: false })
      .eq("id", params.chatId);
  }

  return { ...message, sender: me, transaction } as MessageWithSender;
}

/**
 * 구매자가 결제를 시작한다. Xendit 인보이스를 생성하고 결제 URL을 반환한다.
 */
export async function startCheckoutAction(
  transactionId: number,
): Promise<string> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new Error("거래를 찾을 수 없습니다.");
  if (transaction.buyer_id !== me.id) {
    throw new Error("결제는 구매자만 진행할 수 있습니다.");
  }
  if (transaction.status !== "pending") {
    throw new Error("이미 진행되었거나 종료된 거래입니다.");
  }

  // 이미 생성된 인보이스가 있으면 재사용
  if (transaction.xendit_invoice_url) {
    return transaction.xendit_invoice_url;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL 환경변수가 필요합니다.");

  const invoice = await createInvoice({
    externalId: transaction.external_id,
    amount: transaction.amount,
    description: `안전결제 거래 #${transaction.id}`,
    successRedirectUrl: `${baseUrl}/payment/return?txn=${transaction.id}`,
    failureRedirectUrl: `${baseUrl}/payment/return?txn=${transaction.id}&failed=1`,
  });

  await updateTransaction(transaction.id, {
    xendit_invoice_id: invoice.id,
    xendit_invoice_url: invoice.invoice_url,
  });

  return invoice.invoice_url;
}

/**
 * 구매자가 상품 수령을 확인한다. 거래를 released(정산완료)로 전환한다.
 */
export async function confirmReceiptAction(
  transactionId: number,
): Promise<Transaction> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new Error("거래를 찾을 수 없습니다.");
  if (transaction.buyer_id !== me.id) {
    throw new Error("수령 확인은 구매자만 할 수 있습니다.");
  }
  if (transaction.status !== "paid") {
    throw new Error("결제 완료된 거래만 수령 확인할 수 있습니다.");
  }

  const released = await updateTransaction(transaction.id, {
    status: "released",
    released_at: new Date().toISOString(),
  });

  // 게시글 판매완료 처리 (is_sold=true, is_reserved=false)
  await supabase
    .from("posts")
    .update({ is_sold: true, is_reserved: false })
    .eq("id", transaction.post_id);

  // 시스템 메시지는 부가 UX — 삽입 실패가 거래완료 처리 자체를 깨지 않도록 격리
  try {
    await postSystemMessage(released, "거래가 완료되었습니다");
  } catch (e) {
    console.error("거래완료 시스템 메시지 발송 실패:", e);
  }

  return released;
}

/**
 * pending 상태의 거래를 취소한다. (구매자/판매자 모두 가능)
 */
export async function cancelTransactionAction(
  transactionId: number,
): Promise<Transaction> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new Error("거래를 찾을 수 없습니다.");
  if (transaction.buyer_id !== me.id && transaction.seller_id !== me.id) {
    throw new Error("거래 당사자만 취소할 수 있습니다.");
  }
  if (transaction.status !== "pending") {
    throw new Error("결제 대기 중인 거래만 취소할 수 있습니다.");
  }

  return updateTransaction(transaction.id, { status: "cancelled" });
}
