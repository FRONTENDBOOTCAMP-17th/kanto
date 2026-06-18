"use client";

import Link from "next/link";
import { BadgeCheck, Heart, Clock, Eye, MoveLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Tables } from "@/type/supabase";
import { formatTimeAgo } from "@/utils/formatTime";
import type { Locale } from "@/i18n/config";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import findChat from "@/services/chat/postChat";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import InteractionButtons from "@/components/common/InteractionButtons";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import { Button } from "@/components/ui/button";

type UsedGoods = Tables<"used_goods"> & {
  posts: Tables<"posts"> & {
    users: Pick<Tables<"users">, "id" | "name" | "avatar_url" | "auth_id" | "role" | "post_count" | "created_at">;
  };
};

export default function UsedGoodsDetail({
  data,
  relatedData,
  initialLiked,
  userId,
  initialReported,
}: {
  data: UsedGoods;
  relatedData: UsedGoods[] | null;
  initialLiked: boolean;
  userId: number | undefined;
  initialReported: boolean;
}) {
  const t = useTranslations("UsedGoods");
  const te = useTranslations("Enums");
  const tt = useTranslations("Time");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user: storeUser } = useAuthStore();
  const isOwner = storeUser?.auth_id === data.posts.users?.auth_id;
  const images = (data.images as string[]) ?? [];
  const [likeCount, setLikeCount] = useState(data.posts.like_count ?? 0);
  const { isSuspended, openModal } = useSuspended();

  const accession = data.posts.users?.created_at
    ? new Date(data.posts.users.created_at)
    : null;

  const handleChat = async () => {
    if (isSuspended) { openModal(); return; }
    if (!userId || !data.posts.users) return;
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

  return (
    <div className="page-container pb-12">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => router.push("/usedgoods")} className="flex gap-2 cursor-pointer">
          <MoveLeft />
          {t("backToList")}
        </button>
        <VerifyAuthor
          authorAuthId={data.posts.users?.auth_id}
          editPath={`/usedgoods/${data.post_id}/edit`}
          postId={data.post_id}
          redirectPath="/usedgoods"
        />
      </div>

      {/* 이미지 + 상품/판매자 정보 */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-2 md:gap-4 mt-4">
          <div className="relative">
            <ImageCarousel images={images} />
            {data.posts.is_sold ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 z-10">
                <span className="text-2xl md:text-4xl font-bold text-white">판매완료</span>
              </div>
            ) : data.posts.is_reserved ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 z-10">
                <span className="rounded-lg bg-orange-500 px-4 py-2 text-lg font-bold text-white">
                  예약중
                </span>
              </div>
            ) : null}
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4 min-h-[450px]">
            {/* 상품 정보 */}
            <div>
              <h2 className="text-xl font-semibold mb-3">{t("productInfo")}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-gray-500 font-medium">{t("category")}</dt>
                <dd className="text-gray-700">· {data.category ? te(`productCategory.${data.category}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("condition")}</dt>
                <dd className="text-gray-700">· {data.condition ? te(`productCondition.${data.condition}`) : ""}</dd>
                <dt className="text-gray-500 font-medium">{t("price")}</dt>
                <dd className="text-orange-500">· ₱ {data.price?.toLocaleString()}</dd>
                <dt className="text-gray-500 font-medium">{t("tradeLocation")}</dt>
                <dd className="text-gray-700">· {data.location_type === "그 외 지역" ? te("tradeLocation.otherAreas") : data.location_type}</dd>
                {data.safe_payment !== null && (
                  <>
                    <dt className="text-gray-500 font-medium">{t("safePayment")}</dt>
                    <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                      · {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                    </dd>
                  </>
                )}
              </dl>
            </div>
            <hr className="border-gray-200" />
            {/* 판매자 정보 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t("sellerInfo")}</h2>
              <div className="flex items-center gap-3">
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
              </div>
              {!isOwner && (
                <Button variant="teal" className="cursor-pointer w-full" onClick={handleChat}>
                  {t("chat")}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 이미지 없을 때: 구인구직처럼 2열 나란히 */
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
                <dd className="text-orange-500">· ₱ {data.price?.toLocaleString()}</dd>
                <dt className="text-gray-500 font-medium">{t("tradeLocation")}</dt>
                <dd className="text-gray-700">· {data.location_type === "그 외 지역" ? te("tradeLocation.otherAreas") : data.location_type}</dd>
                {data.safe_payment !== null && (
                  <>
                    <dt className="text-gray-500 font-medium">{t("safePayment")}</dt>
                    <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                      · {data.safe_payment ? t("confirmed") : t("unconfirmed")}
                    </dd>
                  </>
                )}
              </dl>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t("sellerInfo")}</h2>
              <div className="flex items-center gap-3">
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
              </div>
              {!isOwner && (
                <Button variant="teal" className="cursor-pointer w-full" onClick={handleChat}>
                  {t("chat")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 제목 + 설명 카드 */}
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

      {/* 관련 매물 */}
      {relatedData && relatedData.length > 0 && (
        <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">{t("related")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedData.map((item) => {
              const itemImages = (item.images as string[]) ?? [];
              return (
                <Link key={item.id} href={`/usedgoods/${item.id}`} className="block">
                  <div className="relative w-full aspect-square overflow-hidden border rounded-xl">
                    <ImageWithFallback
                      src={itemImages[0] ?? "/fallback-image.svg"}
                      alt={item.posts?.title ?? ""}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium line-clamp-1 mt-1">{item.posts?.title}</p>
                  <p className="text-sm text-orange-500">₱ {item.price?.toLocaleString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
