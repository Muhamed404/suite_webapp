/**
 * Supported languages from the backend (seeded by default).
 * Use for language filter dropdowns, module cards (flags), and create module form.
 */
export const SUPPORTED_LANGUAGES = [
  { id: 1, name: "English" },
  { id: 2, name: "Arabic" },
  { id: 3, name: "Urdu" },
  { id: 4, name: "French" },
  { id: 5, name: "Mandarin Chinese" },
  { id: 6, name: "Turkish" },
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];

/** Flag emoji per language id for module cards and language selector */
export const LANGUAGE_FLAGS: Record<SupportedLanguageId, string> = {
  1: "🇺🇸", // English
  2: "🇸🇦", // Arabic
  3: "🇵🇰", // Urdu
  4: "🇫🇷", // French
  5: "🇨🇳", // Mandarin Chinese
  6: "🇹🇷", // Turkish
};

export const LANGUAGE_COUNTRY_CODES: Record<SupportedLanguageId, string> = {
  1: "US",
  2: "SA",
  3: "PK",
  4: "FR",
  5: "CN",
  6: "TR",
};

export function getLanguageFlag(languageId: number): string {
  return LANGUAGE_FLAGS[languageId as SupportedLanguageId] ?? "🌐";
}

export function getLanguageCountryCode(languageId: number): string {
  return LANGUAGE_COUNTRY_CODES[languageId as SupportedLanguageId] ?? "US";
}

export function getLanguageName(languageId: number): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.id === languageId);

  return lang?.name ?? `Lang ${languageId}`;
}

/** BCP 47 tags for Intl.DisplayNames (aligned with SUPPORTED_LANGUAGES ids). */
const LANGUAGE_BCP47: Record<SupportedLanguageId, string> = {
  1: "en",
  2: "ar",
  3: "ur",
  4: "fr",
  5: "zh",
  6: "tr",
};

/**
 * Language label for the current UI locale (e.g. Arabic names when locale is `ar`).
 * Falls back to {@link getLanguageName} if Intl is unavailable.
 */
export function getLocalizedLanguageName(languageId: number, locale: string): string {
  const id = languageId as SupportedLanguageId;
  const code = LANGUAGE_BCP47[id];

  if (!code) return getLanguageName(languageId);

  try {
    const display = new Intl.DisplayNames([locale, "en"], { type: "language" });

    return display.of(code) ?? getLanguageName(languageId);
  } catch {
    return getLanguageName(languageId);
  }
}
