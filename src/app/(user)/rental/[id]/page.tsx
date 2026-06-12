import { getRentalDetail } from "@/services/rental/rental";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import AccommondationInfo from "./_components/AccommondationInfo";
import RentSellerInfo from "./_components/RentSellerInfo";
import PostInfo from "./_components/PostInfo";

export default async function RentalDetail({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  let rental;
  try {
    rental = await getRentalDetail(id);
  } catch {
    return (
      <div className="p-8 text-center text-gray-500">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const images = (rental.images as string[]) ?? [];

  return (
    <>
      <BackButton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-4">
        <ImageCarousel images={images} />

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
          <AccommondationInfo rental={rental} />
          <hr className="border-gray-200" />
          <RentSellerInfo rental={rental} />
        </div>
      </div>
      <PostInfo rental={rental} />
    </>
  );
}
