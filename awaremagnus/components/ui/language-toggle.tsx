"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/client-locale";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

interface LanguageToggleProps {
  onClick?: () => void;
}

export const LanguageToggle = ({ onClick }: LanguageToggleProps) => {
  const router = useRouter();
  const { locale } = useI18n();
  const t = useTranslations("common");

  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const label = locale === "ar" ? t("language.switchToEnglish") : t("language.switchToArabic");

  return (
    <Button
      variant="bordered"
      radius="full"
      size="sm"
      className="border-[var(--blue)] text-sm py-1.5 px-4 hover:bg-[var(--blue)] hover:text-white transition-all duration-300"
      onPress={() => {
        if (onClick) {
          onClick();
          return;
        }

        setLocaleCookie(nextLocale);
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
};

