"use client";

import type { SupportedLanguageId } from "@/utils/supportedLanguages";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
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
  Trash2,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useCreateSurveyQuestion } from "@/hooks/useSurvey";
import { useCategories } from "@/hooks/useSuiteAwm";
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS } from "@/utils/supportedLanguages";

const STEPS = [
  { id: 1, label: "Question Type", icon: ClipboardList },
  { id: 2, label: "Add Question", icon: FileText },
  { id: 3, label: "Add Answers", icon: HelpCircle },
];

interface AnswerItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

let answerId = 0;

function createAnswer(text = "", isCorrect = false): AnswerItem {
  return { id: `ans_${++answerId}`, text, isCorrect };
}

export function CreateSurveyQuestionForm() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const router = useRouter();
  const createQuestion = useCreateSurveyQuestion();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

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
            setFormError("Please select a category");

            return false;
          }

          return true;
        case 2:
          if (!questionText.trim()) {
            setFormError("Question text is required");

            return false;
          }

          return true;
        case 3:
          if (!isTrueFalse) {
            const validAnswers = answers.filter((a) => a.text.trim());

            if (validAnswers.length < 2) {
              setFormError("At least 2 answers are required");

              return false;
            }
            if (!validAnswers.some((a) => a.isCorrect)) {
              setFormError("At least one answer must be marked as correct");

              return false;
            }
          }

          return true;
        default:
          return true;
      }
    },
    [categoryId, questionText, answers, isTrueFalse]
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

      await createQuestion.mutateAsync({
        question: {
          ques_type_id: quesTypeId,
          category_id: categoryId ? Number(categoryId) : undefined,
          question: questionText.trim(),
        },
        answers: apiAnswers,
      });

      setFormSuccess("Question created successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard/survey/questions"), 1500);
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to create question");
    }
  };

  const isSubmitting = createQuestion.isPending;

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
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold text-gray-900">Create New Quiz / Question</h2>
          </div>

          {/* ── Stepper */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.slice(0, totalSteps).map((step, index) => {
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
                    Select Type of Quiz or Question
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Choose the question type and category for your survey question
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Select
                      aria-label="Category"
                      classNames={{
                        base: "w-full max-w-sm",
                        trigger:
                          "h-10 bg-white border border-gray-200 rounded-xl hover:border-gray-300",
                        value: "text-sm",
                      }}
                      placeholder="Select a category"
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
                    Question Type
                  </label>
                  <div className="space-y-3">
                    {[
                      { id: 1, name: "True or False", desc: "Simple true/false question" },
                      { id: 3, name: "Multi Answer", desc: "Multiple correct answers" },
                      { id: 2, name: "Single Answer", desc: "One correct answer" },
                    ].map((qt) => (
                      <button
                        key={qt.id}
                        className={clsx(
                          "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
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
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Add Question</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Enter the question text{isTrueFalse ? " and select the correct answer" : ""}
                </p>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    classNames={{
                      inputWrapper:
                        "bg-white border border-gray-200 rounded-xl hover:border-gray-300 focus-within:!border-blue-500",
                      input: "text-sm",
                    }}
                    minRows={3}
                    placeholder="Enter your question here..."
                    value={questionText}
                    onValueChange={setQuestionText}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Language</label>
                  <Select
                    aria-label="Language"
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
                      Correct Answer
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
                        True
                      </Radio>
                      <Radio classNames={{ label: "text-sm text-gray-700" }} value="false">
                        False
                      </Radio>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Add Answers (Single/Multiple only) */}
            {currentStep === 3 && !isTrueFalse && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Add Answers</h3>
                <p className="text-xs text-gray-500 mb-4">
                  {isSingleChoice
                    ? "Add answer options and select the correct one (radio)"
                    : "Add answer options and check all correct answers (checkbox)"}
                </p>

                <div className="space-y-3">
                  {answers.map((answer, idx) => (
                    <div
                      key={answer.id}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        answer.isCorrect
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white"
                      )}
                    >
                      <span className="text-xs text-gray-400 font-medium w-12 flex-shrink-0">
                        Answer {idx + 1}
                      </span>
                      <Input
                        classNames={{
                          inputWrapper:
                            "h-9 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus-within:!border-blue-500 shadow-none",
                          input: "text-sm",
                        }}
                        placeholder={`Enter answer ${idx + 1}...`}
                        value={answer.text}
                        onValueChange={(v) => updateAnswerText(answer.id, v)}
                      />

                      {/* Valid answer toggle */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSingleChoice ? (
                          <button
                            className={clsx(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              answer.isCorrect ? "border-green-500 bg-green-500" : "border-gray-300"
                            )}
                            type="button"
                            onClick={() => toggleAnswerCorrect(answer.id)}
                          >
                            {answer.isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                          </button>
                        ) : (
                          <Checkbox
                            classNames={{
                              wrapper: "before:border-gray-300",
                            }}
                            isSelected={answer.isCorrect}
                            onValueChange={() => toggleAnswerCorrect(answer.id)}
                          />
                        )}
                        <span className="text-[10px] text-gray-500 w-16">
                          {answer.isCorrect ? "✓ Valid" : "Valid"}
                        </span>
                      </div>

                      {/* Delete */}
                      {answers.length > 2 && (
                        <Button
                          isIconOnly
                          className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          size="sm"
                          variant="light"
                          onPress={() => removeAnswer(answer.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {answers.length < 10 && (
                  <Button
                    className="text-blue-600 bg-blue-50"
                    size="sm"
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    variant="flat"
                    onPress={addAnswer}
                  >
                    Add More Answer
                  </Button>
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
              startContent={<ArrowLeft className="w-4 h-4" />}
              variant="bordered"
              onPress={handleBack}
            >
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                endContent={<ArrowRight className="w-4 h-4" />}
                radius="full"
                onPress={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                className="bg-green-500 hover:bg-green-600 text-white px-8"
                isLoading={isSubmitting}
                radius="full"
                startContent={!isSubmitting && <Check className="w-4 h-4" />}
                onPress={handleSubmit}
              >
                {isSubmitting ? "Creating..." : "Finish"}
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
