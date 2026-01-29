"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleLocale } from "./module-language-selector";

const LANG_META: Record<ModuleLocale, { labelKey: string; flag: string }> = {
  en: { labelKey: "languages.en", flag: "/images/eng.png" },
  ar: { labelKey: "languages.ar", flag: "/images/ar.png" },
  ur: { labelKey: "languages.ur", flag: "/images/eng.png" }, // TODO: Add proper flags
  zh: { labelKey: "languages.zh", flag: "/images/eng.png" },
  ru: { labelKey: "languages.ru", flag: "/images/eng.png" },
};

export interface ModuleTranslation {
  lang: ModuleLocale;
  name: string;
  description: string;
}

interface ModuleTranslationCardProps {
  translation: ModuleTranslation;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onRemove: () => void;
}

export function ModuleTranslationCard({
  translation,
  onNameChange,
  onDescriptionChange,
  onRemove,
}: ModuleTranslationCardProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const meta = LANG_META[translation.lang];

  return (
    <div
      className={clsx(
        "bg-white border border-gray-200 rounded-xl p-4 relative",
        isRtl && "text-right"
      )}
    >
      <Button
        type="button"
        isIconOnly
        variant="light"
        size="sm"
        onPress={onRemove}
        className={clsx(
          "absolute w-6 h-6 min-w-6 min-h-6 flex items-center justify-center rounded-full",
          "border border-red-300 text-red-400 hover:text-red-600 hover:border-red-500 hover:bg-red-50 transition",
          isRtl ? "left-3 top-3" : "right-3 top-3"
        )}
        aria-label="Remove translation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </Button>

      {/* Language header: flag + name */}
      <div
        className={clsx(
          "flex items-center gap-2 mb-4 p-2 rounded-xl bg-[#F7FAFF] border border-gray-100 w-fit",
          isRtl && "flex-row-reverse"
        )}
      >
        <Image
          src={meta.flag}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
        <span className="text-sm font-semibold text-gray-900">
          {t(meta.labelKey)}
        </span>
      </div>

      <div className="space-y-4">
        {/* Module Name */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium text-xs">
            {t("moduleName")}
          </label>
          <Input
            value={translation.name}
            onValueChange={onNameChange}
            placeholder={t("moduleNamePlaceholder")}
            classNames={{
              base: "w-full",
              input: "text-xs",
              inputWrapper:
                "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
            }}
          />
        </div>

        {/* Module Description */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium text-xs">
            {t("moduleDescription")}
          </label>
          <Textarea
            value={translation.description}
            onValueChange={onDescriptionChange}
            placeholder={t("moduleDescriptionPlaceholder")}
            minRows={3}
            classNames={{
              base: "w-full",
              input: "text-xs",
              inputWrapper:
                "rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2 min-h-0",
            }}
          />
        </div>
      </div>
    </div>
  );
}
