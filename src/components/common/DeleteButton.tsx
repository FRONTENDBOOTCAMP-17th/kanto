"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface DeleteButtonProps {
  postId: number;
}

export default function DeleteButton({ postId }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("posts").delete().eq("id", postId);

    router.push("/usedgoods");
  };

  return (
    <button
      onClick={handleDelete}
      className="border-2 px-2 py-1 rounded-xl bg-red-600 border-red-600 text-white"
    >
      삭제
    </button>
  );
}
