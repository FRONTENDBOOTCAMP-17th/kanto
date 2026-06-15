"use client";

import { Star } from "lucide-react";

export function ProfileReviewsSection() {
  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <h2 className="text-lg font-semibold text-gray-900">거래 후기</h2>
        </div>
        <div className="flex items-center gap-3 mb-5" aria-label="평점 0.0점 (0건)">
          <span className="text-3xl font-bold text-gray-900" aria-hidden="true">0.0</span>
          <div className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 text-gray-200 fill-gray-200" />
            ))}
          </div>
          <span className="text-sm text-gray-400" aria-hidden="true">(0건)</span>
        </div>
        <div className="flex flex-col items-center py-12 gap-2">
          <Star className="w-8 h-8 text-gray-200 fill-gray-200" />
          <p className="text-sm text-gray-400">아직 받은 후기가 없습니다</p>
        </div>
      </div>
    </div>
  );
}
