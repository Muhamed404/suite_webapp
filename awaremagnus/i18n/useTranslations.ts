"use client";

import type { AppMessages } from "./messages";

import { useI18n } from "./I18nProvider";

type Namespace = keyof AppMessages;

export function useTranslations(namespace: Namespace) {
  const { t } = useI18n();

  return (key: string, values?: Record<string, unknown>) => t(namespace, key, values);
}
