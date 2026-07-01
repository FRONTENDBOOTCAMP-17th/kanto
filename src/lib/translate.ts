async function translateText(text: string, targetLang: "en" | "tl"): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation request failed: ${res.status}`);
  const json = await res.json();
  if (json.responseStatus !== 200) throw new Error(`Translation error: ${json.responseDetails}`);
  return json.responseData.translatedText as string;
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
