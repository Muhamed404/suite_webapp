"use client";

import type { Locale } from "./config";
import type { AppMessages } from "./messages";

import IntlMessageFormat from "intl-messageformat";
import * as React from "react";

import { getLocaleDir } from "./config";

type Namespace = keyof AppMessages;

export interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  messages: AppMessages;
  t: (namespace: Namespace, key: string, values?: Record<string, unknown>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function getValueAtPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;

  return path.split(".").reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== "object") return undefined;

    return (acc as Record<string, unknown>)[segment];
  }, obj);
}

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: AppMessages;
}) {
  const dir = getLocaleDir(locale);

  const t = React.useCallback<I18nContextValue["t"]>(
    (namespace, key, values) => {
      const msg = getValueAtPath(messages[namespace], key);
      const isString = typeof msg === "string";

      if (!isString && (!values || typeof values.defaultValue !== "string")) {
        return key;
      }

      const template = isString ? (msg as string) : (values?.defaultValue as string);

      if (!values) return template;

      try {
        return new IntlMessageFormat(template, locale).format(values) as string;
      } catch {
        return template;
      }
    },
    [locale, messages]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, dir, messages, t }),
    [dir, locale, messages, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);

  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return ctx;
}
