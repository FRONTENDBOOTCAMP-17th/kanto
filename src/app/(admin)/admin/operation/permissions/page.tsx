import { createClient } from "@/utils/supabase/server";
import { getAdmins, getTeams } from "./actions";
import { PermissionsClient } from "./_components/PermissionsClient";

export default async function PermissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRow } = user
    ? await supabase.from("users").select("role").eq("auth_id", user.id).single()
    : { data: null };

  const isSuperAdmin = userRow?.role === "super_admin";

  const [admins, teams] = isSuperAdmin
    ? await Promise.all([getAdmins(), getTeams()])
    : [[], []];

  return <PermissionsClient initialAdmins={admins} initialTeams={teams} isSuperAdmin={isSuperAdmin} />;
}
