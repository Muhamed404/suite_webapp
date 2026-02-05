"use client";

import Image from "next/image";
import { RadioGroup, Radio } from "@heroui/radio";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

export type QuizLocale = "en" | "ar";

const LANGUAGES: { value: QuizLocale; key: string; flag: string }[] = [
  { value: "en", key: "languages.en", flag: "/images/eng.png" },
  { value: "ar", key: "languages.ar", flag: "/images/ar.png" },
];

interface QuizLanguageSelectorProps {
  value: QuizLocale;
  onChange: (value: QuizLocale) => void;
  className?: string;
}

export function QuizLanguageSelector({
  value,
  onChange,
  className,
}: QuizLanguageSelectorProps) {
  const t = useTranslations("quiz");

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-900 mb-2">
        {t("selectLanguage")}
      </p>
      <RadioGroup
        classNames={{
          base: "gap-2",
          wrapper: "flex flex-wrap gap-2",
        }}
        orientation="horizontal"
        value={value}
        onValueChange={(v) => onChange(v as QuizLocale)}
      >
        {LANGUAGES.map(({ value: v, key, flag }) => {
          const selected = value === v;

          return (
            <Radio
              key={v}
              classNames={{
                base: clsx(
                  "flex items-center gap-2 px-4 py-2 bg-white rounded-full border cursor-pointer transition m-0 max-w-fit",
                  selected
                    ? "border-[#3FBDFF] bg-[#EAF8FF]"
                    : "border-gray-300 hover:bg-[#f4fbff]",
                ),
                wrapper: "!hidden",
                control: "!hidden",
                labelWrapper: "ml-0",
                label: "text-sm cursor-pointer flex items-center gap-2",
              }}
              value={v}
            >
              <span
                aria-hidden
                className={clsx(
                  "w-4 h-4 rounded-full border flex-shrink-0",
                  selected
                    ? "border-[#3FBDFF] bg-[#3FBDFF]"
                    : "border-gray-300",
                )}
              />
              <Image
                alt=""
                className="w-4 h-4 rounded-full object-cover"
                height={16}
                src={flag}
                width={16}
              />
              {t(key)}
            </Radio>
          );
        })}
      </RadioGroup>
    </div>
  );
}
