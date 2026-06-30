
const XENDIT_API = "https://api.xendit.co";

function authHeader() {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY 환경변수가 설정되지 않았습니다.");
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

export function isInvoicePaid(status: XenditInvoice["status"]) {
  return status === "PAID" || status === "SETTLED";
}

export interface XenditDisbursement {
  id: string;
  external_id: string;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

export async function createDisbursement(params: {
  externalId: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  amount: number;
  description: string;
}): Promise<XenditDisbursement> {
  const res = await fetch(`${XENDIT_API}/disbursements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      bank_code: params.bankCode,
      account_holder_name: params.accountHolderName,
      account_number: params.accountNumber,
      description: params.description,
      amount: params.amount,
    }),
  });

  if (!res.ok) {
    throw new Error(`Xendit disbursement 실패: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
