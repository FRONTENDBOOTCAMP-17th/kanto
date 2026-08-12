"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotice, updateNotice, type Notice } from "@/services/admin/adminNoticesApi";
import { NOTICES_QUERY_KEY } from "./useNoticeList";

export type Tab = "list" | "create";

export function useNoticeForm() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
  }

  function openCreate() {
    resetForm();
    setTab("create");
  }

  function openEdit(n: Notice) {
    setEditingId(n.id);
    setTitle(n.title);
    setStartsAt(n.startsAt);
    setEndsAt(n.endsAt);
    setTab("create");
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });

  const createMutation = useMutation({ mutationFn: createNotice, onSuccess: invalidate });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; body: { title: string; starts_at: string; ends_at: string } }) =>
      updateNotice(vars.id, vars.body),
    onSuccess: invalidate,
  });

  async function handleSubmit() {
    const endsAtInvalid = !!startsAt && !!endsAt && endsAt <= startsAt;
    if (!title.trim() || !startsAt || !endsAt || endsAtInvalid) return;

    const body = {
      title: title.trim(),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    };

    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, body });
      } else {
        await createMutation.mutateAsync(body);
      }
    } catch {
      return;
    }

    resetForm();
    setTab("list");
  }

  function handleCancel() {
    resetForm();
    setTab("list");
  }

  return {
    tab,
    setTab,
    editingId,
    title,
    startsAt,
    endsAt,
    setTitle,
    setStartsAt,
    setEndsAt,
    openCreate,
    openEdit,
    handleSubmit,
    handleCancel,
    submitError: createMutation.error?.message ?? updateMutation.error?.message ?? null,
  };
}
