"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APIProvider } from "@vis.gl/react-google-maps";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import type { PickedLocation } from "@/type/go";

const RequiredMark = () => <span> *</span>;

const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;

interface CompanyLocationSectionProps {
  companyAddress: string;
  companyLocation: PickedLocation | null;
  setCompanyLocation: (l: PickedLocation) => void;
  companyWebsite: string;
  setCompanyWebsite: (v: string) => void;
}

export function CompanyLocationSection({
  companyAddress,
  companyLocation,
  setCompanyLocation,
  companyWebsite,
  setCompanyWebsite,
}: CompanyLocationSectionProps) {
  const t = useTranslations("Job");
  const [websiteError, setWebsiteError] = useState("");

  const handleWebsiteBlur = () => {
    if (companyWebsite && !URL_REGEX.test(companyWebsite)) {
      setWebsiteError(t("form.websiteError"));
    } else {
      setWebsiteError("");
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="companyAddress">{t("form.addressLabel")}<RequiredMark /></Label>
        <APIProvider
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["places"]}
          version="weekly"
        >
          <PlaceAutocomplete
            selected={companyLocation}
            onSelect={setCompanyLocation}
            fallbackLabel={companyLocation ? null : companyAddress || null}
          />
        </APIProvider>
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyWebsite">{t("form.websiteLabel")}</Label>
        <Input
          id="companyWebsite"
          placeholder={t("form.websitePlaceholder")}
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
          onBlur={handleWebsiteBlur}
          className="h-12 rounded-sm"
        />
        {websiteError && <p className="text-xs text-red-500">{websiteError}</p>}
      </div>
    </>
  );
}
