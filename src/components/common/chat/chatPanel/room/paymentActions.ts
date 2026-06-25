"use server";

import { createClient } from "@/utils/supabase/server";
import { postMessage } from "@/services/chat/message";
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  postSystemMessage,
  getReleasedTransactionsForChat,
  hasBlockingTransactionForChat,
} from "@/services/payment/transaction";
import {
  createReview,
  getReviewByTransactionAndReviewer,
} from "@/services/review/review";
import { createInvoice, createDisbursement } from "@/lib/xendit";
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

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", params.postId)
    .single();
  if (!post || post.user_id !== me.id) {
    throw new Error("안전결제는 판매자만 요청할 수 있습니다.");
  }

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

  const { data: seller } = await supabase
    .from("users")
    .select("bank_code, bank_account_number, bank_account_name, name")
    .eq("id", transaction.seller_id)
    .single();

  if (!seller?.bank_code || !seller?.bank_account_number) {
    throw new Error(
      "판매자가 정산 계좌를 등록하지 않았습니다. 판매자에게 프로필에서 계좌를 등록해달라고 요청해주세요.",
    );
  }

  const released = await updateTransaction(transaction.id, {
    status: "released",
    released_at: new Date().toISOString(),
  });

  await supabase
    .from("posts")
    .update({ is_sold: true, is_reserved: false })
    .eq("id", transaction.post_id);

  try {
    const disbursement = await createDisbursement({
      externalId: `release_${transaction.id}`,
      bankCode: seller.bank_code,
      accountNumber: seller.bank_account_number,
      accountHolderName: seller.bank_account_name ?? seller.name ?? "",
      amount: transaction.amount,
      description: `칸토 에스크로 정산 #${transaction.id}`,
    });
    await updateTransaction(transaction.id, {
      xendit_disbursement_id: disbursement.id,
    });
  } catch (e) {
    console.error("Xendit disbursement 호출 실패:", e);
  }

  try {
    await postSystemMessage(
      released,
      "구매자가 물건을 수령했습니다 · 거래 후기를 남겨보세요",
    );
  } catch (e) {
    console.error("거래완료 시스템 메시지 발송 실패:", e);
  }

  return released;
}

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

export async function createReviewAction(input: {
  transactionId: number;
  rating: number;
  content: string;
}): Promise<void> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  const transaction = await getTransaction(input.transactionId);
  if (!transaction) throw new Error("거래를 찾을 수 없습니다.");
  if (transaction.status !== "released") {
    throw new Error("거래가 완료된 후에만 후기를 작성할 수 있습니다.");
  }

  const isBuyer = transaction.buyer_id === me.id;
  const isSeller = transaction.seller_id === me.id;
  if (!isBuyer && !isSeller) {
    throw new Error("거래 당사자만 후기를 작성할 수 있습니다.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("별점은 1~5 사이여야 합니다.");
  }
  const content = input.content.trim();

  const existing = await getReviewByTransactionAndReviewer(transaction.id, me.id);
  if (existing) throw new Error("이미 이 거래에 후기를 작성했습니다.");

  const revieweeId = isBuyer ? transaction.seller_id : transaction.buyer_id;
  const role = isBuyer ? "buyer" : "seller";

  const { data: post } = await supabase
    .from("posts")
    .select("title")
    .eq("id", transaction.post_id)
    .single();

  await createReview({
    reviewerId: me.id,
    revieweeId,
    role,
    rating: input.rating,
    content,
    transactionId: transaction.id,
    postId: transaction.post_id,
    postTitle: post?.title ?? null,
    postPrice: transaction.amount,
  });
}

export async function getChatBannerStateAction(chatId: number): Promise<{
  reviewableTransactionId: number | null;
  paymentRequestBlocked: boolean;
}> {
  const supabase = await createClient();
  const me = await getCurrentUser(supabase);

  const [released, paymentRequestBlocked] = await Promise.all([
    getReleasedTransactionsForChat(chatId),
    hasBlockingTransactionForChat(chatId),
  ]);

  let reviewableTransactionId: number | null = null;
  const latest = released[0];
  if (latest && (latest.buyer_id === me.id || latest.seller_id === me.id)) {
    const existing = await getReviewByTransactionAndReviewer(latest.id, me.id);
    reviewableTransactionId = existing ? null : latest.id;
  }

  return { reviewableTransactionId, paymentRequestBlocked };
}
