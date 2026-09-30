import { useCallback, useEffect, useState } from "react";
import { getBlockStateAction } from "../../../../../features/block/blockActions";

/** 상대방과의 차단 상태(내가 차단당함/내가 차단함)를 조회하고, 새로고침 함수를 제공한다. */
export function useBlockState(partnerId: number) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [iBlocked, setIBlocked] = useState(false);

  const refreshBlockState = useCallback(() => {
    getBlockStateAction(partnerId)
      .then(({ blocked, iBlocked }) => {
        setIsBlocked(blocked);
        setIBlocked(iBlocked);
      })
      .catch(() => {});
  }, [partnerId]);

  useEffect(() => {
    refreshBlockState();
  }, [refreshBlockState]);

  return { isBlocked, iBlocked, refreshBlockState };
}
