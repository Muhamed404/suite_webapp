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
  type SupportedLanguageId,
} from "@/utils/supportedLanguages";

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
    <div
      className={clsx(
        "rounded-2xl border border-[var(--strokeGray)] bg-white p-5",
        className,
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between gap-3 mb-4 min-w-0",
          isRtl && "flex-row-reverse",
        )}
      >
        <div
          className={clsx(
            "flex items-center gap-2 min-w-0 flex-shrink",
            isRtl && "flex-row-reverse",
          )}
        >
          <Image
            alt=""
            className="w-5 h-5 opacity-80 flex-shrink-0"
            height={20}
            src="/images/lang-icon.svg"
            width={20}
          />
          <h3 className="text-sm font-semibold text-[var(--mainblue)] truncate">
            {t("selectLanguage")}
          </h3>
        </div>
        <Button
          className="rounded-full text-[var(--blue)] text-sm font-medium h-9 min-h-9 px-4 flex-shrink-0 whitespace-nowrap"
          size="sm"
          type="button"
          variant="flat"
          onPress={onAddTranslation}
        >
          <span className="text-lg leading-none mr-1.5">+</span>
          {t("addTranslationField")}
        </Button>
      </div>
      <div
        className={clsx(
          "grid grid-cols-2 gap-y-2 gap-x-3 text-sm text-[var(--darkgray)] font-medium",
          isRtl && "text-right",
        )}
      >
        {SUPPORTED_LANGUAGES.map(({ id, name }) => {
          const flag = LANGUAGE_FLAGS[id];
          const isSelected = selectedLanguageIds.includes(id);
          return (
            <label
              key={id}
              className={clsx(
                "flex items-center gap-2 cursor-pointer select-none py-1",
                isRtl && "flex-row-reverse",
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
                    "w-4 h-4 rounded-full flex items-center justify-center transition-colors border flex-shrink-0 text-xs",
                    isSelected
                      ? "border-[var(--blue)] bg-[var(--blue)] text-white"
                      : "border-[var(--strokeGray)] bg-white",
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </Checkbox>
              <span className="text-base leading-none" aria-hidden>
                {flag}
              </span>
              <span className="text-sm">{name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
