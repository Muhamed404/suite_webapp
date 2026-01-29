"use client";

import Image from "next/image";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import type { QuizAnswer } from "./quiz-answer-row";
import { QuizAnswerRow } from "./quiz-answer-row";

export type QuizLocale = "en" | "ar";

const LANG_META: Record<QuizLocale, { labelKey: string; flag: string }> = {
  en: { labelKey: "languages.en", flag: "/images/eng.png" },
  ar: { labelKey: "languages.ar", flag: "/images/ar.png" },
};

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export interface QuizLanguageForm {
  lang: QuizLocale;
  questions: QuizQuestion[];
}

interface QuizLanguageCardProps {
  form: QuizLanguageForm;
  quizType: "single" | "multiple" | "truefalse";
  onQuestionChange: (questionIndex: number, question: string) => void;
  onAnswersChange: (questionIndex: number, answers: QuizAnswer[]) => void;
  onRemove: () => void;
  onAddAnswer: (questionIndex: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionIndex: number) => void;
}

function generateId() {
  return `ans-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function QuizLanguageCard({
  form,
  quizType,
  onQuestionChange,
  onAnswersChange,
  onRemove,
  onAddAnswer,
  onAddQuestion,
  onRemoveQuestion,
}: QuizLanguageCardProps) {
  const t = useTranslations("quiz");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const meta = LANG_META[form.lang];
  const singleCorrect = quizType === "single" || quizType === "truefalse";

  return (
    <div
      className={clsx(
        "bg-white border border-gray-200 rounded-xl p-5 relative language-card",
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
        aria-label="Remove language"
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

      <div className="space-y-6">
        {form.questions.map((q, qIndex) => {
          const correctAnswerId = q.answers.find((a) => a.correct)?.id;
          const canRemoveQuestion = form.questions.length > 1;

          const handleTextChange = (id: string) => (text: string) => {
            const next = q.answers.map((a) =>
              a.id === id ? { ...a, text } : a
            );
            onAnswersChange(qIndex, next);
          };

          const handleCorrectChange = (id: string) => (correct: boolean) => {
            const next = q.answers.map((a) => {
              if (a.id === id) return { ...a, correct };
              if (singleCorrect && correct) return { ...a, correct: false };
              return a;
            });
            onAnswersChange(qIndex, next);
          };

          const handleRemoveAnswer = (id: string) => () => {
            const next = q.answers.filter((a) => a.id !== id);
            onAnswersChange(qIndex, next);
          };

          return (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3 relative"
            >
              {canRemoveQuestion && (
                <Button
                  type="button"
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => onRemoveQuestion(qIndex)}
                  className={clsx(
                    "absolute w-5 h-5 min-w-5 min-h-5 flex items-center justify-center rounded-full",
                    "border border-red-200 text-red-400 hover:text-red-600 hover:border-red-400 hover:bg-red-50 transition",
                    isRtl ? "left-2 top-2" : "right-2 top-2"
                  )}
                  aria-label="Remove question"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2.5 h-2.5 stroke-current"
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
              )}

              <p className="text-sm font-medium text-gray-900 mb-1">
                {form.questions.length > 1
                  ? `${t("question")} ${qIndex + 1}`
                  : t("question")}
              </p>
              <Textarea
                value={q.question}
                onValueChange={(v) => onQuestionChange(qIndex, v)}
                placeholder={t("questionPlaceholder")}
                minRows={2}
                classNames={{
                  base: "mb-2",
                  input: "text-sm",
                  inputWrapper:
                    "rounded-lg border border-gray-300 bg-white focus-within:border-[#3FBDFF] px-3 py-2 min-h-0",
                }}
              />

              <p className="text-sm font-medium text-gray-900 mt-2 mb-1">
                {t("answer")}
              </p>
              <div className="answers space-y-2">
                {q.answers.map((a) => (
                  <QuizAnswerRow
                    key={a.id}
                    answer={a}
                    onTextChange={handleTextChange(a.id)}
                    onCorrectChange={handleCorrectChange(a.id)}
                    onRemove={handleRemoveAnswer(a.id)}
                    correctDisabled={
                      singleCorrect &&
                      !!correctAnswerId &&
                      a.id !== correctAnswerId
                    }
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="light"
                size="sm"
                onPress={() => onAddAnswer(qIndex)}
                className="add-answer text-[#3FBDFF] text-sm font-medium flex items-center gap-2 py-1.5 rounded-full h-auto min-h-0 hover:bg-[#EAF8FF]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                {t("addNewAnswer")}
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="bordered"
        size="sm"
        onPress={onAddQuestion}
        className="add-question mt-4 w-full flex items-center justify-center gap-2 border-dashed border-[#3FBDFF] text-[#3FBDFF] text-sm font-medium py-2.5 rounded-xl hover:bg-[#EAF8FF] hover:border-[#3FBDFF]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        {t("addNewQuestion")}
      </Button>
    </div>
  );
}

export { generateId, generateQuestionId };
