import Link from "next/link";
import {
  getAdminUserById,
  getAdminUserPosts,
} from "@/services/admin/adminUsers";
import AdminUsersPosts from "@/app/(admin)/admin/users/[id]/_components/AdminUsersPosts";
import { ArrowLeft, User, Mail, Calendar } from "lucide-react";

interface UserInformation {
  params: Promise<{ id: string }>;
}

export default async function AdminUsersDetail({ params }: UserInformation) {
  const { id } = await params;
  const [user, posts] = await Promise.all([
    getAdminUserById(id),
    getAdminUserPosts(id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-lg text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        돌아가기
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">유저 정보</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoItem
            icon={<User className="h-5 w-5" />}
            label="이름"
            value={user.name}
          />
          <InfoItem
            icon={<Mail className="h-5 w-5" />}
            label="이메일"
            value={user.email ?? "-"}
          />
          <InfoItem
            icon={<Calendar className="h-5 w-5" />}
            label="가입일"
            value={user.created_at?.split("T")[0] ?? "-"}
          />
        </div>
      </section>

      <AdminUsersPosts posts={posts} />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
