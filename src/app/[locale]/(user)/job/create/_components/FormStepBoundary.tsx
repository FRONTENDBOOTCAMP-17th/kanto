"use client";

import type { ReactNode } from "react";

interface FormStepBoundaryProps {
  children: ReactNode;
  onSubmit: () => void;
  heading?: string;
  className?: string;
}

export function FormStepBoundary({
  children,
  onSubmit,
  heading,
  className,
}: FormStepBoundaryProps) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {heading && (
        <div>
          <h2 className="font-semibold text-xl text-gray-900">{heading}</h2>
        </div>
      )}
      {children}
    </form>
  );
}
