"use client";

import type { QuizAnswer } from "./quiz-answer-row";
import type { Module, ModuleContent } from "@/types/quiz";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { QuizTypeSelectorPills, QuizCardType } from "./quiz-type-selector-pills";
import { QuizLanguageSelectorFlags } from "./quiz-language-selector-flags";
import {
  QuizLanguageCard,
  generateId,
  generateQuestionId,
  type QuizLanguageForm,
  type QuizQuestion,
} from "./quiz-language-card";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useModules, useContentsByModule, useCreateQuiz, useQuizTypes } from "@/hooks/useQuiz";
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

  // Quiz Type State
  const [selectedQuizType, setSelectedQuizType] = useState<QuizCardType>("single");

  // Map internal type string to API ID
  const { data: quizTypesRes } = useQuizTypes();
  const apiQuizTypes = quizTypesRes?.success ? (quizTypesRes.data ?? []) : [];

  // Helper to get ID from internal type string
  const getTypeIdFromCardType = (type: QuizCardType): number => {
    // This mapping depends on how the DB seeds types.
    // Usually: 1=Single Choice, 2=Multiple Choice, 3=True/False (or similar)
    // For safety, we try to match by name or fallback to index.
    // Assuming standard order or naming convention in API response.
    // If API types have specific codes/names, map them here.
    // Fallback logic based on common naming:
    const found = apiQuizTypes.find((t) => {
      const name = (t.name ?? "").toLowerCase();

      if (type === "single") return name.includes("single") || name.includes("one");
      if (type === "multiple") return name.includes("multiple") || name.includes("many");
      if (type === "truefalse") return name.includes("true") || name.includes("boolean");

      return false;
    });

    return found ? found.id : (apiQuizTypes[0]?.id ?? 1);
  };

  // Helper to reverse map if needed, but we drive state by UI selection now.

  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([]);
  const [generated, setGenerated] = useState(false);
  const [languageForms, setLanguageForms] = useState<QuizLanguageForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: modulesRes } = useModules({ status: 1 });
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];

  const { data: contentsRes } = useContentsByModule(moduleId ? Number(moduleId) : 0, !!moduleId);
  const contents = contentsRes?.success ? (contentsRes.data ?? []) : [];

  const createQuiz = useCreateQuiz();

  const handleGenerateForm = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);

    if (selectedLanguageIds.length === 0) {
      setFormError(t("selectLanguageError") || "Please select at least one language");

      return;
    }

    const forms = selectedLanguageIds.map(createLanguageFormByLangId);

    setLanguageForms(forms);
    setGenerated(true);
  }, [selectedLanguageIds, t]);

  const updateForm = useCallback(
    (index: number, updater: (prev: QuizLanguageForm) => QuizLanguageForm) => {
      setLanguageForms((prev) => prev.map((f, i) => (i === index ? updater(f) : f)));
    },
    []
  );

  const removeForm = useCallback((index: number) => {
    setLanguageForms((prev) => prev.filter((_, i) => i !== index));
    // Also uncheck the language? Optional, but keeps UI sync
    // For now we keep the selection in pills separate or sync them?
    // Design suggests they might be separate steps.
  }, []);

  const addAnswer = useCallback(
    (formIndex: number, questionIndex: number) => {
      updateForm(formIndex, (f) => ({
        ...f,
        questions: f.questions.map((q, i) =>
          i === questionIndex ? { ...q, answers: [...q.answers, createEmptyAnswer()] } : q
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

    const selectedQuizTypeId = getTypeIdFromCardType(selectedQuizType);

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
              lang_id: form.langId, // Ensure lang_id is passed if API supports it
            },
            answers,
          });
        }
      }
      setFormSuccess(t("createSuccess"));
      // Optional: Clear form or redirect
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

  const isSubmitting = createQuiz.isPending;

  return (
    <div className={clsx("p-6", isRtl && "text-right")}>
      <Link
        className="text-xs text-[var(--blue)] hover:underline mb-3 inline-block font-medium"
        href={returnHref}
      >
        {t("backToQuizzes")}
      </Link>
      <div className="text-xs text-[var(--darkgray)] mb-2">
        {t("breadcrumbPrefix")}
        <span className="text-[var(--mainblue)] font-semibold px-1">/</span>
        <span className="text-[var(--mainblue)] font-semibold">{t("breadcrumbCurrent")}</span>
      </div>
      <h2 className="text-xl font-bold text-[var(--mainblue)]">{t("title")}</h2>
      <p className="text-xs text-[var(--darkgray)] mb-5 mt-1">{t("subtitle")}</p>

      <div className="bg-white border border-[var(--strokeGray)] rounded-2xl p-6 mb-5 shadow-none">
        {/* Module and Content Selectors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-medium text-gray-900 mb-1">{t("selectModule")}</p>
            <Select
              className="w-full"
              classNames={{
                trigger:
                  "h-10 min-h-10 rounded-lg bg-white border border-gray-200 data-[hover=true]:bg-white data-[focus=true]:border-[#3FBDFF] transition-colors text-xs px-3 shadow-none",
                value: "text-xs group-data-[has-value=true]:text-gray-900",
              }}
              placeholder={t("modulePlaceholder")}
              selectedKeys={moduleId ? [moduleId] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;

                setModuleId(v || "");
              }}
            >
              {modules.map((m) => (
                <SelectItem key={m.id} textValue={moduleName(m)}>
                  {moduleName(m)}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-[10px] font-medium text-gray-900 mb-1">{t("selectContent")}</p>
            <Select
              className="w-full"
              classNames={{
                trigger:
                  "h-10 min-h-10 rounded-lg bg-white border border-gray-200 data-[hover=true]:bg-white data-[focus=true]:border-[#3FBDFF] transition-colors text-xs px-3 shadow-none",
                value: "text-xs group-data-[has-value=true]:text-gray-900",
              }}
              isDisabled={!moduleId}
              placeholder={t("contentPlaceholder")}
              selectedKeys={contentId ? [contentId] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;

                setContentId(v || "");
              }}
            >
              {contents.map((c) => (
                <SelectItem key={c.id} textValue={contentTitle(c)}>
                  {contentTitle(c)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <QuizTypeSelectorPills
          className="mt-4"
          value={selectedQuizType}
          onChange={setSelectedQuizType}
        />

        <QuizLanguageSelectorFlags
          className="mt-2"
          value={selectedLanguageIds}
          onChange={setSelectedLanguageIds}
        />

        <div className="mt-6 flex justify-end pb-2 border-b border-gray-100">
          <Button
            className="rounded-full bg-[#3FBDFF] text-white font-medium hover:opacity-90 disabled:opacity-50 text-xs px-6"
            isDisabled={!moduleId || !contentId || selectedLanguageIds.length === 0}
            radius="full"
            size="sm"
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

        <div className="space-y-4" id="languageForms">
          {generated &&
            languageForms.map((form, formIndex) => (
              <QuizLanguageCard
                key={String(form.langId ?? form.lang ?? formIndex)}
                allowAddQuestion={true}
                contentId={contentId ? Number(contentId) : undefined}
                form={form}
                quizType={selectedQuizType as any}
                quizTypeId={getTypeIdFromCardType(selectedQuizType)}
                onAddAnswer={(qIndex) => addAnswer(formIndex, qIndex)}
                onAddQuestion={() => addQuestion(formIndex)}
                onAnswersChange={(qIndex, answers) =>
                  updateForm(formIndex, (f) => ({
                    ...f,
                    questions: f.questions.map((q, i) => (i === qIndex ? { ...q, answers } : q)),
                  }))
                }
                onQuestionChange={(qIndex, question) =>
                  updateForm(formIndex, (f) => ({
                    ...f,
                    questions: f.questions.map((q, i) => (i === qIndex ? { ...q, question } : q)),
                  }))
                }
                onRemove={() => removeForm(formIndex)}
                onRemoveQuestion={(qIndex) => removeQuestion(formIndex, qIndex)}
              />
            ))}
        </div>

        {generated && languageForms.length > 0 && (
          <div className={clsx("flex justify-end gap-3 mt-6", isRtl && "flex-row-reverse")}>
            <Button
              className="rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 text-xs px-6"
              isDisabled={isSubmitting}
              radius="full"
              size="sm"
              type="button"
              variant="bordered"
              onPress={handleCancel}
            >
              {t("cancel")}
            </Button>
            <Button
              className="rounded-full bg-[#3FBDFF] text-white font-medium hover:opacity-90 text-xs px-8"
              isLoading={isSubmitting}
              radius="full"
              size="sm"
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
