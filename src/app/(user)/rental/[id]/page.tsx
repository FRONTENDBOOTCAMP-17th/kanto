import { Siren, Heart, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { RentalWithPost } from "@/type/rental/rental";
import { formatSellerInfoCreatedAt, formatTimeAgo } from "@/utils/formatTime";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarrecel";

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

  if (!data) {
    return <div>게시글을 찾을 수 없습니다.</div>;
  }

  if (error) {
    throw new Error(error.message);
  }

  const rental = data as RentalWithPost;

  const images = (rental.images as string[]) ?? [];

  return (
    <>
      <BackButton />
      <section>
        <ImageCarousel images={images} />
      </section>
      <section>
        <h2>숙소 정보</h2>
        <div>어메니티</div>
        <div>
          <ul>
            <li>
              <span>보증금</span>
              <span>·</span>
              <span>{rental.deposit}</span>
            </li>
            <li>
              <span>월세</span>
              <span>·</span>
              <span>{rental.price}</span>
            </li>
            <li>
              <span>방 타입</span>
              <span>·</span>
              <span>{rental.rent_type}</span>
            </li>
            <li>
              <span>최대 인원</span>
              <span>·</span>
              <span>{rental.max_occupants}명</span>
            </li>
            <li>
              <span>위치</span>
              <span>·</span>
              <span>{rental.location}</span>
            </li>
          </ul>
        </div>
      </section>
      <section>
        <h2>집주인 정보</h2>
        <div className="flex items-center">
          <span>이미지</span>
          <div>
            <span>{rental.posts.users.name}</span>
            <span>
              {formatSellerInfoCreatedAt(rental.posts.users.created_at)}
            </span>
          </div>
        </div>
      </section>
      <section>
        <h1>{rental.posts.title}</h1>
        <div>
          <span>{rental.room_type}</span>
          <span>{rental.location_detail ?? rental.location}</span>
        </div>
        <div className="flex gap-2">
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
        <div className="text-gray-400 text-sm flex gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTimeAgo(rental.created_at)}
          </span>
          <span>조회수 : {rental.posts.view_count}</span>
        </div>
      </section>
      <section>
        <h2>숙소 설명</h2>
        <p>{rental.description}</p>
      </section>
    </>
  );
}
