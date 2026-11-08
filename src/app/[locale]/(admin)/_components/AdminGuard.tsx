import { redirect } from "next/navigation";
import { requireAdmin } from "@/services/user/user";

export default async function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (e) {
    redirect((e as Error).message === "UNAUTHORIZED" ? "/login" : "/");
  }

  return <>{children}</>;
}
