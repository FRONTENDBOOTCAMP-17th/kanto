async function translateText(text: string, targetLang: "en" | "tl"): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`translate ${res.status}`);
    const json = await res.json();
    const translated = json?.responseData?.translatedText;
    if (!translated) throw new Error("empty translation");
    return translated;
  } catch {
    return text;
  }
}

export async function translateNoticeTitle(
  title: string,
): Promise<{ title_en: string; title_fil: string }> {
  const [title_en, title_fil] = await Promise.all([
    translateText(title, "en"),
    translateText(title, "tl"),
  ]);
  return { title_en, title_fil };
}
