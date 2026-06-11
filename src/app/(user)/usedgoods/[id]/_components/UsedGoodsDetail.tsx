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
import { useState } from "react";
import type { Json } from "@/type/supabase";

interface UsedGoods {
  id: number;
  content: string;
  category: string;
  images: Json | null;
  condition: "미개봉" | "가벼운 사용감" | "사용감 있음";
  location_custom: string | null;
  location_type: string;
  post_id: number;
  price: number;
  safe_payment: boolean;
  posts: {
    id: number;
    title: string;
    user_id: number;
    like_count: number;
    view_count: number;
    status: string;
    post_type: string;
    created_at: Date;
    updated_at: Date;
    users: {
      id: string;
      name: string;
      avatar_url: string;
      created_at: string;
    };
  };
}

export default function UsedGoodsDetail({ data }: { data: UsedGoods }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const accession = new Date(data.posts.users.created_at);

  const now = new Date();
  const postCreated = new Date(data.posts.created_at);
  const diff = now.getTime() - postCreated.getTime();
  const time = Math.floor(diff / 1000 / 60);

  const images = (data.images as string[] | null) ?? [];

  function Time(time: number) {
    if (time < 60) {
      return `${time}분 전`;
    } else if (time < 1440) {
      return `${Math.floor(time / 60)}시간 전`;
    } else {
      return `${Math.floor(time / 1440)}일 전`;
    }
  }

  return (
    <div>
      <section>
        <button
          onClick={() => router.push("/usedgoods")}
          className="flex mx-2 my-4 gap-2"
        >
          <MoveLeft />
          목록으로
        </button>
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
            <p>· {data.price}</p>
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
                {data.posts.users.created_at
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
            onClick={() => router.push("/chat")}
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
            <button className="border-2 p-1.5 rounded-lg">
              <Heart className="w-4 h-4 text-pink-400" />
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
              <Clock className="w-4 h-4 self-center " /> {Time(time)}
            </p>
            <p className="flex gap-2">
              <Eye className="w-4 h-4 self-center" /> {data.posts.view_count}
            </p>
            <p className="flex gap-2">
              <Heart className="w-4 h-4 self-center" /> {data.posts.like_count}
            </p>
          </div>
          <h1 className="text-2xl py-4 font-medium">상품 설명</h1>
          <p className="mt-4">{data.content}</p>
        </div>
      </section>
    </div>
  );
}
