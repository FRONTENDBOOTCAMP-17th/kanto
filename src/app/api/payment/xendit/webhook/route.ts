import { NextResponse } from "next/server";
import {
  getTransactionByExternalId,
  updateTransaction,
} from "@/services/payment/transaction";

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
      await updateTransaction(transaction.id, {
        status: "paid",
        paid_at: new Date().toISOString(),
        xendit_invoice_id: body.id ?? transaction.xendit_invoice_id ?? undefined,
      });
    } else if (status === "EXPIRED") {
      await updateTransaction(transaction.id, { status: "expired" });
    }
  }

  return NextResponse.json({ received: true });
}
