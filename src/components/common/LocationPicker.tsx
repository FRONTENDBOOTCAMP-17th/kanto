"use client";

import { useTranslations } from "next-intl";
import { APIProvider } from "@vis.gl/react-google-maps";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import { formatBarangayLabel } from "@/type/location";
import type { PickedLocation } from "@/type/go";

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  
  fallbackLabel?: string | null;
}

export function LocationPicker({ value, onChange, fallbackLabel }: Props) {
  const tc = useTranslations("Common");

  
  const freshLabel = value
    ? formatBarangayLabel(value.barangay ?? null, value.city ?? null)
    : null;
  const hasLocation = Boolean(value || fallbackLabel);

  return (
    <div className="space-y-2">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <PlaceAutocomplete
          selected={value}
          onSelect={onChange}
          fallbackLabel={fallbackLabel}
        />
      </APIProvider>
      {hasLocation && (
        <p className="text-xs text-gray-500">
          {freshLabel && (
            <>
              {tc("locationPublicLabel")}:{" "}
              <span className="font-semibold text-gray-700">{freshLabel}</span>
              <br />
            </>
          )}
          {tc("locationPrivacyNote")}
        </p>
      )}
    </div>
  );
}
