"use client";

import Link from "next/link";
import { BadgeCheck, Heart, Clock, Eye, MoveLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tables } from "@/type/supabase";
import { formatTimeAgo } from "@/utils/formatTime";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import postChat from "@/services/chat/postChat";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
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
  const router = useRouter();
  const { user: storeUser } = useAuthStore();
  const isOwner = storeUser?.auth_id === data.posts.users?.auth_id;
  const images = (data.images as string[]) ?? [];
  const [likeCount, setLikeCount] = useState(data.posts.like_count ?? 0);

  const accession = data.posts.users?.created_at
    ? new Date(data.posts.users.created_at)
    : null;

  const handleChat = async () => {
    if (!userId || !data.posts.users) return;
    const chatId = await postChat(userId, data.posts.users.id, data.post_id);
    useChatStore.getState().openWidget(chatId);
  };

  return (
    <div className="page-container pb-12">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={() => router.push("/usedgoods")} className="flex gap-2 cursor-pointer">
          <MoveLeft />
          목록으로
        </button>
        <VerifyAuthor
          authorAuthId={data.posts.users?.auth_id}
          editPath={`/usedgoods/${data.post_id}/edit`}
          postId={data.post_id}
          redirectPath="/usedgoods"
        />
      </div>

      {/* 이미지 + 상품/판매자 정보 그리드 */}
      <div className={`grid grid-cols-1 ${images.length > 0 ? "md:grid-cols-2" : ""} items-stretch gap-2 md:gap-4 mt-4`}>
        {images.length > 0 && <ImageCarousel images={images} />}

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4 min-h-[450px]">
          {/* 상품 정보 */}
          <div>
            <h2 className="text-xl font-semibold mb-3">상품 정보</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-gray-500 font-medium">카테고리</dt>
              <dd className="text-gray-700">· {data.category}</dd>
              <dt className="text-gray-500 font-medium">상태</dt>
              <dd className="text-gray-700">· {data.condition}</dd>
              <dt className="text-gray-500 font-medium">가격</dt>
              <dd className="text-orange-500">· ₱ {data.price?.toLocaleString()}</dd>
              <dt className="text-gray-500 font-medium">거래 장소</dt>
              <dd className="text-gray-700">· {data.location_type}</dd>
              {data.safe_payment !== null && (
                <>
                  <dt className="text-gray-500 font-medium">안전 결제</dt>
                  <dd className={data.safe_payment ? "text-teal-600" : "text-red-500"}>
                    · {data.safe_payment ? "확인" : "미확인"}
                  </dd>
                </>
              )}
            </dl>
          </div>

          <hr className="border-gray-200" />

          {/* 판매자 정보 */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">판매자 정보</h2>
            <div className="flex items-center gap-3">
              {data.posts.users?.avatar_url ? (
                <ImageWithFallback
                  src={data.posts.users.avatar_url}
                  alt="프로필"
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
                    ? `${accession.getFullYear()}년 ${accession.getMonth() + 1}월 가입`
                    : "가입일 정보 없음"}
                </p>
              </div>
            </div>
            {!isOwner && (
              <Button variant="teal" className="cursor-pointer w-full" onClick={handleChat}>
                채팅하기
              </Button>
            )}
          </div>
        </div>
      </div>

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
            onLikeChange={(liked) => setLikeCount((prev) => liked ? prev + 1 : prev - 1)}
            size="lg"
            className="hidden md:flex shrink-0"
          />
        </div>

        <div className="text-gray-400 text-sm flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <time dateTime={data.posts.created_at}>{formatTimeAgo(data.posts.created_at)}</time>
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
            onLikeChange={(liked) => setLikeCount((prev) => liked ? prev + 1 : prev - 1)}
            size="sm"
            className="md:hidden ml-auto"
          />
        </div>

        <hr className="border-gray-200 my-4" />

        <h2 className="text-xl font-semibold mb-3">상품 설명</h2>
        <p className="text-gray-700 whitespace-pre-line">{data.content}</p>
      </div>

      {/* 관련 매물 */}
      {relatedData && relatedData.length > 0 && (
        <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">관련 매물</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedData.map((item) => {
              const itemImages = (item.images as string[]) ?? [];
              return (
                <Link key={item.id} href={`/usedgoods/${item.id}`} className="block">
                  <div className="relative w-full aspect-square overflow-hidden border rounded-xl">
                    <ImageWithFallback
                      src={itemImages[0] ?? "/fallback-image.svg"}
                      alt={`${item.posts?.title} 상품 이미지`}
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
