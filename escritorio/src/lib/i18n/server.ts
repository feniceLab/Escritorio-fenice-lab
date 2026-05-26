import en from "./locales/en";
import pt from "./locales/pt";

export type ServerLocale = "en" | "pt";

const translations: Record<ServerLocale, Record<string, string>> = {
  en,
  pt,
};

export function normalizeLocale(locale: string | null | undefined): ServerLocale {
  const base = locale?.toLowerCase().slice(0, 2);
  if (base === "en") return "en";
  return "pt";
}

export function translateServer(
  locale: ServerLocale | string | null | undefined,
  key: string,
  params?: Record<string, string | number>,
): string {
  const normalized = typeof locale === "string" ? normalizeLocale(locale) : "pt";
  let text = translations[normalized][key] ?? translations.en[key] ?? key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value));
    }
  }

  return text;
}
