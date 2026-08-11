"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface CreateJobFormPageOneProps {
  children: ReactNode;
  handleNextStep: () => void;
}

export function CreateJobFormPageOne({
  children,
  handleNextStep,
}: CreateJobFormPageOneProps) {
  const t = useTranslations("Job");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleNextStep();
      }}
    >
      <div>
        <h2 className="font-semibold text-xl text-gray-900">
          {t("form.jobInfo")}
        </h2>
      </div>

      {children}
    </form>
  );
}
