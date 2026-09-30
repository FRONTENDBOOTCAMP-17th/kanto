import { requireSuperAdminOrRedirect } from "@/services/user/user";
import { getAdmins, getTeams } from "./actions";
import { PermissionsClient } from "./_components/PermissionsClient";

export default async function PermissionsPage() {
  await requireSuperAdminOrRedirect();

  const [admins, teams] = await Promise.all([getAdmins(), getTeams()]);

  return <PermissionsClient initialAdmins={admins} initialTeams={teams} />;
}
