"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import ReviewModal from "./ReviewModal";

interface Props {
  transactionId: number;
  onReviewed: () => void;
}

export default function ReviewBanner({ transactionId, onReviewed }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white border-t border-gray-100 px-4 py-2 md:px-3 shrink-0">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 py-2 text-sm md:text-xs font-medium text-yellow-700 hover:bg-yellow-100 transition-colors cursor-pointer"
        >
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          거래가 완료됐어요 · 상대방에게 후기를 남겨보세요
        </button>
      </div>
      {isModalOpen && (
        <ReviewModal
          transactionId={transactionId}
          onClose={() => setIsModalOpen(false)}
          onSubmitted={onReviewed}
        />
      )}
    </>
  );
}
