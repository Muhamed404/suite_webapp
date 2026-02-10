"use client";

import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

export type QuizCardType = "single" | "multiple" | "truefalse";

interface QuizTypeSelectorPillsProps {
  value: QuizCardType;
  onChange: (value: QuizCardType) => void;
  className?: string;
}

export function QuizTypeSelectorPills({ value, onChange, className }: QuizTypeSelectorPillsProps) {
  const t = useTranslations("quiz");

  const options: { type: QuizCardType; labelKey: string }[] = [
    { type: "single", labelKey: "quizTypes.single" },
    { type: "multiple", labelKey: "quizTypes.multiple" },
    { type: "truefalse", labelKey: "quizTypes.trueFalse" },
  ];

  return (
    <div className={clsx("flex flex-col", className)}>
      <p className="text-[10px] font-medium mb-1 text-gray-900">{t("selectQuizType")}</p>
      <div className="flex gap-2 text-[10px]">
        {options.map((option) => {
          const isSelected = value === option.type;

          return (
            <label
              key={option.type}
              className={clsx(
                "flex items-center gap-1 p-2 rounded-full border cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-[#3FBDFF] bg-[#EAF6FF]"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              )}
            >
              <input
                checked={isSelected}
                className="hidden"
                name="quizType"
                type="radio"
                value={option.type}
                onChange={() => onChange(option.type)}
              />
              <span
                className={clsx(
                  "w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200",
                  isSelected ? "border-[#3FBDFF] bg-[#EAF6FF]" : "border-gray-300 bg-white"
                )}
              >
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full bg-[#3FBDFF] transition-all duration-200",
                    isSelected ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                />
              </span>
              <span className="text-gray-700 font-medium">{t(option.labelKey)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
