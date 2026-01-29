"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { QuizTypeSelector, type QuizType } from "./quiz-type-selector";
import { QuizLanguageSelector, type QuizLocale } from "./quiz-language-selector";
import {
  QuizLanguageCard,
  generateId,
  generateQuestionId,
  type QuizLanguageForm,
  type QuizQuestion,
} from "./quiz-language-card";
import type { QuizAnswer } from "./quiz-answer-row";
import {
  useModules,
  useContentsByModule,
  useCreateQuiz,
} from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Module, ModuleContent } from "@/types/quiz";

const QUIZ_TYPE_TO_ID: Record<QuizType, number> = {
  single: 1,
  multiple: 2,
  truefalse: 3,
};

function createEmptyAnswer(): QuizAnswer {
  return { id: generateId(), text: "", correct: false };
}

function createEmptyQuestion(): QuizQuestion {
  return {
    id: generateQuestionId(),
    question: "",
    answers: [createEmptyAnswer()],
  };
}

function createLanguageForm(lang: QuizLocale): QuizLanguageForm {
  return {
    lang,
    questions: [createEmptyQuestion()],
  };
}

function moduleName(m: Module): string {
  const t = m.translations?.[0];
  return t?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  const t = c.translations?.[0];
  return t?.title ?? `Content ${c.id}`;
}

export function CreateQuizForm() {
  const t = useTranslations("quiz");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleId, setModuleId] = useState<string>("");
  const [contentId, setContentId] = useState<string>("");
  const [quizType, setQuizType] = useState<QuizType>("single");
  const [language, setLanguage] = useState<QuizLocale>("en");
  const [generated, setGenerated] = useState(false);
  const [languageForms, setLanguageForms] = useState<QuizLanguageForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: modulesRes } = useModules({ status: 1 });
  const modules = modulesRes?.success ? modulesRes.data ?? [] : [];

  const { data: contentsRes } = useContentsByModule(
    moduleId ? Number(moduleId) : 0,
    !!moduleId
  );
  const contents = contentsRes?.success ? contentsRes.data ?? [] : [];

  const createQuiz = useCreateQuiz();

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
    setModuleId(v);
    setContentId("");
  };

  const handleContentChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
    setContentId(v);
  };

  const handleGenerateForm = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);
    const forms = [createLanguageForm(language)];
    setLanguageForms(forms);
    setGenerated(true);
  }, [language]);

  const updateForm = useCallback(
    (index: number, updater: (prev: QuizLanguageForm) => QuizLanguageForm) => {
      setLanguageForms((prev) =>
        prev.map((f, i) => (i === index ? updater(f) : f))
      );
    },
    []
  );

  const removeForm = useCallback((index: number) => {
    setLanguageForms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addAnswer = useCallback(
    (formIndex: number, questionIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: f.questions.map((q, i) =>
          i === questionIndex
            ? { ...q, answers: [...q.answers, createEmptyAnswer()] }
            : q
        ),
      }));
    },
    [updateForm]
  );

  const addQuestion = useCallback(
    (formIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: [...f.questions, createEmptyQuestion()],
      }));
    },
    [updateForm]
  );

  const removeQuestion = useCallback(
    (formIndex: number, questionIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: f.questions.filter((_, i) => i !== questionIndex),
      }));
    },
    [updateForm]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!generated || languageForms.length === 0) return;
    const modContentId = contentId ? Number(contentId) : 0;
    if (!modContentId) {
      setFormError(t("selectContent") + " " + (t("contentPlaceholder") ?? ""));
      return;
    }

    const quizTypeId = QUIZ_TYPE_TO_ID[quizType];
    const form = languageForms[0]!;
    const questions = form.questions;

    const validQuestions = questions.filter((q) => {
      const answers = q.answers.filter((a) => a.text.trim() !== "");
      return answers.length > 0 && answers.some((a) => a.correct);
    });
    if (validQuestions.length === 0) {
      setFormError(t("validationQuestionAnswers"));
      return;
    }

    try {
      for (const q of validQuestions) {
        const answers = q.answers
          .filter((a) => a.text.trim() !== "")
          .map((a, i) => ({
            answer_text: a.text.trim(),
            is_correct: a.correct,
            order: i + 1,
          }));
        await createQuiz.mutateAsync({
          quiz: {
            mod_content_id: modContentId,
            quiz_type_id: quizTypeId,
            question: q.question.trim() || "Untitled question",
            difficulty: 1,
            time_limit: 60,
          },
          answers,
        });
      }
      setFormSuccess(t("createSuccess"));
    } catch (err) {
      const msg = getApiErrorMessage(err, tCommon, {
        defaultKey: "errors.unknown",
        defaultValue: t("createError"),
      });
      setFormError(msg);
    }
  };

  const handleCancel = () => {
    setGenerated(false);
    setLanguageForms([]);
    setFormError(null);
    setFormSuccess(null);
  };

  const canGenerate = !!contentId;
  const isSubmitting = createQuiz.isPending;

  return (
    <div className={clsx("p-6", isRtl && "text-right")}>
      <Link
        href="/dashboard/quiz"
        className="text-sm text-[#3FBDFF] hover:underline mb-3 inline-block"
      >
        {t("backToQuizzes")}
      </Link>
      <div className="text-sm text-gray-500 mb-2">
        {t("breadcrumbPrefix")}
        <span className="text-gray-900 font-semibold">{t("breadcrumbCurrent")}</span>
      </div>
      <h2 className="text-2xl font-semibold text-[var(--mainblue)]">{t("title")}</h2>
      <p className="text-sm text-gray-500 mb-4">{t("subtitle")}</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-sm font-medium text-gray-900 mb-2">{t("selectModule")}</p>
        <Select
          placeholder={t("modulePlaceholder")}
          selectedKeys={moduleId ? [moduleId] : []}
          onSelectionChange={handleModuleChange}
          classNames={{
            trigger: "h-10 min-h-10 rounded-lg border border-gray-300",
          }}
        >
          {modules.map((m) => (
            <SelectItem key={String(m.id)} textValue={moduleName(m)}>
              {moduleName(m)}
            </SelectItem>
          ))}
        </Select>

        <p className="text-sm font-medium text-gray-900 mt-4 mb-2">
          {t("selectContent")}
        </p>
        <Select
          placeholder={t("contentPlaceholder")}
          selectedKeys={contentId ? [contentId] : []}
          onSelectionChange={handleContentChange}
          isDisabled={!moduleId}
          classNames={{
            trigger: "h-10 min-h-10 rounded-lg border border-gray-300",
          }}
        >
          {contents.map((c) => (
            <SelectItem key={String(c.id)} textValue={contentTitle(c)}>
              {contentTitle(c)}
            </SelectItem>
          ))}
        </Select>

        <QuizTypeSelector
          value={quizType}
          onChange={setQuizType}
          className="mt-4"
        />
        <QuizLanguageSelector
          value={language}
          onChange={setLanguage}
          className="mt-4"
        />
        <div className="mt-4 flex justify-end">
          <Button
            onPress={handleGenerateForm}
            isDisabled={!canGenerate}
            className="px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8] disabled:opacity-50"
          >
            {t("generateForm")}
          </Button>
        </div>
      </div>

      <form id="quizForm" onSubmit={handleSubmit}>
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
        <div id="languageForms" className="space-y-3">
          {generated &&
            languageForms.map((form, formIndex) => (
              <QuizLanguageCard
                key={form.lang}
                form={form}
                quizType={quizType}
                onQuestionChange={(qIndex, question) =>
                  updateForm(formIndex, (f) => ({
                    ...f,
                    questions: f.questions.map((q, i) =>
                      i === qIndex ? { ...q, question } : q
                    ),
                  }))
                }
                onAnswersChange={(qIndex, answers) =>
                  updateForm(formIndex, (f) => ({
                    ...f,
                    questions: f.questions.map((q, i) =>
                      i === qIndex ? { ...q, answers } : q
                    ),
                  }))
                }
                onRemove={() => removeForm(formIndex)}
                onAddAnswer={(qIndex) => addAnswer(formIndex, qIndex)}
                onAddQuestion={() => addQuestion(formIndex)}
                onRemoveQuestion={(qIndex) =>
                  removeQuestion(formIndex, qIndex)
                }
              />
            ))}
        </div>

        {generated && languageForms.length > 0 && (
          <div
            className={clsx(
              "flex justify-end gap-3 mt-4",
              isRtl && "flex-row-reverse"
            )}
          >
            <Button
              type="button"
              variant="bordered"
              onPress={handleCancel}
              isDisabled={isSubmitting}
              className="px-6 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
            >
              {isSubmitting ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
