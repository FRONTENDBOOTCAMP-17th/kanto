"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MainTaskSectionProps {
  mainTask: string;
  setMainTask: (v: string) => void;
}

export function MainTaskSection({ mainTask, setMainTask }: MainTaskSectionProps) {
  const t = useTranslations("Job");

  return (
    <div className="space-y-2">
      <Label htmlFor="mainTask">{t("form.mainTaskLabel")}</Label>
      <Textarea
        id="mainTask"
        placeholder={t("form.mainTaskPlaceholder")}
        value={mainTask}
        onChange={(e) => setMainTask(e.target.value.slice(0, 5000))}
        className="resize-none min-h-68 rounded-sm p-5 text-xs md:text-sm"
        maxLength={5000}
      />
      {mainTask.length > 0 && mainTask.trim().length < 10 && (
        <p className="text-[13px] text-red-500">{t("form.mainTaskMinLength")}</p>
      )}
      <p className="text-right text-xs text-gray-400">{mainTask.length}/5000</p>
    </div>
  );
}
