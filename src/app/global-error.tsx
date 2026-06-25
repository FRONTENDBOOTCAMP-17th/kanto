"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-xl font-bold text-slate-900">오류가 발생했습니다</h2>
          <button
            onClick={reset}
            className="rounded-lg bg-teal-500 px-5 py-2 font-semibold text-white hover:bg-teal-600"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
