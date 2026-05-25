"use client";

import type { SupportedLanguageId } from "@/utils/supportedLanguages";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Radio, RadioGroup } from "@heroui/radio";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  HelpCircle,
  Plus,
  Upload,
  Download,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { formatLocaleInteger } from "@/i18n/localeFormat";
import { useCreateSurveyQuestion, useUpdateSurveyQuestion, useImportSurveyQuestions, useSurveyQuestion } from "@/hooks/useSurvey";
import { useCategories } from "@/hooks/useSuiteAwm";
import { useAuthStore } from "@/hooks/useAuthStore";
import { addToast } from "@heroui/toast";
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS } from "@/utils/supportedLanguages";

interface AnswerItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

let answerId = 0;

function createAnswer(text = "", isCorrect = false): AnswerItem {
  return { id: `ans_${++answerId}`, text, isCorrect };
}

export function CreateSurveyQuestionForm({ questionId }: { questionId?: number }) {
  const isEditMode = !!questionId;
  const { dir, locale } = useI18n();
  const t = useTranslations("surveyManagement");
  const isRtl = dir === "rtl";

  const steps = useMemo(
    () => [
      { id: 1, label: t("surveyQuestionForm.step1"), icon: ClipboardList },
      { id: 2, label: t("surveyQuestionForm.step2"), icon: FileText },
      { id: 3, label: t("surveyQuestionForm.step3"), icon: HelpCircle },
    ],
    [t]
  );

  const questionTypeOptions = useMemo(
    () => [
      {
        id: 1,
        name: t("surveyQuestionForm.quizTrueFalseName"),
        desc: t("surveyQuestionForm.quizTrueFalseDesc"),
      },
      {
        id: 3,
        name: t("surveyQuestionForm.quizMultiName"),
        desc: t("surveyQuestionForm.quizMultiDesc"),
      },
      {
        id: 2,
        name: t("surveyQuestionForm.quizSingleName"),
        desc: t("surveyQuestionForm.quizSingleDesc"),
      },
    ],
    [t]
  );
  const router = useRouter();
  const createQuestion = useCreateSurveyQuestion();
  const updateQuestion = useUpdateSurveyQuestion();
  const importQuestions = useImportSurveyQuestions();
  
  // Fetch question if in edit mode
  const { data: existingQuestion, isLoading: loadingQuestion } = useSurveyQuestion(
    questionId!,
    isEditMode
  );

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Step 1: Type Selection
  const [quesTypeId, setQuesTypeId] = useState<number>(2); // default Single Choice
  const [categoryId, setCategoryId] = useState<string>("");

  // Step 2: Question
  const [questionText, setQuestionText] = useState("");
  const [langId, setLangId] = useState<string>("1");

  // Step 2 for True/False
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>("true");

  // Step 3: Answers (only for Single/Multiple)
  const [answers, setAnswers] = useState<AnswerItem[]>([createAnswer(), createAnswer()]);

  // CSV Upload State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [csvMessage, setCsvMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill state if editing
  const [hasPreFilled, setHasPreFilled] = useState(false);

  useEffect(() => {
    if (isEditMode && existingQuestion && !hasPreFilled) {
      setQuesTypeId(existingQuestion.ques_type_id);
      setCategoryId(String(existingQuestion.category_id || ""));
      setQuestionText(existingQuestion.question || "");
      
      if (existingQuestion.answers && existingQuestion.answers.length > 0) {
        if (existingQuestion.ques_type_id === 1) {
          // True/False
          const trueAns = existingQuestion.answers.find(a => a.answer === "True" && a.validity);
          setTrueFalseAnswer(trueAns ? "true" : "false");
        } else {
          // Single/Multiple Choice
          const mappedAnswers = existingQuestion.answers.map(a => ({
            id: `ans_${a.id || Math.random()}`,
            text: a.answer || "",
            isCorrect: !!a.validity
          }));
          setAnswers(mappedAnswers);
        }
      }
      setHasPreFilled(true);
    }
  }, [existingQuestion, isEditMode, hasPreFilled]);

  const isTrueFalse = quesTypeId === 1;
  const isSingleChoice = quesTypeId === 2;
  const isMultipleChoice = quesTypeId === 3;

  // Skip step 3 for True/False since answers are embedded in step 2
  const totalSteps = isTrueFalse ? 2 : 3;

  const validateStep = useCallback(
    (step: number): boolean => {
      setFormError(null);
      switch (step) {
        case 1:
          if (!categoryId) {
            setFormError(t("surveyQuestionForm.errors.categoryRequired"));

            return false;
          }

          return true;
        case 2:
          if (!questionText.trim()) {
            setFormError(t("surveyQuestionForm.errors.questionRequired"));

            return false;
          }

          return true;
        case 3:
          if (!isTrueFalse) {
            const validAnswers = answers.filter((a) => a.text.trim());

            if (validAnswers.length < 2) {
              setFormError(t("surveyQuestionForm.errors.minAnswers"));

              return false;
            }
            if (!validAnswers.some((a) => a.isCorrect)) {
              setFormError(t("surveyQuestionForm.errors.oneCorrect"));

              return false;
            }
          }

          return true;
        default:
          return true;
      }
    },
    [categoryId, questionText, answers, isTrueFalse, t]
  );

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setFormError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const addAnswer = () => {
    if (answers.length < 10) {
      setAnswers([...answers, createAnswer()]);
    }
  };

  const removeAnswer = (id: string) => {
    setAnswers(answers.filter((a) => a.id !== id));
  };

  const updateAnswerText = (id: string, text: string) => {
    setAnswers(answers.map((a) => (a.id === id ? { ...a, text } : a)));
  };

  const toggleAnswerCorrect = (id: string) => {
    if (isSingleChoice) {
      // Radio-like: only one can be correct
      setAnswers(answers.map((a) => ({ ...a, isCorrect: a.id === id })));
    } else {
      // Checkbox: multiple can be correct
      setAnswers(answers.map((a) => (a.id === id ? { ...a, isCorrect: !a.isCorrect } : a)));
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;

    setCsvStatus("uploading");
    const formData = new FormData();
    formData.append("csvFile", csvFile);
    formData.append("ques_type_id", String(quesTypeId));
    if (categoryId) {
      formData.append("category_id", categoryId);
    }
    if (user?.organization_id) {
      formData.append("org_id", user.organization_id.toString());
    }

    try {
      await importQuestions.mutateAsync(formData);
      setCsvStatus("success");
      setCsvMessage(t("surveyQuestionForm.csvSuccessRedirect"));
      setTimeout(() => {
        router.push("/dashboard/survey/questions");
      }, 2000);
    } catch (err: any) {
      setCsvStatus("error");
      setCsvMessage(err?.message ?? t("surveyQuestionForm.csvImportError"));
    }
  };

  const handleDownloadTemplate = () => {
    let headers: string;
    let exampleRow: string;

    if (isTrueFalse) {
      headers = "Question,Category_ID,Answer_1,Validity_1,Answer_2,Validity_2";
      exampleRow = "Is phishing a social engineering attack?,1,True,1,False,0";
    } else {
      headers = "Question,Category_ID,Answer_1,Validity_1,Answer_2,Validity_2,Answer_3,Validity_3,Answer_4,Validity_4";
      exampleRow = "Which of these is a strong password?,1,password123,0,MyP@ssw0rd!,1,12345678,0,qwerty,0";
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + "\n" + exampleRow);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `survey_question_template_${isTrueFalse ? "truefalse" : "choice"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetCsvModal = () => {
    setShowCsvModal(false);
    setCsvFile(null);
    setCsvStatus("idle");
    setCsvMessage("");
  };

  const handleSubmit = async () => {
    const lastStep = isTrueFalse ? 2 : 3;

    if (!validateStep(lastStep)) return;

    setFormError(null);
    setFormSuccess(null);

    try {
      let apiAnswers: Array<{ answer: string; validity: boolean }>;

      if (isTrueFalse) {
        apiAnswers = [
          { answer: "True", validity: trueFalseAnswer === "true" },
          { answer: "False", validity: trueFalseAnswer === "false" },
        ];
      } else {
        apiAnswers = answers
          .filter((a) => a.text.trim())
          .map((a) => ({ answer: a.text.trim(), validity: a.isCorrect }));
      }

      if (isEditMode && questionId) {
        await updateQuestion.mutateAsync({
          id: questionId,
          payload: {
            question: {
              ques_type_id: quesTypeId,
              category_id: categoryId ? Number(categoryId) : undefined,
              question: questionText.trim(),
            },
            answers: apiAnswers,
          },
        });
        setFormSuccess(t("surveyQuestionForm.successUpdate"));
      } else {
        await createQuestion.mutateAsync({
          question: {
            ques_type_id: quesTypeId,
            category_id: categoryId ? Number(categoryId) : undefined,
            question: questionText.trim(),
          },
          answers: apiAnswers,
        });
        setFormSuccess(t("surveyQuestionForm.successCreate"));
      }

      addToast({
        title: isEditMode ? t("surveyQuestionForm.toastUpdatedTitle") : t("surveyQuestionForm.toastCreatedTitle"),
        description: isEditMode
          ? t("surveyQuestionForm.toastUpdatedDesc")
          : t("surveyQuestionForm.toastCreatedDesc"),
        color: "success",
      });

      setTimeout(() => router.push("/dashboard/survey/questions"), 1500);
    } catch (err: any) {
      setFormError(
        err?.message ??
          (isEditMode ? t("surveyQuestionForm.submitErrorUpdate") : t("surveyQuestionForm.submitErrorCreate"))
      );
    }
  };

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  if (isEditMode && loadingQuestion && !hasPreFilled) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Spinner color="primary" label={t("surveyQuestionForm.loading")} />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6 max-w-4xl mx-auto", isRtl && "text-right")}>
          {/* Back */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              isIconOnly
              as={Link}
              className="bg-white border border-gray-200"
              href="/dashboard/survey/questions"
              radius="full"
              size="sm"
              variant="flat"
            >
              <ArrowLeft className={clsx("w-4 h-4", isRtl && "rotate-180")} />
            </Button>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? t("surveyQuestionForm.titleEdit") : t("surveyQuestionForm.titleCreate")}
            </h2>
          </div>

          {/* ── Stepper */}
          <div className="flex items-center justify-center mb-8">
            {steps.slice(0, totalSteps).map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={clsx(
                        "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                        isCompleted && "bg-green-500 text-white shadow-lg shadow-green-500/25",
                        isActive &&
                          "bg-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100",
                        !isCompleted && !isActive && "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={clsx(
                        "text-[10px] mt-1.5 font-medium",
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={clsx(
                        "w-24 h-0.5 mx-3 mt-[-16px] rounded-full transition-all duration-300",
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Messages */}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              {formSuccess}
            </div>
          )}

          {/* ── Step Content */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[340px]">
            {/* STEP 1: Select Type */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {t("surveyQuestionForm.step1Heading")}
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">{t("surveyQuestionForm.step1Intro")}</p>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    {t("surveyQuestionForm.category")} <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Select
                      aria-label={t("surveyQuestionForm.category")}
                      classNames={{
                        base: "w-full max-w-sm",
                        trigger:
                          "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300",
                        value: "text-sm",
                      }}
                      placeholder={t("surveyQuestionForm.categoryPlaceholder")}
                      selectedKeys={categoryId ? [categoryId] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys as Set<string>)[0];

                        if (v) setCategoryId(v);
                      }}
                    >
                      {(categories as any[]).map((cat: any) => (
                        <SelectItem key={String(cat.id)} textValue={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>

                {/* Question Type */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-3 block">
                    {t("surveyQuestionForm.questionType")}
                  </label>
                  <div className="space-y-3">
                    {questionTypeOptions.map((qt) => (
                      <button
                        key={qt.id}
                        className={clsx(
                          "w-full p-4 rounded-xl border-2 text-start transition-all duration-200 flex items-center gap-3",
                          quesTypeId === qt.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                        type="button"
                        onClick={() => setQuesTypeId(qt.id)}
                      >
                        <div
                          className={clsx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            quesTypeId === qt.id ? "border-blue-500" : "border-gray-300"
                          )}
                        >
                          {quesTypeId === qt.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{qt.name}</p>
                          <p className="text-[10px] text-gray-500">{qt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Add Question */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {t("surveyQuestionForm.step2Heading")}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{t("surveyQuestionForm.step2Intro")}</p>

                {/* CSV Upload Button */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">
                    {t("surveyQuestionForm.csvBulkLine")}
                  </p>
                  <button
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-[#3FBDFF] rounded-lg text-xs font-medium text-[#3FBDFF] bg-[#E8F5FF] hover:bg-[#D0ECFF] transition w-full"
                    type="button"
                    onClick={() => setShowCsvModal(true)}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t("surveyQuestionForm.uploadCsvExcel")}</span>
                  </button>

                  {csvStatus === "success" && (
                    <div className="mt-2 text-[10px] text-green-600 font-medium">
                      {csvMessage}
                    </div>
                  )}
                </div>

                {/* Or Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400 font-medium">
                      {t("surveyQuestionForm.or")}
                    </span>
                  </div>
                </div>

                {/* Manual Question Entry */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    {t("surveyQuestionForm.question")} <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    classNames={{
                      inputWrapper:
                        "bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-within:!border-[#3FBDFF] focus-within:!ring-1 focus-within:!ring-[#3FBDFF]/10",
                      input: "text-sm placeholder:text-gray-400",
                    }}
                    minRows={3}
                    placeholder={t("surveyQuestionForm.questionPlaceholder")}
                    value={questionText}
                    onValueChange={setQuestionText}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    {t("surveyQuestionForm.language")}
                  </label>
                  <Select
                    aria-label={t("surveyQuestionForm.language")}
                    classNames={{
                      base: "w-48",
                      trigger:
                        "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300",
                      value: "text-sm",
                    }}
                    selectedKeys={[langId]}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys as Set<string>)[0];

                      if (v) setLangId(v);
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={String(lang.id)} textValue={lang.name}>
                        <span className="flex items-center gap-2">
                          <span>{LANGUAGE_FLAGS[lang.id as SupportedLanguageId]}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* True/False answer selection */}
                {isTrueFalse && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">
                      {t("surveyQuestionForm.correctAnswer")}
                    </label>
                    <RadioGroup
                      classNames={{
                        wrapper: "gap-6",
                      }}
                      orientation="horizontal"
                      value={trueFalseAnswer}
                      onValueChange={setTrueFalseAnswer}
                    >
                      <Radio classNames={{ label: "text-sm text-gray-700" }} value="true">
                        {t("surveyQuestionForm.true")}
                      </Radio>
                      <Radio classNames={{ label: "text-sm text-gray-700" }} value="false">
                        {t("surveyQuestionForm.false")}
                      </Radio>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Add Answers (Single/Multiple only) */}
            {currentStep === 3 && !isTrueFalse && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {t("surveyQuestionForm.step3Heading")}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {isSingleChoice
                    ? t("surveyQuestionForm.step3HelpSingle")
                    : t("surveyQuestionForm.step3HelpMulti")}
                </p>

                <div className="space-y-2">
                  {answers.map((answer, idx) => (
                    <div key={answer.id} className="flex items-center gap-2.5">
                      <input
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#3FBDFF] focus:ring-1 focus:ring-[#3FBDFF]/10 transition-all placeholder:text-gray-400"
                        placeholder={t("surveyQuestionForm.answerPlaceholder", {
                          n: formatLocaleInteger(locale, idx + 1),
                        })}
                        type="text"
                        value={answer.text}
                        onChange={(e) => updateAnswerText(answer.id, e.target.value)}
                      />

                      {/* Correct pill (quiz-style) */}
                      <label
                        className={clsx(
                          "flex items-center gap-2 px-2 py-1 border rounded-lg cursor-pointer transition-all select-none",
                          "hover:bg-[#3FBDFF]/5 hover:border-[#3FBDFF]",
                          answer.isCorrect ? "bg-[#EAF6FF] border-[#3FBDFF]" : "bg-white border-gray-300"
                        )}
                        style={{ width: "fit-content" }}
                      >
                        <input
                          checked={answer.isCorrect}
                          className="hidden"
                          type="checkbox"
                          onChange={() => toggleAnswerCorrect(answer.id)}
                        />
                        <span
                          className={clsx(
                            "flex items-center justify-center w-4 h-4 border-2 flex-shrink-0 transition-all bg-white",
                            isMultipleChoice ? "rounded-sm" : "rounded-full",
                            answer.isCorrect ? "border-[#3FBDFF]" : "border-gray-300"
                          )}
                        >
                          {isMultipleChoice ? (
                            <span
                              className={clsx(
                                "transform transition-all",
                                answer.isCorrect ? "scale-100 opacity-100" : "scale-0 opacity-0"
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
                            <span
                              className={clsx(
                                "w-2 h-2 rounded-full bg-[#3FBDFF] transition-all",
                                answer.isCorrect ? "opacity-100 scale-100" : "opacity-0 scale-0"
                              )}
                            />
                          )}
                        </span>
                        <span className="text-[10px] text-gray-700 font-medium">
                          {t("surveyQuestionForm.correct")}
                        </span>
                      </label>

                      {/* Remove answer */}
                      {answers.length > 2 && (
                        <button
                          className="w-5 h-5 flex items-center justify-center rounded-full border border-red-300 text-red-400 hover:bg-red-50 hover:text-red-500 hover:border-red-400 transition-colors flex-shrink-0"
                          type="button"
                          onClick={() => removeAnswer(answer.id)}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {answers.length < 10 && (
                  <button
                    className="text-[#3FBDFF] text-[10px] font-medium flex items-center gap-1 py-1 rounded-full mt-2 hover:bg-[#EAF8FF] px-2 w-fit transition-colors"
                    type="button"
                    onClick={addAnswer}
                  >
                    <Plus className="w-3 h-3" />
                    {t("surveyQuestionForm.addNewAnswer")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <Button
              className="border-gray-200 text-gray-600 px-6"
              isDisabled={currentStep === 1 || isSubmitting}
              radius="full"
              startContent={
                <ArrowLeft className={clsx("w-4 h-4", isRtl && "rotate-180")} />
              }
              variant="bordered"
              onPress={handleBack}
            >
              {t("surveyQuestionForm.back")}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                endContent={
                  <ArrowRight className={clsx("w-4 h-4", isRtl && "rotate-180")} />
                }
                radius="full"
                onPress={handleNext}
              >
                {t("surveyQuestionForm.next")}
              </Button>
            ) : (
              <Button
                className="bg-green-500 hover:bg-green-600 text-white px-8"
                isLoading={isSubmitting}
                radius="full"
                onPress={handleSubmit}
              >
                {isSubmitting
                  ? isEditMode
                    ? t("surveyQuestionForm.updating")
                    : t("surveyQuestionForm.creating")
                  : isEditMode
                    ? t("surveyQuestionForm.update")
                    : t("surveyQuestionForm.finish")}
              </Button>
            )}
          </div>

          {/* CSV Upload Modal */}
          {showCsvModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 relative">
                {/* Close Button */}
                <button
                  className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                  type="button"
                  onClick={resetCsvModal}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Modal Header */}
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {t("surveyQuestionForm.csvModalTitle")}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{t("surveyQuestionForm.csvModalIntro")}</p>

                  <button
                    className="text-xs text-[#3FBDFF] font-medium hover:underline flex items-center gap-1"
                    type="button"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("surveyQuestionForm.downloadTemplate")}
                  </button>
                </div>

                {/* Upload Area */}
                <div className="mb-4">
                  <label className="block w-full cursor-pointer">
                    <input
                      ref={fileInputRef}
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      type="file"
                      onChange={handleCsvFileChange}
                    />
                    <div
                      className={clsx(
                        "border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#3FBDFF] hover:bg-[#F0F9FF] transition",
                        csvFile && "border-[#3FBDFF] bg-[#F0F9FF]"
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#E8F5FF] flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#3FBDFF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-0.5">
                            {csvFile ? csvFile.name : t("surveyQuestionForm.clickToUpload")}
                          </p>
                          <p className="text-xs text-gray-500">{t("surveyQuestionForm.csvExcelOnly")}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Status Messages */}
                {csvStatus === "error" && (
                  <p className="text-xs text-red-500 mb-4">{csvMessage}</p>
                )}
                {csvStatus === "success" && (
                  <p className="text-xs text-green-600 mb-4">{csvMessage}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    className="px-4 py-2 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    type="button"
                    onClick={resetCsvModal}
                  >
                    {t("surveyQuestionForm.cancel")}
                  </button>
                  <button
                    className="px-4 py-2 rounded-full bg-[#3FBDFF] text-white text-xs font-medium hover:bg-[#29AAE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!csvFile || csvStatus === "uploading"}
                    type="button"
                    onClick={handleUploadCsv}
                  >
                    {csvStatus === "uploading"
                      ? t("surveyQuestionForm.uploading")
                      : t("surveyQuestionForm.confirmUpload")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
