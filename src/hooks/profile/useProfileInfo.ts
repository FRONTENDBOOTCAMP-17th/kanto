"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User as UserType } from "@/type/user";
import { uploadAvatar, updateProfile, fetchRestoredUser } from "@/services/profile/profileInfo";

export function useProfileInfo(user: UserType, avatarFile: File | null) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [phoneSaved, setPhoneSaved] = useState(!!user.phone);
  const [phoneEditing, setPhoneEditing] = useState(!user.phone);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { setUser, clearUser } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Profile.toast");
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
    const isFirstSave = !phoneSaved;
    try {
      const avatarUrl = avatarFile ? await uploadAvatar(user.id, avatarFile) : user.avatar_url;
      const updated = await updateProfile(user.id, { name, phone, avatar_url: avatarUrl });
      setUser(updated);
      setPhoneSaved(true);
      setPhoneEditing(false);
      alert(isFirstSave ? t("saved") : t("updated"));
    } catch (e) {
      alert(e instanceof Error ? e.message : t("saveFailed"));
    }
  };

  const handleEditPhone = () => setPhoneEditing(true);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const res = await fetch("/api/user", { method: "DELETE" });
    if (!res.ok) {
      setDeleteLoading(false);
      alert(t("deleteFailed"));
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
      alert(t("restoreFailed"));
      return;
    }
    if (user.auth_id) {
      const data = await fetchRestoredUser(user.auth_id);
      if (data) setUser(data);
    }
    setDeleteLoading(false);
  };

  return {
    name, setName,
    phone, setPhone,
    phoneSaved,
    phoneEditing,
    handleEditPhone,
    showDeleteModal, setShowDeleteModal,
    deleteLoading,
    cancelButtonRef,
    handleSave,
    handleDeleteAccount,
    handleRestoreAccount,
  };
}
