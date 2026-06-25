import { getAdminTransactions } from "@/services/admin/adminTransactions";
import AdminPaymentsClient from "./_components/AdminPaymentsClient";

export default async function AdminPaymentsPage() {
  const transactions = await getAdminTransactions();
  return <AdminPaymentsClient transactions={transactions} />;
}
