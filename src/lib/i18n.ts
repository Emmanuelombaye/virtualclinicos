import en from "../../messages/en.json";

const messages: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
};

let locale = "en";

export function setLocale(l: string) {
  locale = l;
}

export function t(key: string, fallback?: string): string {
  return messages[locale]?.[key] ?? messages.en?.[key] ?? fallback ?? key;
}
