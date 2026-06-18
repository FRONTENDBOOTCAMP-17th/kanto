"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { createReviewAction } from "./paymentActions";

interface Props {
  transactionId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({
  transactionId,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating < 1) {
      setError("별점을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createReviewAction({ transactionId, rating, content: content.trim() });
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "후기 작성에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            거래 후기 작성
          </h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">별점</p>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              aria-label={`별점 ${i}점`}
              className="cursor-pointer"
            >
              <Star
                className={`w-7 h-7 ${
                  i <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200 fill-gray-200"
                }`}
              />
            </button>
          ))}
        </div>

        <label htmlFor="review-content" className="mt-4 block text-sm text-gray-500">
          후기 내용 (선택)
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="거래는 어떠셨나요?"
          className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-base md:text-sm outline-none focus:border-teal-400"
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-4 w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "작성 중..." : "후기 등록하기"}
        </button>
      </div>
    </div>
  );
}
