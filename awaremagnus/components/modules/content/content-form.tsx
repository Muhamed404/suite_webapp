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
  className,
}: ContentFormProps) {
  const t = useTranslations("content");
  const { dir } = useI18n();
  const _isRtl = dir === "rtl";

  const updateTranslation = useCallback(
    (updater: (prev: ContentTranslation) => ContentTranslation) => {
      onTranslationChange(updater(translation));
    },
    [translation, onTranslationChange],
  );

  if (!contentType) {
    return (
      <div className={clsx("space-y-4", className)}>
        <p className="text-sm text-[var(--darkgray)]">{t("selectContentType")}</p>
      </div>
    );
  }

  const inputWrapper =
    "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-5";
  const textareaWrapper =
    "rounded-2xl bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-5 py-3 min-h-0";
  const selectTrigger =
    "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 text-[14px] px-5";

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Language Selector */}
      <div>
        <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
          {t("selectLanguage")}
        </label>
        <Select
          classNames={{ trigger: selectTrigger }}
          selectedKeys={[language]}
          onSelectionChange={(keys) => {
            const v =
              keys === "all" || !keys
                ? "en"
                : ((Array.from(keys as Iterable<string>)[0] as ModuleLocale) ??
                  "en");

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

      {/* Title */}
      <div>
        <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
          {t("contentTitle")}
        </label>
        <Input
          classNames={{
            base: "w-full",
            input: "text-[14px]",
            inputWrapper,
          }}
          placeholder={t("titlePlaceholder")}
          value={translation.title}
          onValueChange={(value) =>
            updateTranslation((prev) => ({ ...prev, title: value }))
          }
        />
      </div>

      {showDescription && (
        <div>
          <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
            {t("description")}
          </label>
          <Textarea
            classNames={{
              base: "w-full",
              input: "text-[14px]",
              inputWrapper: textareaWrapper,
            }}
            minRows={3}
            placeholder={t("descriptionPlaceholder")}
            value={translation.content ?? ""}
            onValueChange={(value) =>
              updateTranslation((prev) => ({ ...prev, content: value }))
            }
          />
        </div>
      )}
    </div>
  );
}
