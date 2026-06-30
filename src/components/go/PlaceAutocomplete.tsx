"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Loader2, Search } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import type { PickedLocation } from "@/type/go";
import { extractBarangayCity } from "@/type/location";

const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };
const BIAS_RADIUS_M = 30000;

interface Props {
  selected: PickedLocation | null;
  onSelect: (loc: PickedLocation) => void;
  
  fallbackLabel?: string | null;
}

export function PlaceAutocomplete({ selected, onSelect, fallbackLabel }: Props) {
  const t = useTranslations("Go.place");
  const placesLib = useMapsLibrary("places");

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  
  useEffect(() => {
    if (!placesLib) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const query = input.trim();
      if (!query) {
        if (!cancelled) {
          setSuggestions([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionTokenRef.current,
          language: "en",
          region: "ph",
          
          includedRegionCodes: ["ph"],
          locationBias: {
            center: MANILA_CENTER,
            radius: BIAS_RADIUS_M,
          },
        });
        if (!cancelled) setSuggestions(suggestions);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, placesLib]);

  const handlePick = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction || !placesLib) return;

    setOpen(false);
    setLoading(true);
    try {
      
      const place = new placesLib.Place({
        id: prediction.placeId,
        requestedLanguage: "en",
        requestedRegion: "ph",
      });
      await place.fetchFields({
        fields: ["location", "formattedAddress", "displayName", "id", "addressComponents"],
      });

      const lat = place.location?.lat();
      const lng = place.location?.lng();
      if (lat === undefined || lng === undefined) return;

      const { barangay, city, province } = extractBarangayCity(place.addressComponents ?? []);

      onSelect({
        lat,
        lng,
        address:
          place.formattedAddress ?? place.displayName ?? prediction.text.text,
        placeId: place.id,
        barangay,
        city,
        province,
        displayName: place.displayName ?? null,
      });
      setInput("");
      setSuggestions([]);
    } finally {
      
      sessionTokenRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={2}
        />
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placesLib ? t("placeholder") : t("loading")}
          disabled={!placesLib}
          className="w-full rounded-[11px] border-[1.5px] border-slate-200 py-3 pl-9 pr-9 text-[14.5px] text-slate-900 outline-none focus:border-teal-400 disabled:bg-slate-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-500" />
        )}
      </div>

      
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-60 w-full overflow-y-auto rounded-[12px] border border-slate-200 bg-white py-1.5 shadow-lg">
          {suggestions.map((s, i) => {
            const p = s.placePrediction;
            if (!p) return null;
            return (
              <li key={p.placeId ?? i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(s)}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50"
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    strokeWidth={2}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-slate-800">
                      {p.mainText?.text ?? p.text.text}
                    </span>
                    {p.secondaryText?.text && (
                      <span className="block truncate text-[12.5px] text-slate-400">
                        {p.secondaryText.text}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      
      {selected ? (
        <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-teal-50 px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} />
          <span className="text-[13px] font-semibold text-teal-800">
            {selected.address}
          </span>
        </div>
      ) : fallbackLabel ? (
        <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-teal-50 px-3 py-2.5">
          <MapPin className="h-4 w-4 flex-shrink-0 text-teal-600" strokeWidth={2} />
          <span className="text-[13px] font-semibold text-teal-800">
            현재 설정된 거래지역: {fallbackLabel}
          </span>
        </div>
      ) : (
        <p className="mt-1.5 text-[12.5px] text-slate-400">{t("empty")}</p>
      )}
    </div>
  );
}
