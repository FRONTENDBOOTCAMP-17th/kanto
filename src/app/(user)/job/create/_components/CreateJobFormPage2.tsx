"use client";

import type { ReactNode } from "react";

interface CreateJobFormPageTwoProps {
  children: ReactNode;
  handleSubmit: () => void;
}

export function CreateJobFormPageTwo({
  children,
  handleSubmit,
}: CreateJobFormPageTwoProps) {
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {children}
    </form>
  );
}
