import {
  Siren,
  Heart,
  Share2,
  Clock,
  Eye,
  User,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { RentalWithPost } from "@/type/rental/rental";
import { formatSellerInfoCreatedAt, formatTimeAgo } from "@/utils/formatTime";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarrecel";
import AccommondationInfo from "./_components/AccommondationInfo";

export default async function RentalDetail({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("rentals")
    .select("*, posts(*, users(*))")
    .eq("post_id", id)
    .single();

  if (!data) return <div className="p-8 text-center text-gray-500">게시글을 찾을 수 없습니다.</div>;
  if (error) throw new Error(error.message);

  const rental = data as RentalWithPost;
  const images = (rental.images as string[]) ?? [];

  return (
    <div>
      <BackButton />

      {/* 상단 2컬럼: 이미지 | 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <ImageCarousel images={images} />

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <AccommondationInfo rental={rental} />

          <hr className="border-gray-200" />

          <h2 className="text-xl font-semibold">집주인 정보</h2>
          <div className="flex items-center gap-3">
            {rental.posts.users.avatar_url ? (
              <Image
                src={rental.posts.users.avatar_url}
                alt="프로필"
                width={48}
                height={48}
                className="rounded-full object-cover w-12 h-12"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold">{rental.posts.users.name}</p>
              <p className="text-sm text-gray-500">
                {formatSellerInfoCreatedAt(rental.posts.users.created_at)}
              </p>
            </div>
          </div>

          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-medium cursor-pointer transition-colors">
            문의하기
          </button>
        </div>
      </div>

      {/* 하단: 제목 · 버튼 · 설명 */}
      <div className="mt-6">
        <h1 className="text-2xl font-semibold">{rental.posts.title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {rental.room_type} · {rental.location_detail ?? rental.location}
        </p>

        <div className="flex gap-2 mt-4">
          <Button
            size="lg"
            className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
          >
            <Heart className="text-black" />
          </Button>
          <Button
            size="lg"
            className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
          >
            <Share2 className="text-black" />
          </Button>
          <Button
            size="lg"
            className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
          >
            <Siren className="text-black" />
          </Button>
        </div>

        <div className="text-gray-400 text-sm flex gap-4 mt-3">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTimeAgo(rental.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            조회수 : {rental.posts.view_count}
          </span>
        </div>

        <hr className="border-gray-200 my-4" />

        <h2 className="text-xl font-semibold mb-3">숙소 설명</h2>
        <p className="text-gray-700 whitespace-pre-line">{rental.description}</p>
      </div>
    </div>
  );
}
