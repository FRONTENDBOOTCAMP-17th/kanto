"use client";

import { useAuthStore } from "@/store/authStore";
import EditButton from "@/components/common/EditButton";
import DeleteButton from "@/components/common/DeleteButton";

interface VerifyAuthorProps {
  authorAuthId: string | null | undefined;
  editPath: string;
  postId: number;
  redirectPath: string;
}

export default function VerifyAuthor({ authorAuthId, editPath, postId, redirectPath }: VerifyAuthorProps) {
  const { user } = useAuthStore();

  if (!user || user.auth_id !== authorAuthId) return null;

  return (
    <div className="flex gap-2">
      <EditButton editPath={editPath} />
      <DeleteButton postId={postId} redirectPath={redirectPath} />
    </div>
  );
}
