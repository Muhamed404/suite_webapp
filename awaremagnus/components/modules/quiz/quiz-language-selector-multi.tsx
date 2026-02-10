"use client";

import { Checkbox } from "@heroui/checkbox";
import clsx from "clsx";

import { SUPPORTED_LANGUAGES, getLanguageFlag } from "@/utils/supportedLanguages";

interface QuizLanguageSelectorMultiProps {
  value: number[];
  onChange: (languageIds: number[]) => void;
  className?: string;
}

export function QuizLanguageSelectorMulti({
  value,
  onChange,
  className,
}: QuizLanguageSelectorMultiProps) {
  const handleToggle = (langId: number) => {
    if (value.includes(langId)) {
      onChange(value.filter((id) => id !== langId));
    } else {
      onChange([...value, langId]);
    }
  };

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-900 mb-2">Select Language(s)</p>
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const selected = value.includes(lang.id);

          return (
            <label
              key={lang.id}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition m-0 max-w-fit",
                selected ? "border-[#3FBDFF] bg-[#EAF8FF]" : "border-gray-300 hover:bg-[#f4fbff]"
              )}
            >
              <Checkbox
                classNames={{
                  base: "m-0 max-w-fit",
                  wrapper: "!hidden",
                  icon: "!hidden",
                  label: "ml-0",
                }}
                isSelected={selected}
                onValueChange={() => handleToggle(lang.id)}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "w-4 h-4 rounded-full flex items-center justify-center transition-colors border flex-shrink-0",
                    selected
                      ? "border-[#3FBDFF] bg-[#3FBDFF] text-white"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {selected && (
                    <svg
                      className="w-2.5 h-2.5"
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
              <span aria-hidden className="text-xl leading-none">
                {getLanguageFlag(lang.id)}
              </span>
              <span className="text-sm">{lang.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
