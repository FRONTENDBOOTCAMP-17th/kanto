"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User as UserType } from "@/type/user";

export function useProfileInfo(user: UserType, avatarFile: File | null) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { setUser, clearUser } = useAuthStore();
  const router = useRouter();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showDeleteModal) return;
    cancelButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteLoading) setShowDeleteModal(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showDeleteModal, deleteLoading]);

  const handleSave = async () => {
    let avatarUrl = user.avatar_url;

    if (avatarFile) {
      const filePath = `avatars/${user.id}/profile`;
      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, avatarFile, { upsert: true });

      if (error) {
        alert("프로필 사진 업로드에 실패했습니다.");
        return;
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl + `?v=${Date.now()}`;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ name, phone, avatar_url: avatarUrl })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      alert("저장에 실패했습니다.");
      return;
    }

    setUser(data as UserType);
    alert("저장되었습니다.");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const res = await fetch("/api/user", { method: "DELETE" });
    if (!res.ok) {
      setDeleteLoading(false);
      alert("계정 삭제에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    await supabase.auth.signOut();
    clearUser();
    router.push("/");
  };

  const handleRestoreAccount = async () => {
    setDeleteLoading(true);
    const res = await fetch("/api/user", { method: "PATCH" });
    if (!res.ok) {
      setDeleteLoading(false);
      alert("탈퇴 철회에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    const authId = user.auth_id;
    if (!authId) { setDeleteLoading(false); return; }
    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at")
      .eq("auth_id", authId)
      .single();
    if (data) setUser(data as typeof user);
    setDeleteLoading(false);
  };

  return {
    name, setName,
    phone, setPhone,
    showDeleteModal, setShowDeleteModal,
    deleteLoading,
    cancelButtonRef,
    handleSave,
    handleDeleteAccount,
    handleRestoreAccount,
  };
}
