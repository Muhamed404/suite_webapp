"use client";

import type { QuizAnswer } from "./quiz-answer-row";
import type { Module, ModuleContent } from "@/types/quiz";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { QuizTypeSelectorPills, QuizCardType } from "./quiz-type-selector-pills";
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
import { useAuthStore } from "@/hooks/useAuthStore";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  SUPPORTED_LANGUAGES,
  getLanguageCountryCode,
  getLanguageName,
} from "@/utils/supportedLanguages";

function createEmptyAnswer(): QuizAnswer {
  return { id: generateId(), text: "", correct: false };
}

/** Localized "True" / "False" labels per quiz language (matches the language the quiz is authored in,
 *  not the current UI locale). Falls back to English. */
const TRUE_FALSE_LABELS: Record<number, { yes: string; no: string }> = {
  1: { yes: "True", no: "False" }, // English
  2: { yes: "صح", no: "خطأ" }, // Arabic
  3: { yes: "سچ", no: "جھوٹ" }, // Urdu
  4: { yes: "Vrai", no: "Faux" }, // French
  5: { yes: "对", no: "错" }, // Mandarin Chinese
  6: { yes: "Doğru", no: "Yanlış" }, // Turkish
};

function getTrueFalseLabels(langId?: number): { yes: string; no: string } {
  if (langId != null && TRUE_FALSE_LABELS[langId]) return TRUE_FALSE_LABELS[langId]!;

  return TRUE_FALSE_LABELS[1]!;
}

function createDefaultAnswers(type: QuizCardType, langId?: number): QuizAnswer[] {
  if (type === "truefalse") {
    const { yes, no } = getTrueFalseLabels(langId);

    return [
      { id: generateId(), text: yes, correct: true },
      { id: generateId(), text: no, correct: false },
    ];
  }

  return [createEmptyAnswer()];
}

function createDefaultQuestion(type: QuizCardType, langId?: number): QuizQuestion {
  return {
    id: generateQuestionId(),
    question: "",
    answers: createDefaultAnswers(type, langId),
  };
}

function createLanguageFormByLangId(langId: number, type: QuizCardType): QuizLanguageForm {
  return {
    langId,
    questions: [createDefaultQuestion(type, langId)],
  };
}

function moduleName(m?: Module | null): string {
  if (!m) return "";

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
  const router = useRouter();
  const { user } = useAuthStore();

  const [moduleId, setModuleId] = useState<string>(initialModuleId);
  const [languageId, setLanguageId] = useState<string>("");
  const [contentId, setContentId] = useState<string>("");

  useEffect(() => {
    if (initialModuleId) setModuleId(initialModuleId);
  }, [initialModuleId]);

  // Reset content when module or language changes (content list depends on both)
  useEffect(() => {
    setContentId("");
  }, [moduleId, languageId]);

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

  const [languageForm, setLanguageForm] = useState<QuizLanguageForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: modulesRes } = useModules();
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];

  const langIdNumber = languageId ? Number(languageId) : undefined;
  const { data: contentsRes } = useContentsByModule(
    moduleId ? Number(moduleId) : 0,
    moduleId && langIdNumber != null ? { enabled: true, lang_id: langIdNumber } : !!moduleId
  );
  const contents = contentsRes?.success ? (contentsRes.data ?? []) : [];

  const createQuiz = useCreateQuiz();

  // Whenever language changes, regenerate the form for that language using the current quiz type.
  useEffect(() => {
    if (langIdNumber != null) {
      setLanguageForm(createLanguageFormByLangId(langIdNumber, selectedQuizType));
    } else {
      setLanguageForm(null);
    }
    setFormError(null);
    setFormSuccess(null);
    // Intentionally only on language change; quiz-type changes are handled below so that
    // the user does not lose their typed question text every time language is re-selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langIdNumber]);

  // When quiz type changes, reset only the answer rows (preserve question text the user typed).
  // For "truefalse" this seeds the two locked True/False rows; for the others it goes back to
  // a single empty answer row so the previously-entered (and now-irrelevant) options don't leak.
  useEffect(() => {
    setLanguageForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        questions: prev.questions.map((q) => ({
          ...q,
          answers: createDefaultAnswers(selectedQuizType, prev.langId),
        })),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuizType]);

  const generated = !!languageForm;

  const updateForm = useCallback(
    (updater: (prev: QuizLanguageForm) => QuizLanguageForm) => {
      setLanguageForm((prev) => (prev ? updater(prev) : prev));
    },
    []
  );

  const addAnswer = useCallback(
    (questionIndex: number) => {
      updateForm((f) => ({
        ...f,
        questions: f.questions.map((q, i) =>
          i === questionIndex ? { ...q, answers: [...q.answers, createEmptyAnswer()] } : q
        ),
      }));
    },
    [updateForm]
  );

  const addQuestion = useCallback(() => {
    updateForm((f) => ({
      ...f,
      questions: [...f.questions, createDefaultQuestion(selectedQuizType, f.langId)],
    }));
  }, [updateForm, selectedQuizType]);

  const removeQuestion = useCallback(
    (questionIndex: number) => {
      updateForm((f) => ({
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
    if (!languageForm) return;
    const modContentId = contentId ? Number(contentId) : 0;

    if (!modContentId) {
      setFormError(t("selectContent") + " " + (t("contentPlaceholder") ?? ""));

      return;
    }

    const isTrueFalse = selectedQuizType === "truefalse";

    // Validate every question the author has touched. A question is considered "started"
    // when it has any question text or any non-empty answer text. Started questions must
    // pass type-specific validation; truly empty questions are skipped silently.
    const validQuestions: typeof languageForm.questions = [];

    for (let i = 0; i < languageForm.questions.length; i++) {
      const q = languageForm.questions[i]!;
      const number = i + 1;
      const questionText = q.question.trim();
      const filledAnswers = q.answers.filter((a) => a.text.trim() !== "");
      const hasAnyCorrect = q.answers.some((a) => a.correct);

      if (isTrueFalse) {
        // True/False rows are pre-seeded and locked, so the only thing the author has
        // to do is pick which side is correct.
        if (!hasAnyCorrect) {
          setFormError(t("validationQuestionMissingCorrect", { number }));

          return;
        }
        validQuestions.push(q);
        continue;
      }

      const isStarted = questionText !== "" || filledAnswers.length > 0;

      if (!isStarted) continue;

      if (questionText === "") {
        setFormError(t("validationQuestionMissingText", { number }));

        return;
      }

      if (filledAnswers.length === 0) {
        setFormError(t("validationQuestionMissingAnswers", { number }));

        return;
      }

      if (!filledAnswers.some((a) => a.correct)) {
        setFormError(t("validationQuestionMissingCorrect", { number }));

        return;
      }

      validQuestions.push(q);
    }

    if (validQuestions.length === 0) {
      setFormError(t("validationQuestionAnswers"));

      return;
    }

    const selectedQuizTypeId = getTypeIdFromCardType(selectedQuizType);
    const tfLabels = getTrueFalseLabels(languageForm.langId);

    try {
      for (const q of validQuestions) {
        let answers: Array<{ answer: string; validity: boolean }>;

        if (isTrueFalse) {
          // Defensive: always emit both options so the learner sees True AND False, regardless
          // of any prior buggy state. Determine which side the author marked as correct.
          const yesRow = q.answers.find((a) => a.text.trim() === tfLabels.yes);
          const isYesCorrect = yesRow ? yesRow.correct : !!q.answers[0]?.correct;

          answers = [
            { answer: tfLabels.yes, validity: isYesCorrect },
            { answer: tfLabels.no, validity: !isYesCorrect },
          ];
        } else {
          answers = q.answers
            .filter((a) => a.text.trim() !== "")
            .map((a) => ({
              answer: a.text.trim(),
              validity: a.correct,
            }));
        }

        await createQuiz.mutateAsync({
          quiz: {
            con_id: modContentId,
            qtype_id: selectedQuizTypeId,
            question: q.question.trim() || "Untitled question",
            difficulty: 1,
          },
          answers,
        });
      }
      setFormSuccess(t("createSuccess"));

      setTimeout(() => {
        const path =
          user?.role_id && (user.role_id === 1 || user.role_id === 2)
            ? `/dashboard/training-library/system/${moduleId}`
            : `/dashboard/training-library/my/${moduleId}`;

        router.push(path);
      }, 2000);
    } catch (err) {
      const msg = getApiErrorMessage(err, tCommon, {
        defaultKey: "errors.unknown",
        defaultValue: t("createError"),
      });

      setFormError(msg);
    }
  };

  const handleCancel = () => {
    setLanguageForm(
      langIdNumber != null ? createLanguageFormByLangId(langIdNumber, selectedQuizType) : null
    );
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
        <span>{t("breadcrumbAwarenessCampaign") ?? "Awareness Campaign"}</span>
        <span className="mx-1">›</span>
        <span className="text-[var(--mainblue)] font-semibold">
          {moduleId && modules.length > 0
            ? moduleName(modules.find((m) => String(m.id) === moduleId))
            : "Select Module"}
        </span>
        <span className="mx-1">›</span>
        <span className="text-[var(--mainblue)] font-semibold">
          {t("breadcrumbCurrent") ?? "Create Quiz"}
        </span>
      </div>
      <h2 className="text-xl font-bold text-[var(--mainblue)]">{t("title")}</h2>
      <p className="text-xs text-[var(--darkgray)] mb-5 mt-1">{t("subtitle")}</p>

      <div className="bg-white border border-[var(--strokeGray)] rounded-2xl p-6 mb-5 shadow-none">
        {/* Module + Language + Content Selectors (language is required first) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <p className="text-[10px] font-medium text-gray-900 mb-1">
              {t("selectLanguage") ?? "Language"}
            </p>
            <Select
              aria-label="Quiz language"
              className="w-full"
              classNames={{
                trigger:
                  "h-10 min-h-10 rounded-lg bg-white border border-gray-200 data-[hover=true]:bg-white data-[focus=true]:border-[#3FBDFF] transition-colors text-xs px-3 shadow-none",
                value: "text-xs group-data-[has-value=true]:text-gray-900",
              }}
              isDisabled={!moduleId}
              placeholder={t("selectLanguage") ?? "Select language"}
              renderValue={(items) =>
                items.map((item) => {
                  const id = Number(item.key);

                  return (
                    <span key={id} className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full overflow-hidden border border-gray-100 inline-flex items-center justify-center">
                        <ReactCountryFlag
                          svg
                          className="w-full h-full object-cover"
                          cdnUrl="/awm/vendor/flag-icons/flags/4x3/"
                          countryCode={getLanguageCountryCode(id)}
                          style={{ fontSize: "1.4em", lineHeight: "1.4em" }}
                          title={getLanguageName(id)}
                        />
                      </span>
                      <span>{getLanguageName(id)}</span>
                    </span>
                  );
                })
              }
              selectedKeys={languageId ? [languageId] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;

                setLanguageId(v || "");
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} textValue={lang.name}>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full overflow-hidden border border-gray-100 inline-flex items-center justify-center">
                      <ReactCountryFlag
                        svg
                        className="w-full h-full object-cover"
                        cdnUrl="/awm/vendor/flag-icons/flags/4x3/"
                        countryCode={getLanguageCountryCode(lang.id)}
                        style={{ fontSize: "1.4em", lineHeight: "1.4em" }}
                        title={lang.name}
                      />
                    </span>
                    <span className="text-xs">{lang.name}</span>
                  </span>
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
              isDisabled={!moduleId || !languageId}
              placeholder={
                !languageId
                  ? t("selectLanguage") ?? "Select a language first"
                  : t("contentPlaceholder")
              }
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
            {moduleId && languageId && contents.length === 0 && (
              <p className="text-[10px] text-gray-500 mt-1">
                No content available for this module in {getLanguageName(Number(languageId))}.
              </p>
            )}
          </div>
        </div>

        <QuizTypeSelectorPills
          className="mt-4"
          value={selectedQuizType}
          onChange={setSelectedQuizType}
        />
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
          {generated && languageForm && (
            <QuizLanguageCard
              key={String(languageForm.langId ?? "lang-form")}
              allowAddQuestion={true}
              contentId={contentId ? Number(contentId) : undefined}
              form={languageForm}
              moduleId={moduleId ? Number(moduleId) : undefined}
              quizType={selectedQuizType as any}
              quizTypeId={getTypeIdFromCardType(selectedQuizType)}
              onAddAnswer={(qIndex) => addAnswer(qIndex)}
              onAddQuestion={() => addQuestion()}
              onAnswersChange={(qIndex, answers) =>
                updateForm((f) => ({
                  ...f,
                  questions: f.questions.map((q, i) => (i === qIndex ? { ...q, answers } : q)),
                }))
              }
              onQuestionChange={(qIndex, question) =>
                updateForm((f) => ({
                  ...f,
                  questions: f.questions.map((q, i) => (i === qIndex ? { ...q, question } : q)),
                }))
              }
              onRemove={handleCancel}
              onRemoveQuestion={(qIndex) => removeQuestion(qIndex)}
            />
          )}
        </div>

        {generated && languageForm && (
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
