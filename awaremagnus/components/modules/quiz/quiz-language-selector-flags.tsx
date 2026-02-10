"use client";

import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { SUPPORTED_LANGUAGES, getLanguageCountryCode } from "@/utils/supportedLanguages";
import ReactCountryFlag from "react-country-flag";

interface QuizLanguageSelectorFlagsProps {
  value: number[];
  onChange: (value: number[]) => void;
  className?: string;
}

export function QuizLanguageSelectorFlags({
  value,
  onChange,
  className,
}: QuizLanguageSelectorFlagsProps) {
  const t = useTranslations("quiz");

  const toggleLanguage = (langId: number) => {
    if (value.includes(langId)) {
      onChange(value.filter((id) => id !== langId));
    } else {
      onChange([...value, langId]);
    }
  };

  return (
    <div className={clsx("flex flex-col", className)}>
      <p className="text-[10px] font-medium mt-4 mb-1 text-gray-900">{t("selectLanguage")}</p>
      <div className="flex gap-3 flex-wrap" id="languageGrid">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = value.includes(lang.id);

          return (
            <label
              key={lang.id}
              className="lang-item flex text-xs text-gray-700 items-center gap-2 cursor-pointer hover:opacity-80 transition select-none"
            >
              <input
                checked={isSelected}
                className="hidden"
                type="checkbox"
                value={lang.id}
                onChange={() => toggleLanguage(lang.id)}
              />
              <span
                className={clsx(
                  "visual-tick w-4 h-4 flex items-center justify-center rounded-full border-2 transition-all duration-200",
                  isSelected ? "border-[#3FBDFF] bg-[#3FBDFF]" : "border-gray-300 bg-white"
                )}
              >
                {isSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="flex items-center justify-center w-5 h-5 overflow-hidden rounded-full border border-gray-100">
                <ReactCountryFlag
                  className="w-full h-full object-cover"
                  countryCode={getLanguageCountryCode(lang.id)}
                  style={{
                    fontSize: "1.5em",
                    lineHeight: "1.5em",
                  }}
                  svg
                  title={lang.name}
                />
              </span>
              <span className="font-medium">{lang.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
