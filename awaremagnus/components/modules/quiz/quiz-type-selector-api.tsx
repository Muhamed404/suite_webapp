"use client";

import { RadioGroup, Radio } from "@heroui/radio";
import clsx from "clsx";

import type { QuizType as ApiQuizType } from "@/types/quiz";
import { useQuizTypes } from "@/hooks/useQuiz";

interface QuizTypeSelectorApiProps {
  value: number;
  onChange: (quizTypeId: number) => void;
  className?: string;
}

export function QuizTypeSelectorApi({
  value,
  onChange,
  className,
}: QuizTypeSelectorApiProps) {
  const { data: res } = useQuizTypes();
  const types: ApiQuizType[] = res?.success ? (res.data ?? []) : [];

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-900 mb-2">
        Select Quiz Type
      </p>
      <RadioGroup
        classNames={{
          base: "gap-2",
          wrapper: "flex flex-wrap gap-2",
        }}
        orientation="horizontal"
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        {types.map((qt) => {
          const selected = value === qt.id;

          return (
            <Radio
              key={qt.id}
              classNames={{
                base: clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition m-0 max-w-fit",
                  selected
                    ? "border-[#3FBDFF] bg-[#EAF8FF]"
                    : "border-gray-300 hover:bg-[#f4fbff]",
                ),
                wrapper: "!hidden",
                control: "!hidden",
                labelWrapper: "ml-0",
                label: "text-sm cursor-pointer flex items-center gap-2",
              }}
              value={String(qt.id)}
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
              {qt.name ?? `Type ${qt.id}`}
            </Radio>
          );
        })}
      </RadioGroup>
    </div>
  );
}

/** Map API quiz type id to card behavior: single correct (single/truefalse) vs multiple correct */
export function apiQuizTypeIdToCardType(
  quizTypeId: number,
): "single" | "multiple" | "truefalse" {
  switch (quizTypeId) {
    case 1:
      return "truefalse";
    case 2:
      return "single";
    case 3:
      return "multiple";
    default:
      return "single";
  }
}
