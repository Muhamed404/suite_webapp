"use client";

import type { QuizAnswer } from "./quiz-answer-row";

import { useState, useRef } from "react";
import Image from "next/image";
import clsx from "clsx";

import { QuizAnswerRow } from "./quiz-answer-row";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getLanguageName, getLanguageCountryCode } from "@/utils/supportedLanguages";
import { useAuthStore } from "@/hooks/useAuthStore";
import ReactCountryFlag from "react-country-flag";
import { Textarea } from "@heroui/input";

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
  lang?: QuizLocale;
  /** When set, display uses getLanguageName(langId) and getLanguageFlag(langId) from supportedLanguages */
  langId?: number;
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
  /** When false, hides the "Add New Question" button (e.g. on quiz creation). Default true. */
  allowAddQuestion?: boolean;
  contentId?: number;
  moduleId?: number;
  quizTypeId?: number;
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
  allowAddQuestion = true,
  contentId,
  quizTypeId,
}: QuizLanguageCardProps) {
  const t = useTranslations("quiz");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { token, user } = useAuthStore();

  const meta = form.langId != null ? null : LANG_META[form.lang ?? "en"];
  const langLabel =
    form.langId != null ? getLanguageName(form.langId) : meta ? t(meta.labelKey) : "";


  const singleCorrect = quizType === "single" || quizType === "truefalse";
  const isMultiple = quizType === "multiple";

  // CSV Upload State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [csvMessage, setCsvMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile || !contentId || !quizTypeId) return;

    setCsvStatus("uploading");
    const formData = new FormData();

    formData.append("file", csvFile);
    formData.append("con_id", contentId.toString());
    formData.append("qtype_id", quizTypeId.toString());

    // Optional org_id if needed, defaulting to user's org
    if (user?.organization_id) {
      formData.append("org_id", user.organization_id.toString());
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AWARE_MAGNUS_API_URL}/api/awm/quiz/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type is set automatically by browser for FormData
          },
          body: formData,
        }
      );

      const result = await res.json();

      if (res.ok) {
        setCsvStatus("success");
        setCsvMessage(result.message || t("importStarted"));
        setTimeout(() => setShowCsvModal(false), 2000);
      } else {
        setCsvStatus("error");
        setCsvMessage(result.message || t("importFailed"));
      }
    } catch (error) {
      console.error("CSV Upload failed", error);
      setCsvStatus("error");
      setCsvMessage(t("networkError"));
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl px-4 py-3 relative border border-gray-100 shadow-sm language-card">
        {/* Remove Card Button */}
        <button
          aria-label="Remove language"
          className={clsx(
            "absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full",
            "border border-red-300 text-red-400 hover:text-red-600 hover:border-red-500 hover:bg-red-50 transition remove-lang"
          )}
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
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        {/* Language Header */}
        <div className="flex items-center justify-between gap-1.5 mb-3 pb-2 pr-8 border-b border-gray-100">
          <div className="flex flex-row items-center gap-1.5">
            <span className="lang-icon w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
              <ReactCountryFlag
                className="w-full h-full object-cover"
                countryCode={
                  form.langId != null
                    ? getLanguageCountryCode(form.langId)
                    : form.lang === "ar"
                      ? "SA"
                      : "US"
                }
                style={{
                  fontSize: "1.5em",
                  lineHeight: "1.5em",
                }}
                svg
                title={langLabel}
              />
            </span>
            <p className="lang-title text-[10px] font-semibold text-gray-900">{langLabel}</p>
          </div>
        </div>

        {/* CSV Upload Button */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-500 mb-1">{t("uploadCsvHelper")}</p>
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-[#3FBDFF] rounded-lg text-xs font-medium text-[#3FBDFF] bg-[#E8F5FF] hover:bg-[#D0ECFF] transition group w-full"
            type="button"
            onClick={() => setShowCsvModal(true)}
          >
            <svg
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span>{t("uploadCsvExcel")}</span>
          </button>

          {csvStatus === "success" && (
            <div className="mt-2 text-[10px] text-green-600 font-medium">✅ {csvMessage}</div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400 font-medium">{t("or")}</span>
          </div>
        </div>

        {/* Form Section */}
        <div className="form-section space-y-6">
          {form.questions.map((q, qIndex) => {
            const correctAnswerId = q.answers.find((a) => a.correct)?.id;
            const canRemoveQuestion = form.questions.length > 1;

            const handleTextChange = (id: string) => (text: string) => {
              const next = q.answers.map((a) => (a.id === id ? { ...a, text } : a));

              onAnswersChange(qIndex, next);
            };

            const handleCorrectChange = (id: string) => (correct: boolean) => {
              // If already correct and single choice, don't allow unchecking by clicking again (radio behavior) - handled in UI but safety check here
              const next = q.answers.map((a) => {
                if (a.id === id) return { ...a, correct };
                // Uncheck others if single choice
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
              <div key={q.id} className="relative">
                {canRemoveQuestion && (
                  <button
                    className="absolute top-0 right-0 text-[10px] text-red-500 hover:text-red-700 font-medium"
                    type="button"
                    onClick={() => onRemoveQuestion(qIndex)}
                  >
                    {t("removeQuestion")}
                  </button>
                )}
                <p className="text-[10px] text-gray-500 mb-1">
                  {form.questions.length > 1 ? `${t("question")} ${qIndex + 1}` : t("question")}
                </p>
                <Textarea
                  classNames={{
                    input: "text-xs placeholder:text-gray-400",
                    inputWrapper:
                      "border border-gray-200 rounded-lg bg-white data-[hover=true]:bg-white group-data-[focus=true]:border-[#3FBDFF] group-data-[focus=true]:ring-1 group-data-[focus=true]:ring-[#3FBDFF]/10 shadow-none",
                  }}
                  minRows={2}
                  placeholder={t("questionPlaceholder")}
                  value={q.question}
                  onValueChange={(val) => onQuestionChange(qIndex, val)}
                />

                <p className="text-[10px] text-gray-500 mt-2 mb-1">{t("answer")}</p>
                <div className="answers space-y-1.5">
                  {q.answers.map((a) => (
                    <QuizAnswerRow
                      key={a.id}
                      answer={a}
                      correctDisabled={
                        singleCorrect && !!correctAnswerId && a.id !== correctAnswerId && !a.correct
                      }
                      isMultiple={isMultiple}
                      onCorrectChange={handleCorrectChange(a.id)}
                      onRemove={handleRemoveAnswer(a.id)}
                      onTextChange={handleTextChange(a.id)}
                    />
                  ))}
                </div>

                {quizType !== "truefalse" && (
                  <button
                    className="add-answer text-[#3FBDFF] text-[10px] font-medium flex items-center gap-1 py-1 rounded-full mt-2 hover:bg-[#EAF8FF] px-2 w-fit transition-colors"
                    type="button"
                    onClick={() => onAddAnswer(qIndex)}
                  >
                    <svg
                      fill="none"
                      height="12"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="12"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                    {t("addNewAnswer")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Question Button inside the Language "Section" in logic, but UI-wise usually below questions */}
      {allowAddQuestion && (
        <div className="flex justify-center add-same-lang-wrap mt-3">
          <button
            className="add-same-lang flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3FBDFF] text-[#3FBDFF] text-[10px] hover:bg-[#D0ECFF] transition font-medium"
            type="button"
            onClick={onAddQuestion}
          >
            <svg
              fill="none"
              height="12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <div>
              {t("addOneMoreQuiz")} - {langLabel}
            </div>
          </button>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 relative animate-fade-in">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              type="button"
              onClick={() => setShowCsvModal(false)}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{t("uploadCsvExcel")}</h3>
              <p className="text-xs text-gray-500">{t("importCsvHelper")}</p>
            </div>

            {/* Upload Area */}
            <div className="mb-4">
              <label className="block w-full cursor-pointer">
                <input
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  type="file"
                  onChange={handleCsvFileChange}
                />
                <div
                  className={clsx(
                    "border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#3FBDFF] hover:bg-[#F0F9FF] transition",
                    csvFile && "border-[#3FBDFF] bg-[#F0F9FF]"
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#E8F5FF] flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[#3FBDFF]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-0.5">
                        {csvFile ? csvFile.name : t("clickToUpload")}
                      </p>
                      <p className="text-xs text-gray-500">{t("csvExcelOnly")}</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Download Demo (Optional) - could add a link here if we have a demo file */}

            {/* Error Message */}
            {csvStatus === "error" && <p className="text-xs text-red-500 mb-4">{csvMessage}</p>}

            {/* Actions */}
            <div className="flex gap-2 justify-end mt-6">
              <button
                className="px-4 py-2 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                type="button"
                onClick={() => setShowCsvModal(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="px-4 py-2 rounded-full bg-[#3FBDFF] text-white text-xs font-medium hover:bg-[#29AAE8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!csvFile || csvStatus === "uploading"}
                type="button"
                onClick={handleUploadCsv}
              >
                {csvStatus === "uploading" ? t("uploading") : t("confirmUpload")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { generateId, generateQuestionId };
