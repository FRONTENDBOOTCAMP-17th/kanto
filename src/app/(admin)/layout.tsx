import type { Metadata } from "next";
import AdminGuard from "./_components/AdminGuard";
import AdminShell from "./_components/AdminShell";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
