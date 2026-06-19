import type { Status } from "@/type/admin";

export const REPORTS_TABLE = "common_reports";

export const REPORT_STATUS = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const satisfies Record<string, Status>;
