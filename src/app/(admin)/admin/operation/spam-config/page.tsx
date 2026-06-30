"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Zap, Pencil, Check, X } from "lucide-react";

type SpamConfig = {
  chatWindowSec: number;
  chatMaxCount: number;
  chatCooldownSec: number;
  maxUrlsPerPost: number;
  profanityStrikeMax: number;
  reportStrikeMax: number;
  autoSanctionEnabled: boolean;
};

type Trigger = "profanity" | "spam" | "report";

type Template = {
  id: number;
  trigger: Trigger;
  title: string;
  body: string;
};

const TRIGGER_LABELS: Record<Trigger, string> = {
  profanity: "금칙어 위반",
  spam: "스팸 감지",
  report: "신고 누적",
};

const INITIAL_CONFIG: SpamConfig = {
  chatWindowSec: 3,
  chatMaxCount: 5,
  chatCooldownSec: 10,
  maxUrlsPerPost: 3,
  profanityStrikeMax: 3,
  reportStrikeMax: 5,
  autoSanctionEnabled: false,
};

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 1,
    trigger: "profanity",
    title: "금칙어 위반 경고",
    body: "금칙어가 포함된 내용을 작성하여 일시적으로 서비스 이용이 제한되었습니다.",
  },
  {
    id: 2,
    trigger: "spam",
    title: "스팸 행위 경고",
    body: "과도한 메시지 전송으로 일시적으로 채팅 기능이 제한되었습니다.",
  },
  {
    id: 3,
    trigger: "report",
    title: "신고 누적 제재",
    body: "다수의 신고가 접수되어 서비스 이용이 제한되었습니다.",
  },
];

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
};

function NumberField({ label, value, onChange, suffix, min = 1 }: NumberFieldProps) {
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

export default function SpamConfigPage() {
  const [config, setConfig] = useState<SpamConfig>(INITIAL_CONFIG);
  const [saved, setSaved] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  function setField<K extends keyof SpamConfig>(key: K, val: SpamConfig[K]) {
    setSaved(false);
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    setSaved(true);
  }

  function openTemplateEdit(t: Template) {
    setEditingTemplateId(t.id);
    setEditTitle(t.title);
    setEditBody(t.body);
  }

  function handleTemplateSave(id: number) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: editTitle, body: editBody } : t)),
    );
    setEditingTemplateId(null);
  }

  function handleTemplateCancel() {
    setEditingTemplateId(null);
  }

  return (
    <div className="p-6 lg:p-8">
      
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          운영 관리
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <Zap className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">스팸 감지 설정</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          채팅 도배·URL 제한·자동 제재 민감도와 제재 알림 템플릿을 관리합니다.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        
        <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="mb-5 text-[15px] font-semibold text-slate-800">감지 민감도 설정</p>

          
          <div className="mb-5">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              채팅 도배 감지
            </p>
            <div className="flex flex-wrap gap-6">
              <NumberField
                label="감지 윈도우"
                value={config.chatWindowSec}
                onChange={(v) => setField("chatWindowSec", v)}
                suffix="초 내에"
              />
              <NumberField
                label="최대 전송 수"
                value={config.chatMaxCount}
                onChange={(v) => setField("chatMaxCount", v)}
                suffix="번 이상 시"
              />
              <NumberField
                label="쿨다운"
                value={config.chatCooldownSec}
                onChange={(v) => setField("chatCooldownSec", v)}
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
              value={config.maxUrlsPerPost}
              onChange={(v) => setField("maxUrlsPerPost", v)}
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
                value={config.profanityStrikeMax}
                onChange={(v) => setField("profanityStrikeMax", v)}
                suffix="회 초과 시 제재"
              />
              <NumberField
                label="신고 누적"
                value={config.reportStrikeMax}
                onChange={(v) => setField("reportStrikeMax", v)}
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
                aria-checked={config.autoSanctionEnabled}
                onClick={() => setField("autoSanctionEnabled", !config.autoSanctionEnabled)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  config.autoSanctionEnabled ? "bg-teal-500" : "bg-slate-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    config.autoSanctionEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          
          <div className="mt-5 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-[13px] text-teal-600">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                저장되었습니다
              </span>
            )}
            <button
              onClick={handleSave}
              className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600"
            >
              저장
            </button>
          </div>
        </div>

        
        <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#ebeef0] px-6 py-4">
            <p className="text-[15px] font-semibold text-slate-800">제재 알림 템플릿</p>
            <p className="mt-0.5 text-[12.5px] text-slate-400">
              자동 제재 시 사용자에게 발송되는 알림 메시지를 설정합니다.
            </p>
          </div>
          <div className="divide-y divide-[#ebeef0]">
            {templates.map((t) => {
              const isEditing = editingTemplateId === t.id;
              return (
                <div key={t.id} className="px-6 py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                      {TRIGGER_LABELS[t.trigger]}
                    </span>
                    {!isEditing ? (
                      <button
                        onClick={() => openTemplateEdit(t)}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTemplateSave(t.id)}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                        >
                          <Check className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={handleTemplateCancel}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="제목"
                        className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={3}
                        placeholder="메시지 내용"
                        className="w-full resize-none rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[14px] font-medium text-slate-800">{t.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t.body}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
