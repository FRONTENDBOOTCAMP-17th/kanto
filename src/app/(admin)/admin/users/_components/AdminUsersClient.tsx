"use client";

import { useState } from "react";
import AdminUsersTable from "@/app/(admin)/admin/users/_components/AdminUsersTable";
import AdminUsersInput from "@/app/(admin)/admin/users/_components/AdminUsersInput";
import AdminUsersCard from "@/app/(admin)/admin/users/_components/AdminUsersCard";

export interface User {
  id: number;
  name: string;
  email: string | null;
  post_count: number | null;
  created_at: string | null;
  report_count: number;
}

export interface AdminUsersClient {
  users: User[];
}

export default function AdminUsersClient({ users }: AdminUsersClient) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();
    const nameSearch = user.name.toLowerCase().includes(keyword);
    const emailSearch = user.email?.toLowerCase().includes(keyword);

    return nameSearch || emailSearch;
  });

  return (
    <div>
      <h1 className="text-4xl font-bold">유저 관리</h1>
      <p className="my-4">총 {users.length}명의 회원이 가입되어 있습니다.</p>
      <AdminUsersInput search={search} setSearch={setSearch} />
      <div className="hidden md:block">
        <AdminUsersTable users={filteredUsers} />
      </div>

      <div className="md:hidden">
        <AdminUsersCard users={filteredUsers} />
      </div>
    </div>
  );
}
