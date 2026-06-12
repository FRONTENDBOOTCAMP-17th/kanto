"use client";

import { useRouter } from "next/navigation";

interface EditButtonProps {
  id: number;
}

export default function EditButton({ id }: EditButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/usedgoods/${id}/edit`)}
      className="border-2 px-2 py-1 rounded-xl border-gray-400"
    >
      수정
    </button>
  );
}
