"use client";

import Image from "next/image";
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
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Tables } from "@/type/supabase";
import { formatTimeAgo } from "@/utils/formatTime";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { User } from "@supabase/supabase-js";
import EditButton from "@/components/common/EditButton";
import DeleteButton from "@/components/common/DeleteButton";
import { supabase } from "@/lib/supabase";

type UsedGoods = Tables<"used_goods"> & {
  posts: Tables<"posts"> & {
    users: Tables<"users">;
  };
};

export default function UsedGoodsDetail({
  data,
  relatedData,
  user,
  initialLiked,
  userId,
}: {
  data: UsedGoods;
  relatedData: UsedGoods[] | null;
  user: User | null;
  initialLiked: boolean;
  userId: number | undefined;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(data.posts.like_count);

  const accession = data.posts.users.created_at
    ? new Date(data.posts.users.created_at)
    : null;

  const images = (data.images as string[]) ?? [];

  const isOwner = user?.id === data.posts.users?.auth_id;

  const handleLike = async () => {
    if (!userId) return;

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
        <Header />
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/usedgoods")}
            className="flex mx-2 my-4 gap-2"
          >
            <MoveLeft />
            목록으로
          </button>
          {isOwner && (
            <div className="flex gap-2 mr-2">
              <EditButton id={data.post_id} />
              <DeleteButton postId={data.post_id} />
            </div>
          )}
        </div>
        {images.length > 0 && (
          <div className="m-2 border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image
                src={images[currentIndex]}
                alt="대표 이미지"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-4xl bg-white p-1.5"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((currentIndex + 1) % images.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-4xl bg-white p-1.5"
              >
                <ChevronRight />
              </button>
            </div>
            <div className="flex gap-2 border-t-2 border-gray-400 p-2">
              {images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`썸네일 ${index + 1}`}
                  width={64}
                  height={64}
                  onClick={() => setCurrentIndex(index)}
                  className={
                    currentIndex === index
                      ? "border-3 border-teal-400 rounded-xl overflow-hidden"
                      : "border-3 rounded-xl overflow-hidden"
                  }
                />
              ))}
            </div>
          </div>
        )}
      </section>
      <section className="border-gray-200 border-2 p-2 m-2 rounded-xl">
        <div className="border-b-2 p-2">
          <h1 className="text-2xl pb-4 font-semibold">상품 정보</h1>
          <div className="grid grid-cols-2 p-2 gap-y-2">
            <p className="font-medium text-gray-500">카테고리</p>{" "}
            <p>· {data.category}</p>
            <p className="font-medium text-gray-500">상태</p>{" "}
            <p>· {data.condition}</p>
            <p className="font-medium text-gray-500">가격</p>{" "}
            <p>· {`₱ ${data.price?.toLocaleString()}`}</p>
            <p className="font-medium text-gray-500">거래 장소</p>{" "}
            <p>· {data.location_type}</p>
          </div>
        </div>
        <div className="p-2">
          <h1 className="text-2xl pb-4 font-semibold">판매자 정보</h1>
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
          <button
            onClick={() => router.push("/chats")}
            className="rounded-md bg-teal-500 text-white w-full p-2 mt-2"
          >
            채팅하기
          </button>
        </div>
      </section>
      <section className="border-gray-200 border-2 p-2 m-2 rounded-xl">
        <div className="p-2">
          <div className="flex">
            <p className="text-3xl font-semibold">{data.posts.title}</p>
            <p className="self-center">
              {data.safe_payment ? (
                <BadgeCheck className="text-teal-400" />
              ) : null}
            </p>
          </div>
          <div className="my-4 space-x-2">
            <button onClick={handleLike} className="border-2 p-1.5 rounded-lg">
              <Heart
                className={`w-4 h-4 ${isLiked ? "fill-red-400 text-red-400" : "text-gray-400"}`}
              />
            </button>
            <button className="border-2 p-1.5 rounded-lg">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="border-2 p-1.5 rounded-lg">
              <Siren className="w-4 h-4 text-red-400" />
            </button>
          </div>
          <div className="border-b-2 flex space-x-2 pb-4 text-gray-400">
            <p className="flex gap-2">
              <Clock className="w-4 h-4 self-center" />
              {formatTimeAgo(data.posts.created_at)}
            </p>
            <p className="flex gap-2">
              <Eye className="w-4 h-4 self-center" /> {data.posts.view_count}
            </p>
            <p className="flex gap-2">
              <Heart className="w-4 h-4 self-center" /> {likeCount}
            </p>
          </div>
          <h1 className="text-2xl py-4 font-medium">상품 설명</h1>
          <p className="mt-4">{data.content}</p>
        </div>
      </section>
      <section className="border-gray-200 border-2 m-2 p-2 rounded-xl">
        <div className="p-2">
          <h1 className="text-2xl pb-4 font-semibold">관련 매물</h1>
          <div className="grid grid-cols-4 gap-2">
            {relatedData?.map((item) => {
              const itemImages = (item.images as string[]) ?? [];
              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/usedgoods/${item.id}`)}
                  className="cursor-pointer"
                >
                  <div className="relative w-full aspect-square overflow-hidden border-2 rounded-xl">
                    <ImageWithFallback
                      src={itemImages[0] ?? "/fallback-image.svg"}
                      alt="대표 이미지"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-lg font-medium line-clamp-1">
                    {item.posts?.title}
                  </p>
                  <p>{`₱ ${item.price?.toLocaleString()}`}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
