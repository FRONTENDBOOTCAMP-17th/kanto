import type { Metadata } from "next";
import AdminGuard from "./_components/AdminGuard";
import AdminShell from "./_components/AdminShell";

// 로그인 사용자 쿠키를 읽는 화면이므로 항상 동적 렌더링한다.
// (명시하지 않으면 try/catch로 감싼 cookies() 호출이 빌드 시 정적 렌더링으로 잘못 굳을 수 있다)
export const dynamic = "force-dynamic";

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
