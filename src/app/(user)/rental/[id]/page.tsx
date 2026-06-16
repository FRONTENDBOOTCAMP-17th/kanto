import { getRentalDetail } from "@/services/rental/rental";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import AccommondationInfo from "./_components/AccommondationInfo";
import RentSellerInfo from "./_components/RentSellerInfo";
import PostInfo from "./_components/PostInfo";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import { viewCountUp } from "@/services/view";

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
  await viewCountUp(rental.post_id ?? 0);

  const postId = rental.post_id ?? 0;
  const { userId, initialLiked, initialReported } = await getUserLikeReportStatus(postId);

  return (
    <div className="page-container pb-12">
      <div className="flex items-center justify-between">
        <BackButton />
        <VerifyAuthor
          authorAuthId={rental.posts.users.auth_id}
          editPath={`/rental/${id}/edit`}
          postId={postId}
          redirectPath="/rental"
        />
      </div>
      <div
        className={`grid grid-cols-1 ${images.length > 0 ? "md:grid-cols-2" : ""} items-stretch gap-2 md:gap-4 mt-4`}
      >
        {images.length > 0 && <ImageCarousel images={images} />}

        <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4 min-h-[450px]">
          <AccommondationInfo rental={rental} />
          <hr className="border-gray-200" />
          <RentSellerInfo rental={rental} />
        </div>
      </div>
      <PostInfo
        rental={rental}
        userId={userId}
        postId={postId}
        initialLiked={initialLiked}
        initialReported={initialReported}
      />
    </div>
  );
}
