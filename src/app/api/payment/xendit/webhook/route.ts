import { NextResponse } from "next/server";
import {
  getTransactionByExternalId,
  updateTransaction,
  postSystemMessage,
} from "@/services/payment/transaction";

const PAID_MESSAGE =
  "결제가 완료되었습니다 · 상품 수령 후 결제 카드에서 '수령 확인'을 눌러주세요";

// Xendit Invoice 콜백(webhook) 수신.
// 대시보드 Settings → Webhooks 에서 Verification Token 을 등록하고
// XENDIT_CALLBACK_TOKEN 환경변수로 검증한다.
export async function POST(req: Request) {
  const token = req.headers.get("x-callback-token");
  if (!token || token !== process.env.XENDIT_CALLBACK_TOKEN) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const externalId: string | undefined = body.external_id;
  const status: string | undefined = body.status;
  if (!externalId) {
    return NextResponse.json({ error: "missing external_id" }, { status: 400 });
  }

  const transaction = await getTransactionByExternalId(externalId);
  if (!transaction) {
    return NextResponse.json({ error: "transaction not found" }, { status: 404 });
  }

  // 멱등 처리: pending 상태일 때만 전환
  if (transaction.status === "pending") {
    if (status === "PAID" || status === "SETTLED") {
      const paid = await updateTransaction(transaction.id, {
        status: "paid",
        paid_at: new Date().toISOString(),
        xendit_invoice_id: body.id ?? transaction.xendit_invoice_id ?? undefined,
      });
      // 시스템 메시지는 부가 UX — 실패해도 webhook은 200으로 응답(재전송 불필요)
      try {
        await postSystemMessage(paid, PAID_MESSAGE);
      } catch (e) {
        console.error("결제완료 시스템 메시지 발송 실패:", e);
      }
    } else if (status === "EXPIRED") {
      await updateTransaction(transaction.id, { status: "expired" });
    }
  }

  return NextResponse.json({ received: true });
}
