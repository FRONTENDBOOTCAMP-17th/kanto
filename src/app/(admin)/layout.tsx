import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();
  if (userRow?.role !== "admin") redirect("/");

  const admin = createAdminClient();
  const { count } = await admin
    .from("common_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="flex min-h-screen bg-[#f5f7f8] text-gray-900">
      <AdminSidebar pendingCount={count ?? 0} />
      <main className="flex min-w-0 flex-1 flex-col gap-5.5 p-8 max-lg:p-4 max-lg:pt-18.5">
        {children}
      </main>
    </div>
  );
}
