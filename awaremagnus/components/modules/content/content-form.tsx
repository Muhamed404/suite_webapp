"use client";

import type { ContentType } from "./content-type-selector";
import type { ModuleLocale } from "../module/module-language-selector";

import { useCallback } from "react";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";

export interface ContentTranslation {
  lang: ModuleLocale;
  title: string;
  content?: string;
  summary?: string;
}

interface ContentFormProps {
  contentType: ContentType | null;
  language: ModuleLocale;
  translation: ContentTranslation;
  onTranslationChange: (translation: ContentTranslation) => void;
  onLanguageChange: (lang: ModuleLocale) => void;
  /** When false, only language and title are shown (e.g. for Quiz). */
  showDescription?: boolean;
  /** When true, do not render the language selector (e.g. when language is shown above the form). */
  hideLanguage?: boolean;
  className?: string;
}

const LANGUAGES: { value: ModuleLocale; key: string }[] = [
  { value: "en", key: "languages.en" },
  { value: "ar", key: "languages.ar" },
  { value: "ur", key: "languages.ur" },
  { value: "zh", key: "languages.zh" },
  { value: "ru", key: "languages.ru" },
];

export function ContentForm({
  contentType,
  language,
  translation,
  onTranslationChange,
  onLanguageChange,
  showDescription = true,
  hideLanguage = false,
  className,
}: ContentFormProps) {
  const t = useTranslations("content");
  const { dir } = useI18n();
  const _isRtl = dir === "rtl";

  const updateTranslation = useCallback(
    (updater: (prev: ContentTranslation) => ContentTranslation) => {
      onTranslationChange(updater(translation));
    },
    [translation, onTranslationChange]
  );

  if (!contentType) {
    return (
      <div className={clsx("space-y-4", className)}>
        <p className="text-sm text-[var(--darkgray)]">{t("selectContentType")}</p>
      </div>
    );
  }

  /* Match reference: input-field (border #e5e7eb, rounded-lg, text-xs), input-label (text-xs text-gray-600) */
  const inputWrapper =
    "w-full min-h-9 h-9 rounded-lg bg-white border border-gray-200 focus-within:border-[#32B8FF] focus-within:ring-0 focus-within:shadow-[0_0_0_3px_rgba(50,184,255,0.1)] transition-colors duration-200 px-3";
  const inputClass = "text-xs text-gray-900 placeholder:text-gray-400";
  const textareaWrapper =
    "w-full rounded-lg bg-white border border-gray-200 focus-within:border-[#32B8FF] focus-within:shadow-[0_0_0_3px_rgba(50,184,255,0.1)] transition-colors duration-200 px-3 py-2.5 min-h-0";
  const selectTrigger =
    "min-h-9 h-9 rounded-lg bg-white border border-gray-200 focus-within:border-[#32B8FF] text-xs px-3";
  const labelClass = "block text-xs text-gray-600 font-medium mb-1.5";

  return (
    <div className={clsx("space-y-4", className)}>
      {!hideLanguage && (
        <div>
          <label className={labelClass}>{t("selectLanguage")}</label>
          <Select
            classNames={{ trigger: selectTrigger }}
            selectedKeys={[language]}
            onSelectionChange={(keys) => {
              const v =
                keys === "all" || !keys
                  ? "en"
                  : ((Array.from(keys as Iterable<string>)[0] as ModuleLocale) ?? "en");

              onLanguageChange(v);
            }}
          >
            {LANGUAGES.map(({ value, key }) => (
              <SelectItem key={value} textValue={t(key)}>
                {t(key)}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}

      {/* Title */}
      <div>
        <label className={labelClass}>{t("contentTitle")}</label>
        <Input
          classNames={{
            base: "w-full",
            input: inputClass,
            inputWrapper,
          }}
          placeholder={t("titlePlaceholder")}
          value={translation.title}
          onValueChange={(value) => updateTranslation((prev) => ({ ...prev, title: value }))}
        />
      </div>

      {showDescription && (
        <div>
          <label className={labelClass}>{t("description")}</label>
          <Textarea
            classNames={{
              base: "w-full",
              input: inputClass,
              inputWrapper: textareaWrapper,
            }}
            minRows={3}
            placeholder={t("descriptionPlaceholder")}
            value={translation.content ?? ""}
            onValueChange={(value) => updateTranslation((prev) => ({ ...prev, content: value }))}
          />
        </div>
      )}
    </div>
  );
}
