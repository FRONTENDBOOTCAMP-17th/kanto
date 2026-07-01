"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Phone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import findChat from "@/services/chat/postChat";
import { checkBlockedAction } from "@/components/common/chat/chatPanel/room/actions";
import Toast from "@/components/common/Toast";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import type { JobDetail } from "@/type/job/jobsDetail";

export default function JobAuthorInfo({
  job,
  userId,
}: {
  job: JobDetail;
  userId: number | undefined;
}) {
  const router = useRouter();
  const t = useTranslations("Job");
  const tChat = useTranslations("Chat");
  const name = job.posts.users?.name ?? job.manager_name;
  const isOwner = userId !== undefined && userId === job.posts.users?.id;
  const { isSuspended, openModal } = useSuspended();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlockToast, setShowBlockToast] = useState(false);

  const handleOpenProfile = () => {
    if (job.posts.users?.id) router.push(`/user/${job.posts.users.id}`);
  };

  const handleChat = async () => {
    if (!userId) { setShowLoginModal(true); return; }
    if (isSuspended) { openModal(); return; }
    if (!job.posts.users) return;
    if (await checkBlockedAction(job.posts.users.id)) {
      setShowBlockToast(true);
      setTimeout(() => setShowBlockToast(false), 3000);
      return;
    }
    const chatId = await findChat(userId, job.posts.users.id, job.post_id);
    if (chatId !== null) {
      useChatStore.getState().openWidget(chatId);
    } else {
      useChatStore.getState().openNewChat({
        buyerId: userId,
        sellerId: job.posts.users.id,
        postId: job.post_id,
        postTitle: job.posts.title ?? "",
        postType: "jobs",
        postPrice: null,
        partner: {
          id: job.posts.users.id,
          name: job.posts.users.name,
          avatar_url: job.posts.users.avatar_url,
          created_at: job.posts.users.created_at,
        },
      });
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-base md:text-lg">{t("managerInfo")}</h2>
      <button
        type="button"
        onClick={handleOpenProfile}
        className="flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {job.posts.users?.avatar_url ? (
          <Image
            src={job.posts.users.avatar_url}
            alt={t("profileAlt")}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <p className="font-medium md:text-lg">{name}</p>
          {job.manager_title && (
            <p className="text-sm md:text-base text-gray-500">{job.manager_title}</p>
          )}
        </div>
      </button>
      {(job.manager_phone || job.manager_email) && (
        <div className="space-y-1 text-sm md:text-base text-gray-600">
          {job.manager_phone && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {job.manager_phone}
            </p>
          )}
          {job.manager_email && (
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {job.manager_email}
            </p>
          )}
        </div>
      )}
      {!isOwner && (
        <Button
          variant="teal"
          className="cursor-pointer self-start min-w-72"
          onClick={handleChat}
        >
          {t("chat")}
        </Button>
      )}
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={tChat("blockedCannotChat")} showMessage={showBlockToast} type="error" icon="x" />
    </div>
  );
}
