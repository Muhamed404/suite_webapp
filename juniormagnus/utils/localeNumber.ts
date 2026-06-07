/**
 * Locale-aware number formatting helpers.
 *
 * Renders numbers in the script appropriate for the current locale:
 *   - "ar" -> Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
 *   - everything else -> Latin digits (0123456789)
 *
 * Use these in lists/tables/quizzes to show "1, 2, 3" in English and
 * "١, ٢, ٣" in Arabic, and to make padded counters (e.g. "01/05") look
 * right in RTL context as well.
 */

type SupportedLocale = "en" | "ar" | string;

const NUMBER_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: SupportedLocale, useGrouping: boolean): Intl.NumberFormat {
  const key = `${locale}|${useGrouping}`;
  let fmt = NUMBER_FORMATTERS.get(key);

  if (!fmt) {
    try {
      const intlLocale = locale === "ar" ? "ar-EG" : locale;

      fmt = new Intl.NumberFormat(intlLocale, {
        useGrouping,
        numberingSystem: locale === "ar" ? "arab" : undefined,
      } as Intl.NumberFormatOptions);
    } catch {
      fmt = new Intl.NumberFormat("en", { useGrouping });
    }
    NUMBER_FORMATTERS.set(key, fmt);
  }

  return fmt;
}

/** Format an integer in the current locale's digit system. */
export function formatNumber(value: number, locale: SupportedLocale = "en"): string {
  if (!Number.isFinite(value)) return String(value);

  return getFormatter(locale, false).format(value);
}

/** Format an integer with grouping separators (e.g. 1,234) in the current locale. */
export function formatNumberGrouped(value: number, locale: SupportedLocale = "en"): string {
  if (!Number.isFinite(value)) return String(value);

  return getFormatter(locale, true).format(value);
}

/** Pad a number on the left with the locale's "0" character to reach width. */
export function padNumber(value: number, width: number, locale: SupportedLocale = "en"): string {
  const formatted = formatNumber(value, locale);
  const zeroChar = formatNumber(0, locale);

  if (formatted.length >= width) return formatted;

  return zeroChar.repeat(width - formatted.length) + formatted;
}
