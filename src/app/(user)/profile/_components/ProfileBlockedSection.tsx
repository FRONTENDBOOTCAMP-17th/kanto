"use client";

import { UserX } from "lucide-react";

export function ProfileBlockedSection() {
  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <UserX className="w-4 h-4 text-gray-500" />
          <p className="text-lg font-semibold text-gray-900">차단한 사용자</p>
        </div>
        <div className="flex flex-col items-center py-12 gap-2">
          <UserX className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">차단한 사용자가 없습니다</p>
        </div>
      </div>
    </div>
  );
}
