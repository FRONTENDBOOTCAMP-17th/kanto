import { requireSuperAdminOrRedirect } from "@/services/user/user";
import { PopularJobsClient } from "./_components/PopularJobsClient";

export default async function PopularJobsPage() {
  await requireSuperAdminOrRedirect();

  return <PopularJobsClient />;
}
