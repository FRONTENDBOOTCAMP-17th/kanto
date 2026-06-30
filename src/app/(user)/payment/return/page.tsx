import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  getTransaction,
  updateTransaction,
  postSystemMessage,
} from "@/services/payment/transaction";
import { getInvoice, isInvoicePaid } from "@/lib/xendit";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ txn?: string; failed?: string }>;
}) {
  const { txn, failed } = await searchParams;
  const transactionId = Number(txn);

  let paid = false;

  if (Number.isInteger(transactionId)) {
    const transaction = await getTransaction(transactionId);
    if (transaction) {
      if (transaction.status === "paid" || transaction.status === "released") {
        paid = true;
      } else if (transaction.status === "pending" && transaction.xendit_invoice_id) {
        try {
          const invoice = await getInvoice(transaction.xendit_invoice_id);
          if (isInvoicePaid(invoice.status)) {
            const updated = await updateTransaction(transaction.id, {
              status: "paid",
              paid_at: new Date().toISOString(),
            });
            paid = true;
            try {
              await postSystemMessage(
                updated,
                "결제가 완료되었습니다 · 상품 수령 후 결제 카드에서 '수령 확인'을 눌러주세요",
              );
            } catch (e) {
              console.error("결제완료 시스템 메시지 발송 실패:", e);
            }
          }
        } catch {
        }
      }
    }
  }

  const state = paid ? "paid" : failed ? "failed" : "pending";

  const view = {
    paid: {
      icon: <CheckCircle2 className="w-14 h-14 text-teal-500" />,
      title: "결제가 완료되었습니다",
      desc: "안전결제 금액이 에스크로에 보관되었습니다. 상품 수령 후 채팅에서 '수령 확인'을 눌러 거래를 완료해 주세요.",
    },
    failed: {
      icon: <XCircle className="w-14 h-14 text-red-500" />,
      title: "결제가 취소되었습니다",
      desc: "결제가 완료되지 않았습니다. 채팅에서 다시 시도할 수 있습니다.",
    },
    pending: {
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      title: "결제 확인 중입니다",
      desc: "결제 상태를 확인하고 있습니다. 잠시 후 채팅에서 상태가 업데이트됩니다.",
    },
  }[state];

  return (
    <div className="page-container flex flex-col items-center justify-center gap-4 py-20 text-center">
      {view.icon}
      <h1 className="text-2xl font-semibold">{view.title}</h1>
      <p className="text-gray-500 max-w-md">{view.desc}</p>
      <Link
        href={ROUTES.home}
        className="mt-2 rounded-full bg-teal-500 px-6 py-2.5 text-white hover:bg-teal-600 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
