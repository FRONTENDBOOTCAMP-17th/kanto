"use client";

import { useTranslations } from "next-intl";
import type { User as UserType } from "@/type/user";
import { ProfileField } from "../ProfileField";
import { useProfileInfo } from "@/hooks/profile/useProfileInfo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BANK_OPTIONS = [
  { code: "BDO", label: "BDO" },
  { code: "BPI", label: "BPI" },
  { code: "UNIONBANK", label: "UnionBank" },
  { code: "METROBANK", label: "Metrobank" },
  { code: "RCBC", label: "RCBC" },
  { code: "SECURITY_BANK", label: "Security Bank" },
  { code: "CHINABANK", label: "China Bank" },
  { code: "EASTWEST", label: "EastWest Bank" },
  { code: "LANDBANK", label: "LandBank" },
  { code: "PNB", label: "PNB" },
  { code: "GCASH", label: "GCash" },
  { code: "PAYMAYA", label: "Maya" },
];

export function ProfilePaymentSection({
  user,
}: {
  user: UserType;
}) {
  const tb = useTranslations("Profile.bank");
  const {
    bankCode,
    setBankCode,
    bankAccountNumber,
    setBankAccountNumber,
    bankAccountName,
    setBankAccountName,
    bankSaved,
    bankEditing,
    handleSaveBank,
    handleEditBank,
  } = useProfileInfo(user);

  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{tb("title")}</h2>
        <p className="text-xs text-gray-400 mb-6">{tb("hint")}</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-500">{tb("bankCode")}</label>
            <Select
              value={bankCode}
              onValueChange={setBankCode}
              disabled={bankSaved && !bankEditing}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tb("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((b) => (
                  <SelectItem key={b.code} value={b.code}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ProfileField
            label={tb("accountNumber")}
            type="text"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            disabled={bankSaved && !bankEditing}
            hint={tb("accountNumberHint")}
          />
          <ProfileField
            label={tb("accountName")}
            type="text"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            disabled={bankSaved && !bankEditing}
            placeholder={tb("accountNamePlaceholder")}
          />
          <button
            type="button"
            onClick={bankSaved && !bankEditing ? handleEditBank : handleSaveBank}
            className="cursor-pointer w-full py-3.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            {bankSaved && !bankEditing ? tb("edit") : tb("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
