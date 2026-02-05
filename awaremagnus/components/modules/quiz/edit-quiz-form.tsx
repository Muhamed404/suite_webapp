"use client";

import type { QuizAnswer } from "./quiz-answer-row";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import clsx from "clsx";

import {
  QuizTypeSelectorApi,
  apiQuizTypeIdToCardType,
} from "./quiz-type-selector-api";
import {
  QuizLanguageCard,
  generateId,
  generateQuestionId,
  type QuizLanguageForm,
  type QuizQuestion,
} from "./quiz-language-card";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useQuiz, useQuizAnswers, useUpdateQuiz } from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";

function mapApiAnswersToForm(
  answers: Array<{
    id?: number;
    answer_text?: string;
    is_correct?: boolean;
    answer?: string;
    validity?: boolean;
  }>,
): QuizAnswer[] {
  if (!answers?.length) return [{ id: generateId(), text: "", correct: false }];
  return answers.map((a, i) => ({
    id: String(a.id ?? i),
    text: (a.answer_text ?? (a as { answer?: string }).answer ?? "").trim(),
    correct: (a as { is_correct?: boolean }).is_correct ?? !!((a as { validity?: boolean }).validity),
  }));
}

export interface EditQuizFormProps {
  quizId: number;
  initialModuleId?: string;
  returnHref?: string;
}

export function EditQuizForm({
  quizId,
  initialModuleId = "",
  returnHref = "/dashboard/quiz",
}: EditQuizFormProps) {
  const t = useTranslations("quiz");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const { data: quizRes, isLoading: quizLoading } = useQuiz(quizId, !!quizId);
  const { data: answersRes, isLoading: answersLoading } = useQuizAnswers(quizId, !!quizId);
  const updateQuiz = useUpdateQuiz();

  const quiz = quizRes?.success ? quizRes.data : null;
  const apiAnswers = answersRes?.success ? (answersRes.data ?? []) : [];

  const [selectedQuizTypeId, setSelectedQuizTypeId] = useState<number>(2);
  const [languageForms, setLanguageForms] = useState<QuizLanguageForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!quiz || hasInitialized) return;
    // Wait for answers to load so we can pre-fill; if answers API is slow, fall back to quiz.answers from getQuizById
    if (answersLoading && !(quiz.answers?.length)) return;
    setHasInitialized(true);
    setSelectedQuizTypeId(quiz.quiz_type_id ?? 2);
    const answersSource =
      apiAnswers.length > 0 ? apiAnswers : (quiz.answers ?? []);
    const answers = mapApiAnswersToForm(answersSource);
    const question: QuizQuestion = {
      id: generateQuestionId(),
      question: quiz.question ?? "",
      answers: answers.length > 0 ? answers : [{ id: generateId(), text: "", correct: false }],
    };
    setLanguageForms([
      {
        langId: 1,
        questions: [question],
      },
    ]);
  }, [quiz, answersLoading, apiAnswers, hasInitialized]);

  const updateForm = useCallback(
    (index: number, updater: (prev: QuizLanguageForm) => QuizLanguageForm) => {
      setLanguageForms((prev) => prev.map((f, i) => (i === index ? updater(f) : f)));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (languageForms.length === 0) return;
    const form = languageForms[0];
    if (!form?.questions.length) return;
    const q = form.questions[0]!;
    const questionText = q.question.trim() || "Untitled question";

    try {
      await updateQuiz.mutateAsync({
        id: quizId,
        payload: {
          question: questionText,
          quiz_type_id: selectedQuizTypeId,
        },
      });
      setFormSuccess(t("updateSuccess") ?? t("createSuccess"));
    } catch (err) {
      const msg = getApiErrorMessage(err, tCommon, {
        defaultKey: "errors.unknown",
        defaultValue: t("createError"),
      });
      setFormError(msg);
    }
  };

  const addAnswer = useCallback(
    (formIndex: number, questionIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: f.questions.map((q, i) =>
          i === questionIndex
            ? { ...q, answers: [...q.answers, { id: generateId(), text: "", correct: false }] }
            : q,
        ),
      }));
    },
    [updateForm],
  );

  const addQuestion = useCallback(
    (formIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: [
          ...f.questions,
          {
            id: generateQuestionId(),
            question: "",
            answers: [{ id: generateId(), text: "", correct: false }],
          },
        ],
      }));
    },
    [updateForm],
  );

  const removeQuestion = useCallback(
    (formIndex: number, questionIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: f.questions.filter((_, i) => i !== questionIndex),
      }));
    },
    [updateForm],
  );

  const removeForm = useCallback(
    (index: number) => {
      setLanguageForms((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  const isLoading = quizLoading || answersLoading;
  const isSubmitting = updateQuiz.isPending;

  if (isLoading && !quiz) {
    return (
      <div className={clsx("p-6", isRtl && "text-right")}>
        <div className="animate-pulse rounded-2xl border border-[var(--strokeGray)] bg-[var(--gray)]/20 h-64" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={clsx("p-6", isRtl && "text-right")}>
        <p className="text-[var(--darkgray)] mb-3">{t("quizNotFound") ?? "Quiz not found."}</p>
        <Button as={Link} href={returnHref} radius="full" size="sm" variant="flat">
          {t("backToQuizzes")}
        </Button>
      </div>
    );
  }

  return (
    <div className={clsx("p-6", isRtl && "text-right")}>
      <Link
        className="text-sm text-[var(--blue)] hover:underline mb-3 inline-block font-medium"
        href={returnHref}
      >
        {t("backToQuizzes")}
      </Link>
      <div className="text-sm text-[var(--darkgray)] mb-2">
        {t("breadcrumbPrefix")}
        <span className="text-[var(--mainblue)] font-semibold">
          {t("editQuiz") ?? "Edit Quiz"}
        </span>
      </div>
      <h2 className="text-2xl font-semibold text-[var(--mainblue)]">
        {t("editQuiz") ?? "Edit Quiz"}
      </h2>
      <p className="text-sm text-[var(--darkgray)] mb-5 mt-1">
        {t("editQuizSubtitle") ?? "Update the question and answers below."}
      </p>

      <form id="quizEditForm" onSubmit={handleSubmit}>
        {formError && (
          <p className="text-sm text-red-500 mb-3" role="alert">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="text-sm text-green-600 mb-3" role="status">
            {formSuccess}
          </p>
        )}

        <div className="bg-white border border-[var(--strokeGray)] rounded-2xl p-5 mb-5 shadow-none">
          <QuizTypeSelectorApi
            className="mb-4"
            value={selectedQuizTypeId}
            onChange={setSelectedQuizTypeId}
          />
        </div>

        <div className="space-y-3" id="languageForms">
          {languageForms.map((form, formIndex) => (
            <QuizLanguageCard
              key={String(form.langId ?? form.lang ?? formIndex)}
              form={form}
              quizType={apiQuizTypeIdToCardType(selectedQuizTypeId)}
              onAddAnswer={(qIndex) => addAnswer(formIndex, qIndex)}
              onAddQuestion={() => addQuestion(formIndex)}
              onAnswersChange={(qIndex, answers) =>
                updateForm(formIndex, (f) => ({
                  ...f,
                  questions: f.questions.map((q, i) =>
                    i === qIndex ? { ...q, answers } : q,
                  ),
                }))
              }
              onQuestionChange={(qIndex, question) =>
                updateForm(formIndex, (f) => ({
                  ...f,
                  questions: f.questions.map((q, i) =>
                    i === qIndex ? { ...q, question } : q,
                  ),
                }))
              }
              onRemove={languageForms.length > 1 ? () => removeForm(formIndex) : () => {}}
              onRemoveQuestion={(qIndex) => removeQuestion(formIndex, qIndex)}
            />
          ))}
        </div>

        {languageForms.length > 0 && (
          <div
            className={clsx(
              "flex justify-end gap-3 mt-4",
              isRtl && "flex-row-reverse",
            )}
          >
            <Button
              as={Link}
              href={returnHref}
              className="rounded-full border border-[var(--strokeGray)] text-[var(--mainblue)] font-medium hover:bg-[var(--gray)]"
              isDisabled={isSubmitting}
              radius="full"
              size="md"
              variant="bordered"
            >
              {t("cancel")}
            </Button>
            <Button
              className="rounded-full bg-[var(--blue)] text-white font-medium hover:opacity-90"
              isLoading={isSubmitting}
              radius="full"
              size="md"
              type="submit"
            >
              {isSubmitting ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
