"use client";

import { LibraryPage } from "@/components/modules/training-library/library-page";
import { useTranslations } from "@/i18n/useTranslations";

export default function MyLibraryPage() {
  const t = useTranslations("dashboard");

  return (
    <LibraryPage
      libraryType="my"
      title={t("menu.myLibrary")}
    />
  );
}
