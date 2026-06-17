// Xendit Invoice API 헬퍼 (서버 전용 — Secret Key 사용)
// 문서: https://developers.xendit.co/api-reference/#create-invoice

const XENDIT_API = "https://api.xendit.co";

function authHeader() {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  // Basic 인증: base64(secretKey + ":")
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  invoice_url: string;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  amount: number;
}

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

export async function createInvoice(
  params: CreateInvoiceParams,
): Promise<XenditInvoice> {
  const res = await fetch(`${XENDIT_API}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      currency: "PHP",
      description: params.description,
      payer_email: params.payerEmail,
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`Xendit invoice 생성 실패: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getInvoice(invoiceId: string): Promise<XenditInvoice> {
  const res = await fetch(`${XENDIT_API}/v2/invoices/${invoiceId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    throw new Error(`Xendit invoice 조회 실패: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Xendit 결제완료 상태 판별 (PAID 또는 정산완료 SETTLED)
export function isInvoicePaid(status: XenditInvoice["status"]) {
  return status === "PAID" || status === "SETTLED";
}
