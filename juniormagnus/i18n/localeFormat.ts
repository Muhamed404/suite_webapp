import type { Locale } from "./config";

function numberFormatLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-US";
}

function arabicNumerals(): Pick<Intl.NumberFormatOptions, "numberingSystem"> {
  return { numberingSystem: "arab" };
}

/** Map ASCII digits in a string to Eastern Arabic–Indic (٠–٩). Use for HMS and other non-Intl text. */
export function formatLocaleDigitsInString(locale: Locale, s: string): string {
  if (locale !== "ar") return s;
  const map = "٠١٢٣٤٥٦٧٨٩";

  return s.replace(/\d/g, (ch) => map[Number(ch)] ?? ch);
}

export function formatLocaleInteger(locale: Locale, value: number): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    maximumFractionDigits: 0,
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(value);
}

export function formatLocaleDecimal(
  locale: Locale,
  value: number,
  minFractionDigits?: number,
  maxFractionDigits?: number
): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits ?? minFractionDigits,
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(value);
}

/** `valueOutOf100` is e.g. 31.37 meaning 31.37%. */
export function formatLocalePercentOf100(
  locale: Locale,
  valueOutOf100: number,
  maxFractionDigits = 2
): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    style: "percent",
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(valueOutOf100 / 100);
}

export function formatLocaleMonthYear(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    month: "long",
    year: "numeric",
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(date);
}

export function formatLocaleMediumDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(date);
}

export function formatLocaleShortDayMonth(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "short",
    ...(locale === "ar" ? arabicNumerals() : {}),
  }).format(date);
}
