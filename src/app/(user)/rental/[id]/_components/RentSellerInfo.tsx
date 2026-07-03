"use client";

import { useState, useEffect } from "react";
import { RentalWithPost } from "@/type/rental/rentalDetail";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, MessageCircle } from "lucide-react";
import { formatPrice } from "@/utils/format";
import findChat from "@/services/chat/postChat";
import { checkBlockedAction } from "@/components/common/chat/chatPanel/room/actions";
import Toast from "@/components/common/Toast";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { useGoUiStore } from "@/store/goUiStore";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";

export default function RentSellorInfo({
  rental,
  userId,
}: {
  rental: RentalWithPost;
  userId: number | undefined;
}) {
  const router = useRouter();
  const isOwner = userId !== undefined && userId === rental.posts.users?.id;
  const setHasStickyBar = useGoUiStore((s) => s.setHasStickyBar);

  useEffect(() => {
    if (!isOwner) {
      setHasStickyBar(true);
      return () => setHasStickyBar(false);
    }
  }, [isOwner, setHasStickyBar]);
  const { isSuspended, openModal } = useSuspended();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlockToast, setShowBlockToast] = useState(false);

  const handleOpenProfile = () => {
    if (rental.posts.users?.id) router.push(`/user/${rental.posts.users.id_token ?? rental.posts.users.id}`);
  };

  const handleChat = async () => {
    if (!userId) { setShowLoginModal(true); return; }
    if (isSuspended) { openModal(); return; }
    if (!rental.posts.users || rental.post_id === null) return;
    if (await checkBlockedAction(rental.posts.users.id)) {
      setShowBlockToast(true);
      setTimeout(() => setShowBlockToast(false), 3000);
      return;
    }
    const chatId = await findChat(userId, rental.posts.users.id, rental.post_id);
    if (chatId !== null) {
      useChatStore.getState().openWidget(chatId);
    } else {
      useChatStore.getState().openNewChat({
        buyerId: userId,
        sellerId: rental.posts.users.id,
        postId: rental.post_id,
        postTitle: rental.posts.title ?? "",
        postType: "rental",
        postPrice: null,
        partner: {
          id: rental.posts.users.id,
          id_token: rental.posts.users.id_token,
          name: rental.posts.users.name,
          avatar_url: rental.posts.users.avatar_url,
          created_at: rental.posts.users.created_at,
        },
      });
    }
  };

  const t = useTranslations("Rental");
  const tt = useTranslations("Time");
  const te = useTranslations("Enums");
  const tChat = useTranslations("Chat");
  const createdAt = rental.posts.users?.created_at;
  const joined = createdAt ? new Date(createdAt) : null;

  return (
    <>
      <div className="bg-white shadow-lg p-7 flex flex-col gap-7">
        <button
          type="button"
          onClick={handleOpenProfile}
          className="flex items-center gap-4 text-left cursor-pointer active:scale-100 group"
        >
          {rental.posts.users?.avatar_url ? (
            <Image
              src={rental.posts.users.avatar_url}
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
            <p className="font-semibold text-gray-900 text-base tracking-wide">{rental.posts.users?.name}</p>
            <p className="text-xs text-gray-400 tracking-wide">
              {joined
                ? tt("joinedYearMonth", {
                    year: joined.getFullYear(),
                    month: joined.getMonth() + 1,
                  })
                : tt("joinDateUnknown")}
            </p>
          </div>
        </button>

        {!isOwner && (
          <button
            onClick={handleChat}
            className="hidden md:flex w-full items-center justify-center gap-2 border border-gray-900 py-3 text-xs font-semibold tracking-widest text-gray-900 transition-all hover:bg-gray-900 hover:text-white active:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t("chat")}
          </button>
        )}
      </div>
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={tChat("blockedCannotChat")} showMessage={showBlockToast} type="error" icon="x" />

      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-5 py-3 md:hidden">
          <div>
            {rental.rent_type && (
              <p className="text-xs tracking-widest text-gray-400 uppercase">{te(`rentType.${rental.rent_type}`)}</p>
            )}
            <p className="text-lg font-bold tracking-tight text-gray-900">{formatPrice(rental.price)}</p>
          </div>
          <button
            onClick={handleChat}
            className="flex items-center gap-2 border border-gray-900 px-4 py-2 text-xs font-semibold tracking-wide text-gray-900 transition-all hover:bg-gray-900 hover:text-white active:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            {t("chat")}
          </button>
        </div>
      )}
    </>
  );
}
