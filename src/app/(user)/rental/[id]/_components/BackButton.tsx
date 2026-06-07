"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/usedgoods")}
      className="flex mx-2 my-4 gap-2"
    >
      <MoveLeft />
      목록으로
    </button>
  );
}
