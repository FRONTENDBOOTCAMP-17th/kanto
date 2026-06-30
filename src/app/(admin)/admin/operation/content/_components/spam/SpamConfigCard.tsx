"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import type { SpamConfig } from "@/services/admin/adminContent";

const DEFAULT_SPAM_CONFIG: SpamConfig = {
  chat_window_sec: 3,
  chat_max_count: 5,
  chat_cooldown_sec: 10,
  max_urls_per_post: 3,
  profanity_strike_max: 3,
  report_strike_max: 5,
  auto_sanction_enabled: false,
  updated_at: "",
};

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
          className="w-24 rounded-xl border border-[#ebeef0] px-3 py-2 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        {suffix && <span className="text-[13px] text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

export default function SpamConfigCard() {
  const queryClient = useQueryClient();

  const { data: savedConfig, isLoading } = useQuery<SpamConfig>({
    queryKey: ["spam-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/spam-config");
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (config: SpamConfig) => {
      const res = await fetch("/api/admin/spam-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json() as Promise<SpamConfig>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["spam-config"], data);
      setDraft(null);
      setSpamSaved(true);
    },
  });

  
  const [draft, setDraft] = useState<SpamConfig | null>(null);
  const [spamSaved, setSpamSaved] = useState(false);

  const config = draft ?? savedConfig ?? DEFAULT_SPAM_CONFIG;

  function setField<K extends keyof SpamConfig>(key: K, val: SpamConfig[K]) {
    setSpamSaved(false);
    setDraft((prev) => ({ ...(prev ?? config), [key]: val }));
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="mb-5 text-[15px] font-semibold text-slate-800">감지 민감도 설정</p>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
          <span className="text-[14px]">불러오는 중...</span>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              채팅 도배 감지
            </p>
            <div className="flex flex-wrap gap-6">
              <NumberField
                label="감지 윈도우"
                value={config.chat_window_sec}
                onChange={(v) => setField("chat_window_sec", v)}
                suffix="초 내에"
              />
              <NumberField
                label="최대 전송 수"
                value={config.chat_max_count}
                onChange={(v) => setField("chat_max_count", v)}
                suffix="번 이상 시"
              />
              <NumberField
                label="쿨다운"
                value={config.chat_cooldown_sec}
                onChange={(v) => setField("chat_cooldown_sec", v)}
                suffix="초 차단"
              />
            </div>
          </div>

          <div className="my-5 border-t border-[#ebeef0]" />

          <div className="mb-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              게시글 제한
            </p>
            <NumberField
              label="포스트당 최대 URL 수"
              value={config.max_urls_per_post}
              onChange={(v) => setField("max_urls_per_post", v)}
              suffix="개 초과 시 차단"
            />
          </div>

          <div className="my-5 border-t border-[#ebeef0]" />

          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              자동 제재 기준
            </p>
            <div className="mb-5 flex flex-wrap gap-6">
              <NumberField
                label="금칙어 위반 누적"
                value={config.profanity_strike_max}
                onChange={(v) => setField("profanity_strike_max", v)}
                suffix="회 초과 시 제재"
              />
              <NumberField
                label="신고 누적"
                value={config.report_strike_max}
                onChange={(v) => setField("report_strike_max", v)}
                suffix="회 초과 시 제재"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#ebeef0] bg-slate-50 px-4 py-3.5">
              <div>
                <p className="text-[14px] font-medium text-slate-800">자동 제재 활성화</p>
                <p className="mt-0.5 text-[12.5px] text-slate-400">
                  기준 초과 시 자동으로 계정을 7일 정지합니다.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.auto_sanction_enabled}
                onClick={() => setField("auto_sanction_enabled", !config.auto_sanction_enabled)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  config.auto_sanction_enabled ? "bg-teal-500" : "bg-slate-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    config.auto_sanction_enabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            {spamSaved && (
              <span className="flex items-center gap-1 text-[13px] text-teal-600">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                저장되었습니다
              </span>
            )}
            <button
              onClick={() => saveMutation.mutate(config)}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
            >
              {saveMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
              )}
              저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}
