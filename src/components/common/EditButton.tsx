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
      className="cursor-pointer text-sm text-gray-500 transition-colors hover:underline"
    >
      수정
    </button>
  );
}
