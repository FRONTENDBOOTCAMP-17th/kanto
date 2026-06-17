import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  getTransaction,
  updateTransaction,
  postSystemMessage,
} from "@/services/payment/transaction";
import { getInvoice, isInvoicePaid } from "@/lib/xendit";

// Xendit 결제 후 success/failure redirect 도착 지점.
// webhook 이 닿지 않는 로컬 환경에서도 결제 상태를 보장하기 위해
// 인보이스 상태를 재조회해 거래를 갱신한다.
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
            // webhook이 먼저 paid로 바꿨다면 위 status==='paid' 분기로 빠져 여기 도달 안 함(멱등).
            // 드물게 webhook과 동시 실행되면 메시지가 중복될 수 있으나 테스트 범위에서 허용.
            const updated = await updateTransaction(transaction.id, {
              status: "paid",
              paid_at: new Date().toISOString(),
            });
            paid = true;
            // 시스템 메시지는 부가 UX — 실패해도 결제완료 표시(paid)는 유지
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
          // 조회 실패 시 대기 상태로 안내 (webhook 이 추후 반영)
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
