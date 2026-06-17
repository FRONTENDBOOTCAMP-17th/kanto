import { User } from "@/app/(admin)/admin/users/_components/AdminUsersClient";
import { useRouter } from "next/navigation";

interface AdminUsersTable {
  users: User[];
}

export default function AdminUsersTable({ users }: AdminUsersTable) {
  const router = useRouter();

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="text-left ">
          <tr className="bg-gray-200">
            <th className="pl-2 py-2">이름</th>
            <th className="pl-2 py-2">이메일</th>
            <th className="pl-2 py-2">작성 글</th>
            <th className="pl-2 py-2"> 가입일</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              onClick={() => router.push(`/admin/users/${user.id}`)}
              key={user.id}
              className="border cursor-pointer"
            >
              <td className="pl-2 py-2">{user.name}</td>
              <td className="pl-2 py-2">{user.email}</td>
              <td className="pl-2 p-2">{user.post_count}</td>
              <td className="pl-2 py-2">{user.created_at?.split("T")[0]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
