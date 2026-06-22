"use client";

import { useState, useEffect } from "react";
import TermsContent from "./TermsContent";

const CACHE_DURATION = 36000 * 1000;
const CACHE_KEY = (type: string, locale: string) => `terms_${type}_${locale}`;

interface CachedData {
  title: string;
  content: string;
  timestamp: number;
}

function getCached(type: string, locale: string): { title: string; content: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(type, locale));
    if (!raw) return null;
    const { title, content, timestamp }: CachedData = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return { title, content };
  } catch {
    return null;
  }
}

function setCache(type: string, locale: string, title: string, content: string) {
  try {
    const data: CachedData = { title, content, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY(type, locale), JSON.stringify(data));
  } catch {}
}

export default function TermsClientContent({ type, locale }: { type: string; locale: string }) {
  const [data, setData] = useState<{ title: string; content: string } | null>(
    () => getCached(type, locale)
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (data) return;

    fetch(`/api/terms?type=${type}&locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(({ title, content }) => {
        setCache(type, locale, title, content);
        setData({ title, content });
      })
      .catch(() => setError(true));
  }, [type, locale, data]);

  if (error) return (
    <main className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center">
      현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
    </main>
  );

  if (!data) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </main>
  );

  return <TermsContent title={data.title} content={data.content} />;
}
