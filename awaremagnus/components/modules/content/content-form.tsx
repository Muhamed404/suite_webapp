"use client";

import { useState, useCallback } from "react";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import type { ContentType } from "./content-type-selector";
import type { ModuleLocale } from "../module/module-language-selector";
import { getLanguageId } from "@/utils/languageMapping";

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
  duration?: number;
  onDurationChange: (duration: number) => void;
  sourceUrl?: string;
  onSourceUrlChange: (url: string) => void;
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
  duration,
  onDurationChange,
  sourceUrl,
  onSourceUrlChange,
  className,
}: ContentFormProps) {
  const t = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const updateTranslation = useCallback(
    (updater: (prev: ContentTranslation) => ContentTranslation) => {
      onTranslationChange(updater(translation));
    },
    [translation, onTranslationChange]
  );

  if (!contentType) {
    return (
      <div className={clsx("space-y-3 text-xs", className)}>
        <p className="text-gray-400">{t("selectContentType")}</p>
      </div>
    );
  }

  const requiresFile = ["iSpring", "PDF", "Video", "Brochure", "Screen Saver", "Poster", "Game"].includes(contentType);
  const requiresUrl = contentType === "Misc" || contentType === "Video";

  return (
    <div className={clsx("space-y-3 text-xs", className)}>
      {/* Language Selector */}
      <div>
        <label className="block text-xs text-gray-600 mb-1.5">{t("selectLanguage")}</label>
        <Select
          selectedKeys={[language]}
          onSelectionChange={(keys) => {
            const v =
              keys === "all" || !keys
                ? "en"
                : (Array.from(keys as Iterable<string>)[0] as ModuleLocale) ?? "en";
            onLanguageChange(v);
          }}
          classNames={{
            trigger: "h-10 min-h-10 rounded-lg border border-gray-200 bg-white text-xs",
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
        <label className="block text-xs text-gray-600 mb-1.5">{t("contentTitle")}</label>
        <Input
          value={translation.title}
          onValueChange={(value) =>
            updateTranslation((prev) => ({ ...prev, title: value }))
          }
          placeholder={t("titlePlaceholder")}
          classNames={{
            base: "w-full",
            input: "text-xs",
            inputWrapper:
              "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
          }}
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-xs text-gray-600 mb-1.5">{t("summary")}</label>
        <Textarea
          value={translation.summary || ""}
          onValueChange={(value) =>
            updateTranslation((prev) => ({ ...prev, summary: value }))
          }
          placeholder={t("summaryPlaceholder")}
          minRows={2}
          classNames={{
            base: "w-full",
            input: "text-xs",
            inputWrapper:
              "rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2 min-h-0",
          }}
        />
      </div>

      {/* Content/Description */}
      <div>
        <label className="block text-xs text-gray-600 mb-1.5">{t("content")}</label>
        <Textarea
          value={translation.content || ""}
          onValueChange={(value) =>
            updateTranslation((prev) => ({ ...prev, content: value }))
          }
          placeholder={t("contentPlaceholder")}
          minRows={4}
          classNames={{
            base: "w-full",
            input: "text-xs",
            inputWrapper:
              "rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2 min-h-0",
          }}
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs text-gray-600 mb-1.5">{t("duration")} (minutes)</label>
        <Input
          type="number"
          value={duration ? String(duration) : ""}
          onValueChange={(value) => onDurationChange(value ? Number(value) : 0)}
          placeholder={t("durationPlaceholder")}
          classNames={{
            base: "w-full",
            input: "text-xs",
            inputWrapper:
              "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
          }}
        />
      </div>

      {/* Source URL (for Misc and optional for Video) */}
      {requiresUrl && (
        <div>
          <label className="block text-xs text-gray-600 mb-1.5">{t("sourceUrl")}</label>
          <Input
            value={sourceUrl || ""}
            onValueChange={onSourceUrlChange}
            placeholder={t("sourceUrlPlaceholder")}
            classNames={{
              base: "w-full",
              input: "text-xs",
              inputWrapper:
                "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
            }}
          />
        </div>
      )}
    </div>
  );
}
