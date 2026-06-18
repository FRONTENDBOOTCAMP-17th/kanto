import { createAdminClient } from "@/utils/supabase/admin";
import AdminSidebar from "./_components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
