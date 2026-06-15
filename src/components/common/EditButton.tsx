"use client";

import { useRouter } from "next/navigation";

interface EditButtonProps {
  editPath: string;
}

export default function EditButton({ editPath }: EditButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(editPath)}
      className="border-2 px-2 py-1 rounded-xl border-gray-400"
    >
      수정
    </button>
  );
}
