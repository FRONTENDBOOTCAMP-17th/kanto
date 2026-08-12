"use client";

import { useEffect, useState } from "react";
import {
  createNotice,
  deleteNotice,
  getNotices,
  updateNotice,
  type Notice,
} from "@/services/admin/adminNoticesApi";

export type Tab = "list" | "create";

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    getNotices()
      .then(setNotices)
      .finally(() => setLoading(false));
  }, []);

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

  async function handleSubmit() {
    const endsAtInvalid = !!startsAt && !!endsAt && endsAt <= startsAt;
    if (!title.trim() || !startsAt || !endsAt || endsAtInvalid) return;

    const body = {
      title: title.trim(),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    };

    if (editingId !== null) {
      const updated = await updateNotice(editingId, body);
      if (updated) {
        setNotices((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
      }
    } else {
      const created = await createNotice(body);
      if (created) {
        setNotices((prev) => [created, ...prev]);
      }
    }

    resetForm();
    setTab("list");
  }

  async function handleDelete(id: number) {
    const ok = await deleteNotice(id);
    if (ok) setNotices((prev) => prev.filter((n) => n.id !== id));
  }

  function handleCancel() {
    resetForm();
    setTab("list");
  }

  return {
    notices,
    loading,
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
    handleDelete,
    handleCancel,
  };
}
