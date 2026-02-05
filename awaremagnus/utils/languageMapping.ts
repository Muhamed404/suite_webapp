import type { ModuleLocale } from "@/components/modules/module/module-language-selector";

/**
 * Maps language codes to language IDs used by the backend API
 * Common mapping: 1=English, 2=Arabic, 3=Urdu, 4=Chinese, 5=Russian
 */
export const LANGUAGE_ID_MAP: Record<ModuleLocale, number> = {
  en: 1, // English
  ar: 2, // Arabic
  ur: 3, // Urdu
  zh: 4, // Chinese
  ru: 5, // Russian
};

/**
 * Gets the language ID for a given language code
 */
export function getLanguageId(locale: ModuleLocale): number {
  return LANGUAGE_ID_MAP[locale] ?? 1; // Default to English if not found
}

/**
 * Gets the language code from a language ID
 */
export function getLanguageCode(languageId: number): ModuleLocale {
  const entry = Object.entries(LANGUAGE_ID_MAP).find(
    ([, id]) => id === languageId,
  );

  return (entry?.[0] as ModuleLocale) ?? "en";
}
