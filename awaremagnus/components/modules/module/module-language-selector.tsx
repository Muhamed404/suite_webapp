"use client";

import Image from "next/image";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";

export type ModuleLocale = "en" | "ar" | "ur" | "zh" | "ru";

const LANGUAGES: { value: ModuleLocale; key: string; flag: string }[] = [
  { value: "en", key: "languages.en", flag: "/images/eng.png" },
  { value: "ar", key: "languages.ar", flag: "/images/ar.png" },
  { value: "ur", key: "languages.ur", flag: "/images/eng.png" }, // TODO: Add proper flags
  { value: "zh", key: "languages.zh", flag: "/images/eng.png" },
  { value: "ru", key: "languages.ru", flag: "/images/eng.png" },
];

interface ModuleLanguageSelectorProps {
  selectedLanguages: ModuleLocale[];
  onChange: (languages: ModuleLocale[]) => void;
  onAddTranslation: () => void;
  className?: string;
}

export function ModuleLanguageSelector({
  selectedLanguages,
  onChange,
  onAddTranslation,
  className,
}: ModuleLanguageSelectorProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const handleLanguageToggle = (lang: ModuleLocale) => {
    if (selectedLanguages.includes(lang)) {
      onChange(selectedLanguages.filter((l) => l !== lang));
    } else {
      onChange([...selectedLanguages, lang]);
    }
  };

  return (
    <div
      className={clsx(
        "border border-gray-200 rounded-xl p-4 bg-white",
        className
      )}
    >
      {/* Title row */}
      <div
        className={clsx(
          "flex items-center justify-between mb-3",
          isRtl && "flex-row-reverse"
        )}
      >
        <div className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <Image
            src="/images/lang-icon.svg"
            width={16}
            height={16}
            className="w-4 h-4 opacity-70"
            alt="lang icon"
          />
          <h3 className="text-base font-semibold text-gray-800">
            {t("selectLanguage")}
          </h3>
        </div>

        <Button
          type="button"
          variant="light"
          size="sm"
          onPress={onAddTranslation}
          className="flex items-center gap-1 text-blue-500 text-[10px] font-medium hover:text-blue-600 h-auto min-h-0 py-1"
        >
          <span className="text-base leading-none">+</span>
          {t("addTranslationField")}
        </Button>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-gray-700 font-medium">
        {LANGUAGES.map(({ value, key, flag }) => {
          const isSelected = selectedLanguages.includes(value);
          return (
            <label
              key={value}
              className={clsx(
                "lang-item flex items-center gap-1 cursor-pointer select-none",
                isRtl && "flex-row-reverse"
              )}
              data-lang={value}
            >
              <Checkbox
                isSelected={isSelected}
                onValueChange={() => handleLanguageToggle(value)}
                classNames={{
                  base: "m-0 max-w-fit",
                  wrapper: "!hidden",
                  icon: "!hidden",
                  label: "ml-0",
                }}
              >
                <span
                  className={clsx(
                    "visual-tick w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors border flex-shrink-0",
                    isSelected
                      ? "border-[#3FBDFF] bg-[#3FBDFF]"
                      : "border-gray-300 bg-white"
                  )}
                  aria-hidden
                >
                  {isSelected && (
                    <svg
                      className="w-2 h-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
              </Checkbox>
              <span className="lang-label">{t(key)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
