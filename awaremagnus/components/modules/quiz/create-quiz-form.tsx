"use client";

import type { QuizAnswer } from "./quiz-answer-row";
import type { Module, ModuleContent } from "@/types/quiz";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import {
  QuizTypeSelectorApi,
  apiQuizTypeIdToCardType,
} from "./quiz-type-selector-api";
import { QuizLanguageSelectorMulti } from "./quiz-language-selector-multi";
import {
  QuizLanguageCard,
  generateId,
  generateQuestionId,
  type QuizLanguageForm,
  type QuizQuestion,
} from "./quiz-language-card";
import { SUPPORTED_LANGUAGES } from "@/utils/supportedLanguages";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import {
  useModules,
  useContentsByModule,
  useCreateQuiz,
  useQuizTypes,
} from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";

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

function createLanguageFormByLangId(langId: number): QuizLanguageForm {
  return {
    langId,
    questions: [createEmptyQuestion()],
  };
}

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? c.translations?.[0]?.title ?? `Content ${c.id}`;
}

export interface CreateQuizFormProps {
  /** Pre-fill module when opened from module context (e.g. Training Library > Module > Quizzes > Create) */
  initialModuleId?: string;
  /** Link for "Back to Quizzes" when in module context */
  returnHref?: string;
}

export function CreateQuizForm({
  initialModuleId = "",
  returnHref = "/dashboard/quiz",
}: CreateQuizFormProps = {}) {
  const t = useTranslations("quiz");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleId, setModuleId] = useState<string>(initialModuleId);
  const [contentId, setContentId] = useState<string>("");

  useEffect(() => {
    if (initialModuleId) setModuleId(initialModuleId);
  }, [initialModuleId]);
  const [selectedQuizTypeId, setSelectedQuizTypeId] = useState<number>(0);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([
    SUPPORTED_LANGUAGES[0]!.id,
  ]);
  const [generated, setGenerated] = useState(false);
  const [languageForms, setLanguageForms] = useState<QuizLanguageForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: modulesRes } = useModules({ status: 1 });
  const { data: quizTypesRes } = useQuizTypes();
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];
  const apiQuizTypes = quizTypesRes?.success ? (quizTypesRes.data ?? []) : [];

  useEffect(() => {
    if (apiQuizTypes.length > 0 && selectedQuizTypeId === 0) {
      setSelectedQuizTypeId(apiQuizTypes[0]!.id);
    }
  }, [apiQuizTypes, selectedQuizTypeId]);

  const { data: contentsRes } = useContentsByModule(
    moduleId ? Number(moduleId) : 0,
    !!moduleId,
  );
  const contents = contentsRes?.success ? (contentsRes.data ?? []) : [];

  const createQuiz = useCreateQuiz();

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

    setModuleId(v);
    setContentId("");
  };

  const handleContentChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

    setContentId(v);
  };

  const handleGenerateForm = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);
    const forms =
      selectedLanguageIds.length > 0
        ? selectedLanguageIds.map(createLanguageFormByLangId)
        : [createLanguageFormByLangId(SUPPORTED_LANGUAGES[0]!.id)];

    setLanguageForms(forms);
    setGenerated(true);
  }, [selectedLanguageIds]);

  const updateForm = useCallback(
    (index: number, updater: (prev: QuizLanguageForm) => QuizLanguageForm) => {
      setLanguageForms((prev) =>
        prev.map((f, i) => (i === index ? updater(f) : f)),
      );
    },
    [],
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
        questions: [...f.questions, createEmptyQuestion()],
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

    let hasValid = false;
    for (const form of languageForms) {
      const validQuestions = form.questions.filter((q) => {
        const answers = q.answers.filter((a) => a.text.trim() !== "");

        return answers.length > 0 && answers.some((a) => a.correct);
      });
      if (validQuestions.length > 0) hasValid = true;
    }

    if (!hasValid) {
      setFormError(t("validationQuestionAnswers"));

      return;
    }

    try {
      for (const form of languageForms) {
        const validQuestions = form.questions.filter((q) => {
          const answers = q.answers.filter((a) => a.text.trim() !== "");

          return answers.length > 0 && answers.some((a) => a.correct);
        });

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
              quiz_type_id: selectedQuizTypeId,
              question: q.question.trim() || "Untitled question",
              difficulty: 1,
              time_limit: 60,
            },
            answers,
          });
        }
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

  const canGenerate =
    !!contentId &&
    selectedLanguageIds.length > 0 &&
    selectedQuizTypeId > 0;
  const isSubmitting = createQuiz.isPending;

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
          {t("breadcrumbCurrent")}
        </span>
      </div>
      <h2 className="text-2xl font-semibold text-[var(--mainblue)]">
        {t("title")}
      </h2>
      <p className="text-sm text-[var(--darkgray)] mb-5 mt-1">{t("subtitle")}</p>

      <div className="bg-white border border-[var(--strokeGray)] rounded-2xl p-5 mb-5 shadow-none">
        <p className="text-sm font-medium text-[var(--mainblue)] mb-2">
          {t("selectModule")}
        </p>
        <Select
          classNames={{
            trigger:
              "rounded-full bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 h-11 min-h-11",
            value: "text-sm",
          }}
          placeholder={t("modulePlaceholder")}
          selectedKeys={moduleId ? [moduleId] : []}
          onSelectionChange={handleModuleChange}
        >
          {modules.map((m) => (
            <SelectItem key={String(m.id)} textValue={moduleName(m)}>
              {moduleName(m)}
            </SelectItem>
          ))}
        </Select>

        <p className="text-sm font-medium text-[var(--mainblue)] mt-4 mb-2">
          {t("selectContent")}
        </p>
        <Select
          classNames={{
            trigger:
              "rounded-full bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 h-11 min-h-11",
            value: "text-sm",
          }}
          isDisabled={!moduleId}
          placeholder={t("contentPlaceholder")}
          selectedKeys={contentId ? [contentId] : []}
          onSelectionChange={handleContentChange}
        >
          {contents.map((c) => (
            <SelectItem key={String(c.id)} textValue={contentTitle(c)}>
              {contentTitle(c)}
            </SelectItem>
          ))}
        </Select>

        <QuizTypeSelectorApi
          className="mt-4"
          value={selectedQuizTypeId}
          onChange={setSelectedQuizTypeId}
        />
        <QuizLanguageSelectorMulti
          className="mt-4"
          value={selectedLanguageIds}
          onChange={setSelectedLanguageIds}
        />
        <div className="mt-4 flex justify-end">
          <Button
            className="rounded-full bg-[var(--blue)] text-white font-medium hover:opacity-90 disabled:opacity-50"
            isDisabled={!canGenerate}
            radius="full"
            size="md"
            onPress={handleGenerateForm}
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
        <div className="space-y-3" id="languageForms">
          {generated &&
            languageForms.map((form, formIndex) => (
              <QuizLanguageCard
                key={String(form.langId ?? form.lang ?? formIndex)}
                form={form}
                quizType={apiQuizTypeIdToCardType(selectedQuizTypeId)}
                onAddAnswer={(qIndex) => addAnswer(formIndex, qIndex)}
                onAddQuestion={() => addQuestion(formIndex)}
                allowAddQuestion={false}
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
                onRemove={() => removeForm(formIndex)}
                onRemoveQuestion={(qIndex) => removeQuestion(formIndex, qIndex)}
              />
            ))}
        </div>

        {generated && languageForms.length > 0 && (
          <div
            className={clsx(
              "flex justify-end gap-3 mt-4",
              isRtl && "flex-row-reverse",
            )}
          >
            <Button
              className="rounded-full border border-[var(--strokeGray)] text-[var(--mainblue)] font-medium hover:bg-[var(--gray)]"
              isDisabled={isSubmitting}
              radius="full"
              size="md"
              type="button"
              variant="bordered"
              onPress={handleCancel}
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
