import { RentalWithPost } from "@/type/rental/rental";
import Image from "next/image";
import { formatSellerInfoCreatedAt } from "@/utils/formatTime";
import { User } from "lucide-react";

export default function RentSellorInfo({ rental }: { rental: RentalWithPost }) {
  return (
    <>
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
    </>
  );
}
