import { supabase } from "@/lib/supabase";
import { RentalWithPost } from "@/type/rental/rental";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarrecel";
import AccommondationInfo from "./_components/AccommondationInfo";
import RentSellorInfo from "./_components/RentSellerInfo";
import PostInfo from "./_components/PostInfo";

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

  if (!data)
    return (
      <div className="p-8 text-center text-gray-500">
        게시글을 찾을 수 없습니다.
      </div>
    );
  if (error) throw new Error(error.message);

  const rental = data as RentalWithPost;
  const images = (rental.images as string[]) ?? [];

  return (
    <div>
      <BackButton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <ImageCarousel images={images} />

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <AccommondationInfo rental={rental} />
          <hr className="border-gray-200" />
          <RentSellorInfo rental={rental} />
        </div>
      </div>
      <PostInfo rental={rental} />
    </div>
  );
}
