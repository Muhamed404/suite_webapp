"use client";

import { LibraryPage } from "@/components/modules/training-library/library-page";
import { useTranslations } from "@/i18n/useTranslations";

export default function SystemLibraryPage() {
  const t = useTranslations("dashboard");

  return <LibraryPage libraryType="system" title={t("menu.systemLibrary")} />;
}
