"use client";

import { BadgeCheck, Heart, Clock, Eye, ChevronLeft, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tables } from "@/type/supabase";
import { formatTimeAgo, formatPrice } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import findChat from "@/services/chat/postChat";
import { checkBlockedAction } from "@/components/common/chat/chatPanel/room/actions";
import Toast from "@/components/common/Toast";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import InteractionButtons from "@/components/common/InteractionButtons";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import { Button } from "@/components/ui/button";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";
import { ApproxAreaMapWithProvider } from "@/components/common/ApproxAreaMap";
import { formatBarangayLabel } from "@/type/location";

type UsedGoods = Tables<"used_goods"> & {
  posts: Tables<"posts"> & {
    users: Pick<Tables<"users">, "id" | "name" | "avatar_url" | "auth_id" | "created_at">;
  };
};

type RelatedUsedGoods = Tables<"used_goods"> & {
  posts: Pick<Tables<"posts">, "title" | "is_sold"> | null;
};

export default function UsedGoodsDetail({
  data,
  relatedData,
  initialLiked,
  userId,
  initialReported,
}: {
  data: UsedGoods;
  relatedData: RelatedUsedGoods[] | null;
  initialLiked: boolean;
  userId: number | undefined;
  initialReported: boolean;
}) {
  const t = useTranslations("UsedGoods");
  const te = useTranslations("Enums");
  const tt = useTranslations("Time");
  const tChat = useTranslations("Chat");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage");
  const { user: storeUser } = useAuthStore();
  const isOwner = storeUser?.auth_id === data.posts.users?.auth_id;
  const images = (data.images as string[]) ?? [];
  const [likeCount, setLikeCount] = useState(data.posts.like_count ?? 0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlockToast, setShowBlockToast] = useState(false);
  const { isSuspended, openModal } = useSuspended();

  const relatedItems: RelatedItem[] = (relatedData ?? []).map((item) => ({
    id: item.id,
    href: `/usedgoods/${item.post_id}`,
    imageSrc: ((item.images as string[]) ?? [])[0] ?? null,
    title: item.posts?.title ?? "",
    priceText: formatPrice(item.price),
    overlayLabel: item.posts?.is_sold ? t("soldOut") : undefined,
  }));

  const accession = data.posts.users?.created_at
    ? new Date(data.posts.users.created_at)
    : null;

  
  const locationLabel =
    data.location_barangay || data.location_city
      ? formatBarangayLabel(data.location_barangay, data.location_city)
      : data.location_type === "그 외 지역"
        ? te("tradeLocation.otherAreas")
        : data.location_type;
  const hasCoords = data.location_lat != null && data.location_lng != null;

  const handleOpenProfile = () => {
    if (data.posts.users?.id) router.push(`/user/${data.posts.users.id}`);
  };

  const handleChat = async () => {
    if (!userId) { setShowLoginModal(true); return; }
    if (isSuspended) { openModal(); return; }
    if (!data.posts.users) return;
    if (await checkBlockedAction(data.posts.users.id)) {
      setShowBlockToast(true);
      setTimeout(() => setShowBlockToast(false), 3000);
      return;
    }
    const chatId = await findChat(userId, data.posts.users.id, data.post_id);
    if (chatId !== null) {
      useChatStore.getState().openWidget(chatId);
    } else {
      useChatStore.getState().openNewChat({
        buyerId: userId,
        sellerId: data.posts.users.id,
        postId: data.post_id,
        postTitle: data.posts.title ?? "",
        postType: "used_goods",
        postPrice: data.price,
        partner: {
          id: data.posts.users.id,
          name: data.posts.users.name,
          avatar_url: data.posts.users.avatar_url,
          created_at: data.posts.users.created_at,
        },
      });
    }
  };

  const approxMap = hasCoords && (
    <div className="mt-4">
      <ApproxAreaMapWithProvider
        lat={data.location_lat as number}
        lng={data.location_lng as number}
      />
    </div>
  );

  return (
    <div className="page-container pb-12">
      
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => router.push(fromPage ? `/usedgoods?page=${fromPage}` : "/usedgoods")} className="flex gap-2 cursor-pointer">
          <ChevronLeft />
          {t("backToList")}
        </button>
        <VerifyAuthor
          authorAuthId={data.posts.users?.auth_id}
          editPath={`/usedgoods/${data.post_id}/edit`}
          postId={data.post_id}
          redirectPath="/usedgoods"
        />
      </div>

      
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-2 md:gap-4 mt-4">
          <div className="relative">
            <ImageCarousel images={images} />
            {data.posts.is_sold ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 z-10">
                <span className="text-2xl md:text-4xl font-bold text-white">{t("soldOut")}</span>
              </div>
            ) : data.posts.is_reserved ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 z-10">
                <span className="rounded-lg bg-teal-400 px-4 py-2 text-lg font-bold text-white">
                  {t("reserved")}
                </span>
              </div>
            ) : null}
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4 min-h-112.5">
            
            <div>
              <h2 className="text-xl font-semibold mb-3">{t("productInfo")}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-gray-500 font-medium">{t("category")}</dt>
                <dd className="text-gray-700">· {data.category ? te(`productCategory.${data.category}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("condition")}</dt>
                <dd className="text-gray-700">· {data.condition ? te(`productCondition.${data.condition}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("price")}</dt>
                <dd className="text-orange-500">· {formatPrice(data.price)}</dd>
                <dt className="text-gray-500 font-medium">{t("tradeLocation")}</dt>
                <dd className="text-gray-700">· {locationLabel}</dd>
                {data.safe_payment !== null && (
                  <>
                    <dt className="text-gray-500 font-medium">{t("safePayment")}</dt>
                    <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                      · {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                    </dd>
                  </>
                )}
              </dl>
              {approxMap}
            </div>
            <hr className="border-gray-200" />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t("sellerInfo")}</h2>
              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {data.posts.users?.avatar_url ? (
                  <ImageWithFallback
                    src={data.posts.users.avatar_url}
                    alt={t("profileAlt")}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{data.posts.users?.name}</p>
                  <p className="text-sm text-gray-500">
                    {accession
                      ? tt("joinedYearMonth", {
                          year: accession.getFullYear(),
                          month: accession.getMonth() + 1,
                        })
                      : tt("joinDateUnknown")}
                  </p>
                </div>
              </button>
              {!isOwner && (
                <Button variant="teal" className="cursor-pointer self-start min-w-72" onClick={handleChat}>
                  {t("chat")}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        
        <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3">{t("productInfo")}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-gray-500 font-medium">{t("category")}</dt>
                <dd className="text-gray-700">· {data.category ? te(`productCategory.${data.category}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("condition")}</dt>
                <dd className="text-gray-700">· {data.condition ? te(`productCondition.${data.condition}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("price")}</dt>
                <dd className="text-orange-500">· {formatPrice(data.price)}</dd>
                <dt className="text-gray-500 font-medium">{t("tradeLocation")}</dt>
                <dd className="text-gray-700">· {locationLabel}</dd>
                {data.safe_payment !== null && (
                  <>
                    <dt className="text-gray-500 font-medium">{t("safePayment")}</dt>
                    <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                      · {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                    </dd>
                  </>
                )}
              </dl>
              {approxMap}
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t("sellerInfo")}</h2>
              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {data.posts.users?.avatar_url ? (
                  <ImageWithFallback
                    src={data.posts.users.avatar_url}
                    alt={t("profileAlt")}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{data.posts.users?.name}</p>
                  <p className="text-sm text-gray-500">
                    {accession
                      ? tt("joinedYearMonth", {
                          year: accession.getFullYear(),
                          month: accession.getMonth() + 1,
                        })
                      : tt("joinDateUnknown")}
                  </p>
                </div>
              </button>
              {!isOwner && (
                <Button variant="teal" className="cursor-pointer self-start min-w-72" onClick={handleChat}>
                  {t("chat")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      
      <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{data.posts.title}</h1>
            {data.safe_payment && <BadgeCheck className="text-teal-400 shrink-0" />}
          </div>
          <InteractionButtons
            postId={data.post_id}
            userId={userId}
            initialLiked={initialLiked}
            initialReported={initialReported}
            onLikeChange={(liked) => setLikeCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0))}
            size="lg"
            className="hidden md:flex shrink-0"
          />
        </div>

        <div className="text-gray-400 text-sm flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <time dateTime={data.posts.created_at}>{formatTimeAgo(data.posts.created_at, locale)}</time>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {data.posts.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {likeCount}
          </span>
          <InteractionButtons
            postId={data.post_id}
            userId={userId}
            initialLiked={initialLiked}
            initialReported={initialReported}
            onLikeChange={(liked) => setLikeCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0))}
            size="sm"
            className="md:hidden ml-auto"
          />
        </div>

        <hr className="border-gray-200 my-4" />

        <h2 className="text-xl font-semibold mb-3">{t("description")}</h2>
        <p className="text-gray-700 whitespace-pre-line">{data.content}</p>
      </div>

      
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={tChat("blockedCannotChat")} showMessage={showBlockToast} type="error" icon="x" />

      <RelatedItemsCarousel title={t("related")} items={relatedItems} />
    </div>
  );
}
