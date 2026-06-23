"use client";

// 지도 클릭 → 좌표 선택 + Google Geocoding API로 주소 자동 변환

import { useState, useCallback } from "react";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string; // Reverse Geocoding 결과 (상호명/도로명)
  placeId?: string;
}

export function useLocationPicker() {
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  /**
   * 지도 클릭 이벤트 핸들러
   * <Map onClick={handleMapClick}> 에 연결
   */
  const handleMapClick = useCallback(async (event: MapMouseEvent) => {
    const lat = event.detail.latLng?.lat;
    const lng = event.detail.latLng?.lng;
    if (lat === undefined || lng === undefined) return;

    setGeocoding(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json` +
          `?latlng=${lat},${lng}` +
          `&key=${apiKey}` +
          `&language=ko` +
          `&result_type=establishment|point_of_interest|street_address`,
      );
      const data = await res.json();

      // 가장 정확한 결과 선택 (상호명 > 도로명 > 좌표)
      const best =
        data.results?.find((r: any) =>
          r.types?.some((t: string) =>
            ["establishment", "point_of_interest"].includes(t),
          ),
        ) ?? data.results?.[0];

      const address = best?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setLocation({ lat, lng, address, placeId: best?.place_id });
    } catch {
      // Geocoding 실패 시 좌표만 저장
      setLocation({
        lat,
        lng,
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
    } finally {
      setGeocoding(false);
    }
  }, []);

  const reset = useCallback(() => setLocation(null), []);

  return { location, geocoding, handleMapClick, reset };
}
