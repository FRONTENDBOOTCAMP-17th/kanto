import { getAdminUsers } from "@/services/admin/adminUsers";
import AdminUsersClient from "@/app/(admin)/admin/users/_components/AdminUsersClient";

export default async function AdminUsers() {
  const users = await getAdminUsers();

  return (
    <div>
      <AdminUsersClient users={users} />
    </div>
  );
}
