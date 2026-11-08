"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeadlineSectionProps {
  deadline: string;
  setDeadline: (v: string) => void;
}

export function DeadlineSection({ deadline, setDeadline }: DeadlineSectionProps) {
  const t = useTranslations("Job");

  return (
    <div className="space-y-2">
      <Label htmlFor="deadline">{t("form.deadlineLabel")}</Label>
      <Input
        id="deadline"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="h-12 rounded-sm"
      />
    </div>
  );
}
