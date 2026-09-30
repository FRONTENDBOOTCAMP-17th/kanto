"use client";

import { BadgeCheck, ChevronLeft, User, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tables } from "@/type/supabase";
import { formatTimeAgo, formatPrice } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import findChat from "@/services/chat/postChat";
import { checkBlockedAction } from "@/components/common/chat/features/block/blockActions";
import Toast from "@/components/common/Toast";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import InteractionButtons from "@/components/common/InteractionButtons";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import { useGoUiStore } from "@/store/goUiStore";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";
import { ApproxAreaMap } from "@/components/common/ApproxAreaMap";
import { formatBarangayLabel } from "@/type/location";

type UsedGoods = Tables<"used_goods"> & {
  id_token?: string;
  posts: Tables<"posts"> & {
    users: Pick<Tables<"users">, "id" | "avatar_url" | "auth_id" | "created_at"> & {
      name: string | null;
      id_token?: string;
    };
  };
};

type RelatedUsedGoods = Tables<"used_goods"> & {
  id_token?: string;
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
  const setHasStickyBar = useGoUiStore((s) => s.setHasStickyBar);
  useEffect(() => {
    if (!isOwner) {
      setHasStickyBar(true);
      return () => setHasStickyBar(false);
    }
  }, [isOwner, setHasStickyBar]);

  const relatedItems: RelatedItem[] = (relatedData ?? []).map((item) => ({
    id: item.id,
    href: `/usedgoods/${item.id_token ?? item.post_id}`,
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
    if (data.posts.users?.id) router.push(`/user/${data.posts.users.id_token ?? data.posts.users.id}`);
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
          id_token: data.posts.users.id_token,
          name: data.posts.users.name ?? "",
          avatar_url: data.posts.users.avatar_url,
          created_at: data.posts.users.created_at,
        },
      });
    }
  };

  const approxMap = hasCoords && (
    <div className="mt-4">
      <ApproxAreaMap
        lat={data.location_lat as number}
        lng={data.location_lng as number}
      />
    </div>
  );

  return (
    <div className="page-container pb-28 md:pb-12">
      
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => router.push(fromPage ? `/usedgoods?page=${fromPage}` : "/usedgoods")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer active:scale-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <VerifyAuthor
          authorAuthId={data.posts.users?.auth_id}
          editPath={`/usedgoods/${data.id_token ?? data.post_id}/edit`}
          postId={data.post_id}
          redirectPath="/usedgoods"
        />
      </div>

      
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-4">
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

          <div className="flex flex-col gap-6 pt-4 md:pt-0">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400">{t("productInfo")}</h2>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm flex-1">
                <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("category")}</dt>
                <dd className="text-gray-900">{data.category ? te(`productCategory.${data.category}`) : ""}</dd>
                <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("condition")}</dt>
                <dd className="text-gray-900">{data.condition ? te(`productCondition.${data.condition}`) : ""}</dd>
                <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("price")}</dt>
                <dd className="text-gray-900 font-medium">{formatPrice(data.price)}</dd>
                <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("tradeLocation")}</dt>
                <dd className="text-gray-900">{locationLabel}</dd>
                {data.safe_payment !== null && (
                  <>
                    <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("safePayment")}</dt>
                    <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                      {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                    </dd>
                  </>
                )}
              </dl>
              <div className="w-full lg:w-48 shrink-0 flex flex-col gap-7">
                <button
                  type="button"
                  onClick={handleOpenProfile}
                  className="flex items-center gap-4 text-left cursor-pointer active:scale-100 group"
                >
                  {data.posts.users?.avatar_url ? (
                    <ImageWithFallback
                      src={data.posts.users.avatar_url}
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
                    <p className="font-semibold text-gray-900 text-base tracking-wide">{data.posts.users?.name}</p>
                    <p className="text-xs text-gray-400 tracking-wide">
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
                  <button
                    onClick={handleChat}
                    className="hidden md:flex w-full items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 text-xs font-semibold tracking-widest text-gray-700 bg-white transition-all hover:bg-black/10 active:scale-[1.02] cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t("chat")}
                  </button>
                )}
              </div>
            </div>
            {hasCoords && (
              <div className="mt-auto">
                <ApproxAreaMap
                  lat={data.location_lat as number}
                  lng={data.location_lng as number}
                />
              </div>
            )}
          </div>
        </div>
      ) : (

        <div className="flex flex-col gap-6 mt-4">
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400">{t("productInfo")}</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm flex-1">
              <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("category")}</dt>
              <dd className="text-gray-900">{data.category ? te(`productCategory.${data.category}`) : ""}</dd>
              <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("condition")}</dt>
              <dd className="text-gray-900">{data.condition ? te(`productCondition.${data.condition}`) : ""}</dd>
              <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("price")}</dt>
              <dd className="text-gray-900 font-medium">{formatPrice(data.price)}</dd>
              <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("tradeLocation")}</dt>
              <dd className="text-gray-900">{locationLabel}</dd>
              {data.safe_payment !== null && (
                <>
                  <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("safePayment")}</dt>
                  <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                    {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                  </dd>
                </>
              )}
            </dl>
            <div className="w-full md:w-48 shrink-0 flex flex-col gap-7">
              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex items-center gap-4 text-left cursor-pointer active:scale-100 group"
              >
                {data.posts.users?.avatar_url ? (
                  <ImageWithFallback
                    src={data.posts.users.avatar_url}
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
                  <p className="font-semibold text-gray-900 text-base tracking-wide">{data.posts.users?.name}</p>
                  <p className="text-xs text-gray-400 tracking-wide">
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
                <button
                  onClick={handleChat}
                  className="hidden md:flex w-full items-center justify-center gap-2 border border-gray-200 rounded-lg py-3 text-xs font-semibold tracking-widest text-gray-700 bg-white transition-all hover:bg-black/10 active:scale-[1.02] cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {t("chat")}
                </button>
              )}
            </div>
          </div>
          {approxMap}
        </div>
      )}

      
      <div className="mt-6 md:mt-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{data.posts.title}</h1>
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

        <div className="text-gray-400 text-xs flex items-center gap-5 mt-3">
          <time dateTime={data.posts.created_at}>{formatTimeAgo(data.posts.created_at, locale)}</time>
          <span className="flex items-center gap-1">
            {t("views")} {data.posts.view_count}
          </span>
          <span className="flex items-center gap-1">
            {t("likes")} {likeCount}
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

        <hr className="border-gray-200 my-8" />

        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 mb-4">{t("description")}</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">{data.content}</p>
      </div>

      
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={tChat("blockedCannotChat")} showMessage={showBlockToast} type="error" icon="x" />

      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-5 py-3 md:hidden">
          <p className="text-lg font-bold tracking-tight text-gray-900">{formatPrice(data.price)}</p>
          <button
            onClick={handleChat}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide text-gray-700 bg-white transition-all hover:bg-black/10 active:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            {t("chat")}
          </button>
        </div>
      )}

      <RelatedItemsCarousel title={t("related")} items={relatedItems} />
    </div>
  );
}
