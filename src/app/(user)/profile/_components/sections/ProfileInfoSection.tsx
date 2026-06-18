"use client";

import { useTranslations } from "next-intl";
import type { User as UserType } from "@/type/user";
import { ProfileField } from "../ProfileField";
import { useProfileInfo } from "@/hooks/profile/useProfileInfo";

export function ProfileInfoSection({
  user,
  avatarFile,
}: {
  user: UserType;
  avatarFile: File | null;
}) {
  const t = useTranslations("Profile.info");
  const {
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
  } = useProfileInfo(user, avatarFile);

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* 프로필 편집 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("editTitle")}</h2>
          <form className="flex flex-col gap-5">
            <ProfileField
              label={t("name")}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-gray-900 border border-teal-500 rounded-lg outline-none focus:ring-2 focus:ring-teal-200"
            />
            <ProfileField
              label={t("email")}
              type="email"
              value={user.email ?? ""}
              disabled
              hint={t("emailHint")}
            />
            <ProfileField
              label={t("phone")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={phoneSaved && !phoneEditing}
            />
            <button
              type="button"
              onClick={phoneSaved && !phoneEditing ? handleEditPhone : handleSave}
              className="cursor-pointer w-full py-3.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors mt-2"
            >
              {phoneSaved && !phoneEditing ? t("edit") : t("save")}
            </button>
          </form>
        </div>
      </div>

      {/* 비밀번호 변경 — 이메일 로그인 전용 */}
      {(!user.provider || user.provider === "email") && (
        <div className="px-5 md:px-0 py-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("passwordTitle")}</h2>
            <div className="flex flex-col gap-5">
              <ProfileField label={t("currentPassword")} type="password" value="" onChange={() => {}} />
              <ProfileField label={t("newPassword")} type="password" value="" onChange={() => {}} />
              <ProfileField
                label={t("confirmPassword")}
                type="password"
                value=""
                onChange={() => {}}
                hint={t("passwordHint")}
              />
              <button
                type="button"
                className="cursor-pointer w-full py-3.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors mt-2"
              >
                {t("passwordChange")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 삭제 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("deleteTitle")}</h2>
          {user.deleted_at ? (
            <>
              <p className="text-sm text-red-400 mb-4">
                {t("pendingDelete")}
              </p>
              <button
                type="button"
                onClick={handleRestoreAccount}
                disabled={deleteLoading}
                aria-busy={deleteLoading}
                className="cursor-pointer px-4 py-2.5 rounded-lg border border-teal-500 text-teal-500 hover:text-white text-sm font-medium bg-transparent hover:bg-teal-500 transition-colors disabled:opacity-70"
              >
                {deleteLoading ? t("processing") : t("restore")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">{t("deleteDesc")}</p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="cursor-pointer px-4 py-2.5 rounded-lg border border-red-200 text-red-500 hover:text-white text-sm font-medium bg-transparent hover:bg-rose-600 transition-colors"
              >
                {t("delete")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 flex flex-col gap-4">
            <div>
              <p id="delete-modal-title" className="text-base font-semibold text-gray-900">{t("confirmTitle")}</p>
              <p id="delete-modal-desc" className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                {t("confirmDesc")}
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                aria-busy={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-70"
              >
                {deleteLoading ? t("processing") : t("confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
