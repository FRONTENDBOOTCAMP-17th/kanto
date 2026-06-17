import Link from "next/link";
import { User } from "@/app/(admin)/admin/users/_components/AdminUsersClient";
import { FileText, CalendarDays, Mail } from "lucide-react";

interface AdminUsersCardProps {
  users: User[];
}

export default function AdminUsersCard({ users }: AdminUsersCardProps) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Link
          key={user.id}
          href={`/admin/users/${user.id}`}
          className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition"
        >
          <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>

          <p className="flex gap-1 mt-1 text-sm text-gray-500">
            <Mail className="w-4 h-4 self-end" />
            {user.email}
          </p>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex gap-1">
              <FileText className="w-5 h-5" />글 {user.post_count ?? 0}개
            </span>
            <span className="flex gap-1">
              <CalendarDays className="w-5 h-5" />
              {user.created_at?.split("T")[0]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
