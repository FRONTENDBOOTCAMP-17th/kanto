import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/services/user/user";
import { getAuditLogs } from "@/services/admin/auditLog";
import { AuditLogsClient } from "./_components/AuditLogsClient";

export default async function AuditLogsPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/admin");
  }

  const logs = await getAuditLogs();

  return <AuditLogsClient initialLogs={logs} />;
}
