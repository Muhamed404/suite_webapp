"use client";

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
  isMultiple?: boolean;
}

export function QuizAnswerRow({
  answer,
  onTextChange,
  onCorrectChange,
  onRemove,
  correctDisabled,
  isMultiple,
}: QuizAnswerRowProps) {
  const t = useTranslations("quiz");

  return (
    <div className="answer flex items-center gap-2.5">
      <input
        className="ansText w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#3FBDFF] focus:ring-1 focus:ring-[#3FBDFF]/10 focus:shadow-[0_0_0_3px_rgba(63,189,255,0.1)] transition-all duration-200 placeholder:text-gray-400"
        placeholder={t("answerPlaceholder")}
        type="text"
        value={answer.text}
        onChange={(e) => onTextChange(e.target.value)}
      />

      <label
        className={clsx(
          "answer-pill flex items-center gap-2 px-2 py-1 border rounded-lg cursor-pointer transition-all duration-200 select-none",
          "hover:bg-[#3FBDFF]/5 hover:border-[#3FBDFF]",
          answer.correct ? "bg-[#EAF6FF] border-[#3FBDFF]" : "bg-white border-gray-300",
          correctDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        style={{ width: "fit-content" }}
      >
        <input
          checked={answer.correct}
          className="correctCheck hidden"
          disabled={correctDisabled}
          type="checkbox"
          onChange={(e) => onCorrectChange(e.target.checked)}
        />

        <span
          className={clsx(
            "radio-btn flex items-center justify-center w-4 h-4 border-2 flex-shrink-0 transition-all duration-200 bg-white",
            isMultiple ? "rounded-sm" : "rounded-full",
            answer.correct ? "border-[#3FBDFF]" : "border-gray-300"
          )}
        >
          {isMultiple ? (
            // Checkbox style tick
            <span
              className={clsx(
                "transform transition-all duration-150",
                answer.correct ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
            >
              <svg
                className="w-2.5 h-2.5 text-[#3FBDFF]"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ) : (
            // Radio style dot
            <span
              className={clsx(
                "radio-dot w-2 h-2 rounded-full bg-[#3FBDFF] transition-all duration-200",
                answer.correct ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )}
            />
          )}
        </span>

        <span className="text-[10px] text-gray-700 font-medium">{t("correct")}</span>
      </label>

      <button
        aria-label="Remove answer"
        className="remove-ans w-5 h-5 flex items-center justify-center rounded-full border border-red-300 text-red-400 text-[9px] hover:bg-red-50 hover:text-red-500 hover:border-red-400 transition-colors duration-200"
        type="button"
        onClick={onRemove}
      >
        <svg
          className="w-2.5 h-2.5 stroke-current"
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
      </button>
    </div>
  );
}
