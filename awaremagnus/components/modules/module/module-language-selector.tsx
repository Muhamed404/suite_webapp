"use client";

import Image from "next/image";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_FLAGS,
  getLanguageCountryCode,
  type SupportedLanguageId,
} from "@/utils/supportedLanguages";
import ReactCountryFlag from "react-country-flag";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

/** @deprecated Use SupportedLanguageId (language id 1–6) for new code. Kept for content forms and languageMapping. */
export type ModuleLocale = "en" | "ar" | "ur" | "zh" | "ru";

interface ModuleLanguageSelectorProps {
  selectedLanguageIds: number[];
  onChange: (languageIds: number[]) => void;
  onAddTranslation: () => void;
  className?: string;
}

export function ModuleLanguageSelector({
  selectedLanguageIds,
  onChange,
  onAddTranslation,
  className,
}: ModuleLanguageSelectorProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const handleLanguageToggle = (langId: SupportedLanguageId) => {
    if (selectedLanguageIds.includes(langId)) {
      onChange(selectedLanguageIds.filter((id) => id !== langId));
    } else {
      onChange([...selectedLanguageIds, langId]);
    }
  };

  return (
    <div className={clsx("rounded-xl p-4 bg-white border border-[var(--strokeGray)]", className)}>
      {/* Title row - matches HTML: lang icon + Select Language */}
      <div className={clsx("flex items-center gap-2 mb-3", isRtl && "flex-row-reverse")}>
        <Image
          alt=""
          className="w-4 h-4 opacity-70 flex-shrink-0"
          height={16}
          src={getContentAssetUrl("/images/lang-icon.svg")}
          width={16}
        />
        <h3 className="text-base font-semibold text-gray-800">{t("selectLanguage")}</h3>
      </div>

      {/* Language Grid - matches HTML: grid-cols-2 gap-y-1 gap-x-4 */}
      <div
        className={clsx(
          "grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-gray-700 font-medium mb-4",
          isRtl && "text-right"
        )}
      >
        {SUPPORTED_LANGUAGES.map(({ id, name }) => {
          const flag = LANGUAGE_FLAGS[id];
          const isSelected = selectedLanguageIds.includes(id);

          return (
            <label
              key={id}
              className={clsx(
                "flex items-center gap-1 cursor-pointer select-none",
                isRtl && "flex-row-reverse"
              )}
              data-lang-id={id}
            >
              <Checkbox
                classNames={{
                  base: "m-0 max-w-fit",
                  wrapper: "!hidden",
                  icon: "!hidden",
                  label: "ml-0",
                }}
                isSelected={isSelected}
                onValueChange={() => handleLanguageToggle(id)}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors border flex-shrink-0",
                    isSelected
                      ? "border-[#17b1a8] bg-[#17b1a8] text-white"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-2 h-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </Checkbox>
              <span aria-hidden className="text-base leading-none">
                <ReactCountryFlag
                  countryCode={getLanguageCountryCode(id)}
                  style={{
                    fontSize: "1em",
                    lineHeight: "1em",
                  }}
                  svg
                />
              </span>
              <span className="lang-label">{name}</span>
            </label>
          );
        })}
      </div>

      {/* Add Translation Button - Bottom Center, matches HTML */}
      <div className="flex justify-center pt-3 border-t border-gray-200">
        <Button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all"
          size="sm"
          type="button"
          onPress={onAddTranslation}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          {t("generateModuleForm") ?? t("addTranslationField") ?? "Generate Module Form"}
        </Button>
      </div>
    </div>
  );
}
