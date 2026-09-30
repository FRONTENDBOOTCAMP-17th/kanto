"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { APIProvider } from "@vis.gl/react-google-maps";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import type { PickedLocation } from "@/type/go";

interface LocationSectionProps {
  workLocation: PickedLocation | null;
  onWorkLocationSelect: (l: PickedLocation) => void;
  locationFallbackLabel: string | null;
}

export function LocationSection({
  workLocation,
  onWorkLocationSelect,
  locationFallbackLabel,
}: LocationSectionProps) {
  const t = useTranslations("Job");

  return (
    <div className="space-y-2">
      <Label>{t("form.locationLabel")}</Label>
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={["places"]}
        version="weekly"
      >
        <PlaceAutocomplete
          selected={workLocation}
          onSelect={onWorkLocationSelect}
          fallbackLabel={workLocation ? null : locationFallbackLabel}
        />
      </APIProvider>
    </div>
  );
}
