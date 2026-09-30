import { requireSuperAdminOrRedirect } from "@/services/user/user";
import { getAuditLogs } from "@/services/admin/auditLog";
import { AuditLogsClient } from "./_components/AuditLogsClient";

export default async function AuditLogsPage() {
  await requireSuperAdminOrRedirect();

  const logs = await getAuditLogs();

  return <AuditLogsClient initialLogs={logs} />;
}
