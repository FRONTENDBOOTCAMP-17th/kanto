"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import findChat from "@/services/chat/postChat";
import { checkBlockedAction } from "@/components/common/chat/chatPanel/room/actions";
import Toast from "@/components/common/Toast";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useGoUiStore } from "@/store/goUiStore";
import { formatPrice } from "@/utils/format";
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
  const setHasStickyBar = useGoUiStore((s) => s.setHasStickyBar);

  useEffect(() => {
    if (!isOwner) {
      setHasStickyBar(true);
      return () => setHasStickyBar(false);
    }
  }, [isOwner, setHasStickyBar]);

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
    <div className="w-full md:w-48 shrink-0 flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-600">{t("managerInfo")}</h2>
      <button
        type="button"
        onClick={handleOpenProfile}
        className="flex items-center gap-4 text-left cursor-pointer active:scale-100 group"
      >
        {job.posts.users?.avatar_url ? (
          <Image
            src={job.posts.users.avatar_url}
            alt={t("profileAlt")}
            width={56}
            height={56}
            className="rounded-full object-cover w-14 h-14 ring-2 ring-gray-100 group-hover:ring-gray-300 transition-all shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-gray-900 text-base tracking-wide">{name}</p>
          {job.manager_title && (
            <p className="text-xs text-gray-400 tracking-wide">{job.manager_title}</p>
          )}
        </div>
      </button>

      {(job.manager_phone || job.manager_email) && (
        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          {job.manager_phone && (
            <p className="flex items-center gap-2">
              <Phone className="w-3 h-3 shrink-0 text-gray-400" />
              {job.manager_phone}
            </p>
          )}
          {job.manager_email && (
            <p className="flex items-center gap-2">
              <Mail className="w-3 h-3 shrink-0 text-gray-400" />
              {job.manager_email}
            </p>
          )}
        </div>
      )}

      {!isOwner && (
        <button
          onClick={handleChat}
          className="hidden md:flex w-full items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 text-xs font-semibold tracking-widest text-gray-700 bg-white transition-all hover:bg-black/10 active:scale-[1.02] cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t("chat")}
        </button>
      )}

      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={tChat("blockedCannotChat")} showMessage={showBlockToast} type="error" icon="x" />

      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-5 py-3 md:hidden">
          <p className="text-lg font-bold tracking-tight text-gray-900">{formatPrice(job.salary)}</p>
          <button
            onClick={handleChat}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide text-gray-700 bg-white transition-all hover:bg-black/10 active:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            {t("chat")}
          </button>
        </div>
      )}
    </div>
  );
}
