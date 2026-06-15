"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Heart,
  Share2,
  Siren,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoveLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Tables } from "@/type/supabase";
import { formatTimeAgo } from "@/utils/formatTime";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/common/Toast";
import ReportModal from "@/components/common/ReportModal";
import { ROUTES } from "@/constants/routes";
import postChat from "@/services/chat/postChat";
import { useAuthStore } from "@/store/authStore";

type UsedGoods = Tables<"used_goods"> & {
  posts: Tables<"posts"> & {
    users: Tables<"users">;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(data.posts.like_count);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);

  const accession = data.posts.users.created_at
    ? new Date(data.posts.users.created_at)
    : null;

  const images = (data.images as string[]) ?? [];


  const handleLike = async () => {
    if (!userId) return;
    if (storeUser?.deleted_at) {
      alert("탈퇴 예정 계정은 찜하기를 이용할 수 없습니다.");
      return;
    }

    if (isLiked) {
      await supabase
        .from("common_likes")
        .delete()
        .eq("target_id", data.post_id)
        .eq("target_type", "post")
        .eq("user_id", userId);

      setLikeCount(likeCount - 1);
    } else {
      await supabase.from("common_likes").insert({
        target_id: data.post_id,
        target_type: "post",
        user_id: userId,
      });

      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setToastMessage(`URL이 복사되었습니다.\n${url}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleChat = async () => {
    if (!userId) return;

    const chatId = await postChat(userId, data.posts.users.id, data.post_id);

    router.push(ROUTES.chatRoom(chatId));
  };

  useEffect(() => {
    const channel = supabase
      .channel("like_count")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${data.post_id}`,
        },
        (payload) => {
          setLikeCount(payload.new.like_count);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <section>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex mx-2 my-4 gap-2"
          >
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
        {images.length > 0 && (
          <div className="m-2 border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image
                src={images[currentIndex]}
                alt={`${data.posts.title} — ${currentIndex + 1}번째 이미지`}
                fill
                className="object-cover"
              />
              <p className="absolute right-4 top-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-xl">
                {currentIndex + 1} / {images.length}
              </p>
              <button
                onClick={() =>
                  setCurrentIndex(
                    (currentIndex - 1 + images.length) % images.length,
                  )
                }
                aria-label="이전 이미지"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-4xl bg-white p-1.5"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((currentIndex + 1) % images.length)
                }
                aria-label="다음 이미지"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-4xl bg-white p-1.5"
              >
                <ChevronRight />
              </button>
            </div>
            <div className="flex gap-2 border-t-2 border-gray-400 p-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`${index + 1}번째 이미지로 이동`}
                  aria-pressed={currentIndex === index}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-xl"
                >
                  <Image
                    src={image}
                    alt={`썸네일 ${index + 1}`}
                    width={64}
                    height={64}
                    className={
                      currentIndex === index
                        ? "border-3 border-teal-400 rounded-xl overflow-hidden"
                        : "border-3 rounded-xl overflow-hidden"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
      <section className="border-gray-200 border-2 p-2 m-2 rounded-xl">
        <div className="border-b-2 p-2">
          <h2 className="text-2xl pb-4 font-semibold">상품 정보</h2>
          <dl className="p-2 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 font-medium text-gray-500 shrink-0">
                카테고리
              </dt>
              <dd>{data.category}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 font-medium text-gray-500 shrink-0">상태</dt>
              <dd>{data.condition}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 font-medium text-gray-500 shrink-0">가격</dt>
              <dd>{`₱ ${data.price?.toLocaleString()}`}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 font-medium text-gray-500 shrink-0">
                거래 장소
              </dt>
              <dd>{data.location_type}</dd>
            </div>
          </dl>
        </div>
        <div className="p-2">
          <h2 className="text-2xl pb-4 font-semibold">판매자 정보</h2>
          <div className="flex gap-2 pb-2">
            <Image
              src={data.posts.users.avatar_url ?? "/default-avatar.png"}
              alt="프로필 이미지"
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
            />
            <div className="">
              <p className="font-semibold">{data.posts.users.name}</p>
              <p>
                {accession
                  ? `${accession.getFullYear()}년 ${accession.getMonth() + 1}월 가입`
                  : `가입일 정보 없음`}
              </p>
            </div>
          </div>
          {data.safe_payment ? (
            <div className="border-2 border-teal-400 bg-teal-300 my-2 p-2 rounded-md">
              <p className="text-xl">안전 결제 확인</p>
              <p className="text-sm">안전하게 거래할 수 있는 판매자입니다.</p>
            </div>
          ) : (
            <div className="border-2 border-red-400 bg-red-300 my-2 p-2 rounded-md">
              <p className="text-xl">안전 결제 미확인</p>
              <p className="text-sm">안전 결제가 필요한 판매자입니다.</p>
            </div>
          )}
          {!isOwner && (
            <button
              onClick={handleChat}
              className="rounded-md bg-teal-500 text-white w-full p-2 mt-2"
            >
              채팅하기
            </button>
          )}
        </div>
      </section>
      <section className="border-gray-200 border-2 p-2 m-2 rounded-xl">
        <div className="p-2">
          <div className="flex">
            <h1 className="text-3xl font-semibold">{data.posts.title}</h1>
            <p className="self-center">
              {data.safe_payment ? (
                <BadgeCheck className="text-teal-400" />
              ) : null}
            </p>
          </div>
          <div className="my-4 space-x-2">
            <button
              onClick={handleLike}
              aria-label={isLiked ? "좋아요 취소" : "좋아요"}
              aria-pressed={isLiked}
              className="border-2 p-1.5 rounded-lg"
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? "fill-red-400 text-red-400" : "text-gray-400"}`}
              />
            </button>
            <button
              onClick={handleShare}
              aria-label="공유하기"
              className="border-2 p-1.5 rounded-lg text-gray-400"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Toast message={toastMessage} showMessage={showToast} />
            <button
              onClick={() => setShowReportModal(true)}
              aria-label="신고하기"
              className="border-2 p-1.5 rounded-lg"
            >
              <Siren className="w-4 h-4 text-red-400" />
            </button>
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              postId={data.post_id}
              userId={userId}
              initialReported={initialReported}
            />
          </div>
          <div className="border-b-2 flex space-x-2 pb-4 text-gray-400">
            <p className="flex gap-2">
              <Clock className="w-4 h-4 self-center" />
              <time dateTime={data.posts.created_at}>
                {formatTimeAgo(data.posts.created_at)}
              </time>
            </p>
            <p className="flex gap-2">
              <Eye className="w-4 h-4 self-center" /> {data.posts.view_count}
            </p>
            <p className="flex gap-2">
              <Heart className="w-4 h-4 self-center" /> {likeCount}
            </p>
          </div>
          <h2 className="text-2xl py-4 font-medium">상품 설명</h2>
          <p className="mt-4">{data.content}</p>
        </div>
      </section>
      <section className="border-gray-200 border-2 m-2 p-2 rounded-xl">
        <div className="p-2">
          <h2 className="text-2xl pb-4 font-semibold">관련 매물</h2>
          <div className="grid grid-cols-4 gap-2">
            {relatedData?.map((item) => {
              const itemImages = (item.images as string[]) ?? [];
              return (
                <Link
                  key={item.id}
                  href={`/usedgoods/${item.id}`}
                  className="block"
                >
                  <div className="relative w-full aspect-square overflow-hidden border-2 rounded-xl">
                    <ImageWithFallback
                      src={itemImages[0] ?? "/fallback-image.svg"}
                      alt={`${item.posts?.title} 상품 이미지`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-lg font-medium line-clamp-1">
                    {item.posts?.title}
                  </p>
                  <p>{`₱ ${item.price?.toLocaleString()}`}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
