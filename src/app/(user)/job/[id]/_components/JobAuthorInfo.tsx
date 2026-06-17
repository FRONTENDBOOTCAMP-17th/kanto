"use client";

import Image from "next/image";
import { UserCircle2, Phone, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import postChat from "@/services/chat/postChat";
import { useChatStore } from "@/store/chatStore";
import type { JobDetail } from "@/type/job/jobsDetail";

export default function JobAuthorInfo({
  job,
  userId,
}: {
  job: JobDetail;
  userId: number | undefined;
}) {
  const t = useTranslations("Job");
  const name = job.posts.users?.name ?? job.manager_name;
  const isOwner = userId !== undefined && userId === job.posts.users?.id;

  const handleChat = async () => {
    if (!userId || !job.posts.users) return;
    const chatId = await postChat(userId, job.posts.users.id, job.post_id);
    useChatStore.getState().openWidget(chatId);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-base md:text-lg">{t("managerInfo")}</h2>
      <div className="flex items-center gap-3">
        {job.posts.users?.avatar_url ? (
          <Image
            src={job.posts.users.avatar_url}
            alt={t("profileAlt")}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10 shrink-0"
          />
        ) : (
          <UserCircle2 className="w-10 h-10 text-gray-400 shrink-0" />
        )}
        <div>
          <p className="font-medium md:text-lg">{name}</p>
          {job.manager_title && (
            <p className="text-sm md:text-base text-gray-500">{job.manager_title}</p>
          )}
        </div>
      </div>
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
    </div>
  );
}
