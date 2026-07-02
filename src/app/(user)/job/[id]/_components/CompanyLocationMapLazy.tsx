"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const CompanyLocationMap = dynamic(() => import("./CompanyLocationMap"), {
  ssr: false,
  loading: () => <div className="h-56 w-full rounded-xl bg-gray-100 animate-pulse" />,
});

interface Props {
  lat: number;
  lng: number;
  address?: string | null;
}

export default function CompanyLocationMapLazy(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-56 w-full">
      {visible ? (
        <CompanyLocationMap {...props} />
      ) : (
        <div className="h-56 w-full rounded-xl bg-gray-100" />
      )}
    </div>
  );
}
