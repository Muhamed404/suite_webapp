"use client";

import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

export interface QuizAnswer {
  id: string;
  text: string;
  correct: boolean;
}

interface QuizAnswerRowProps {
  answer: QuizAnswer;
  onTextChange: (text: string) => void;
  onCorrectChange: (correct: boolean) => void;
  onRemove: () => void;
  correctDisabled?: boolean;
}

export function QuizAnswerRow({
  answer,
  onTextChange,
  onCorrectChange,
  onRemove,
  correctDisabled,
}: QuizAnswerRowProps) {
  const t = useTranslations("quiz");

  return (
    <div className="answer flex items-center gap-3">
      <Input
        classNames={{
          base: "flex-1 min-w-0",
          input: "text-sm",
          inputWrapper:
            "px-3 py-2 min-h-10 h-10 rounded-lg border border-gray-300 bg-[#F7FAFF] focus-within:border-[#3FBDFF]",
        }}
        placeholder={t("answerPlaceholder")}
        value={answer.text}
        onValueChange={onTextChange}
      />
      <Checkbox
        classNames={{
          base: clsx(
            "answer-pill select-none flex items-center gap-2 px-3 py-2 border rounded-full text-sm cursor-pointer transition m-0 max-w-fit",
            !correctDisabled && "hover:bg-[#f4fbff]",
            answer.correct
              ? "border-[#3FBDFF] bg-[#EAF8FF]"
              : "border-gray-300",
            correctDisabled && "opacity-60 cursor-not-allowed",
          ),
          wrapper: "!hidden",
          icon: "!hidden",
          label: "cursor-pointer flex items-center gap-2 ml-0",
        }}
        isDisabled={correctDisabled}
        isSelected={answer.correct}
        onValueChange={(checked) => onCorrectChange(!!checked)}
      >
        <span
          aria-hidden
          className={clsx(
            "tick flex items-center justify-center w-4 h-4 rounded-full border overflow-hidden flex-shrink-0",
            answer.correct
              ? "border-[#3FBDFF] bg-[#3FBDFF]"
              : "border-gray-300 bg-white",
          )}
        >
          {answer.correct && (
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        {t("correct")}
      </Checkbox>
      <Button
        isIconOnly
        aria-label="Remove answer"
        className="remove-ans w-8 h-10 min-w-8 min-h-10 flex items-center justify-center rounded-full border border-red-300 text-red-400 hover:bg-red-50 hover:border-red-400 transition"
        size="sm"
        type="button"
        variant="light"
        onPress={onRemove}
      >
        <svg
          className="w-3.5 h-3.5 stroke-current"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 12h14" />
        </svg>
      </Button>
    </div>
  );
}
