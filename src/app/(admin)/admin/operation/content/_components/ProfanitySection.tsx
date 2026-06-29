"use client";

import { useState } from "react";
import type { ProfanityRule, Scope } from "@/services/admin/adminContent";
import ProfanityList from "./profanity/ProfanityList";
import ProfanityForm from "./profanity/ProfanityForm";

type ProfTab = "list" | "create";

export default function ProfanitySection() {
  const [profTab, setProfTab] = useState<ProfTab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialScopes, setInitialScopes] = useState<Scope[]>([]);
  const [initialWords, setInitialWords] = useState<string[]>([]);

  function openCreate() {
    setEditingId(null);
    setInitialScopes([]);
    setInitialWords([]);
    setProfTab("create");
  }

  function openEdit(rule: ProfanityRule) {
    setEditingId(rule.id);
    setInitialScopes([...rule.scopes]);
    setInitialWords([...rule.words]);
    setProfTab("create");
  }

  function goToList() {
    setEditingId(null);
    setInitialScopes([]);
    setInitialWords([]);
    setProfTab("list");
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
          <button
            onClick={goToList}
            className={[
              "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              profTab === "list"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            룰 목록
          </button>
          <button
            onClick={openCreate}
            className={[
              "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              profTab === "create"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            룰 등록
          </button>
        </div>
      </div>

      {profTab === "list" ? (
        <ProfanityList onEdit={openEdit} />
      ) : (
        <ProfanityForm
          key={editingId ?? "new"}
          editingId={editingId}
          initialScopes={initialScopes}
          initialWords={initialWords}
          onSuccess={goToList}
          onCancel={goToList}
        />
      )}
    </>
  );
}
