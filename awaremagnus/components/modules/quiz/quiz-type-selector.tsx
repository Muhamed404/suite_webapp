"use client";

import { RadioGroup, Radio } from "@heroui/radio";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

export type QuizType = "single" | "multiple" | "truefalse";

interface QuizTypeSelectorProps {
  value: QuizType;
  onChange: (value: QuizType) => void;
  className?: string;
}

const QUIZ_TYPES: { value: QuizType; key: string }[] = [
  { value: "single", key: "quizTypes.single" },
  { value: "multiple", key: "quizTypes.multiple" },
  { value: "truefalse", key: "quizTypes.trueFalse" },
];

export function QuizTypeSelector({ value, onChange, className }: QuizTypeSelectorProps) {
  const t = useTranslations("quiz");

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-900 mb-2">{t("selectQuizType")}</p>
      <RadioGroup
        classNames={{
          base: "gap-2",
          wrapper: "flex flex-wrap gap-2",
        }}
        orientation="horizontal"
        value={value}
        onValueChange={(v) => onChange(v as QuizType)}
      >
        {QUIZ_TYPES.map(({ value: v, key }) => {
          const selected = value === v;

          return (
            <Radio
              key={v}
              classNames={{
                base: clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition m-0 max-w-fit",
                  selected ? "border-[#3FBDFF] bg-[#EAF8FF]" : "border-gray-300 hover:bg-[#f4fbff]"
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
                  selected ? "border-[#3FBDFF] bg-[#3FBDFF]" : "border-gray-300"
                )}
              />
              {t(key)}
            </Radio>
          );
        })}
      </RadioGroup>
    </div>
  );
}
