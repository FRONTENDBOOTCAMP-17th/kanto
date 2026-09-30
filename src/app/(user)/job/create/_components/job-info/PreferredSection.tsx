"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { JobPreferredModal } from "./JobPreferredModal";

interface PreferredSectionProps {
  preferred: string;
  setPreferred: (v: string) => void;
  preferredTags: string[];
  setPreferredTags: (v: string[]) => void;
}

export function PreferredSection({
  preferred,
  setPreferred,
  preferredTags,
  setPreferredTags,
}: PreferredSectionProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  const toggleTag = (key: string) =>
    setPreferredTags(
      preferredTags.includes(key)
        ? preferredTags.filter((tag) => tag !== key)
        : [...preferredTags, key],
    );

  return (
    <div className="space-y-2">
      <Label>{t("form.preferredLabel")}</Label>
      <button
        type="button"
        onClick={() => setShowPreferredModal(true)}
        className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-teal-400 py-2.5 text-sm font-medium text-teal-600 transition-colors hover:border-teal-500 hover:bg-teal-50"
      >
        <Plus className="h-4 w-4" />
        {preferredTags.length > 0
          ? `${preferredTags.length}${t("form.selectedCount")}`
          : t("form.preferredSelect")}
      </button>

      {preferredTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {preferredTags.map((key) => (
            <span
              key={key}
              className="flex items-center gap-1 rounded-full bg-teal-50 py-1 pl-3 pr-2 text-sm text-teal-700"
            >
              {te(`preferredItem.${key}`) ?? key}
              <button
                type="button"
                onClick={() => toggleTag(key)}
                aria-label={tc("delete")}
                className="transition-colors hover:text-teal-900 flex justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        placeholder={t("form.preferredPlaceholder")}
        value={preferred}
        onChange={(e) => setPreferred(e.target.value)}
        className="h-12 rounded-sm"
      />

      <JobPreferredModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        selected={preferredTags}
        onToggle={toggleTag}
      />
    </div>
  );
}
