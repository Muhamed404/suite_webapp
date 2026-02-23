"use client";

import { HelpCircle } from "lucide-react";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

interface WizardStep4Props {
  formData: {
    visualShortVideos: boolean;
    visualInteractive: boolean;
    visualOthers: boolean;
    enableQuiz: boolean;
    enableCertificate: boolean;
    enableGames: boolean;
    enableMiscItems: boolean;
    enableDocuments: boolean;
    quizDependency: "short_videos" | "interactive_videos" | "custom";
    quizPassingThreshold: number;
    quizRetryThreshold: number;
    totalQuizzesPerModule: number;
  };
  onChange: (field: string, value: any) => void;
}

export function WizardStep4({ formData, onChange }: WizardStep4Props) {
  const t = useTranslations("campaigns");

  const getMaxQuizzes = () => {
    if (formData.quizDependency === "short_videos") return 5;
    if (formData.quizDependency === "interactive_videos") return 40;
    return 80;
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <HelpCircle className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-[#051226]">{t("wizard.step4")}</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Options */}
        <div>
          <label className="block font-medium text-gray-600 mb-2 text-sm">Options</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all">
              <div
                onClick={() => onChange("enableQuiz", !formData.enableQuiz)}
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                  formData.enableQuiz ? "bg-blue-500 border-blue-500" : "border-gray-300 group-hover:border-blue-400"
                )}
              >
                {formData.enableQuiz && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-700">{t("form.enableQuiz")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all">
              <div
                onClick={() => onChange("enableCertificate", !formData.enableCertificate)}
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                  formData.enableCertificate ? "bg-blue-500 border-blue-500" : "border-gray-300 group-hover:border-blue-400"
                )}
              >
                {formData.enableCertificate && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-700">{t("form.enableCertificate")}</span>
            </label>
          </div>
        </div>

        {/* Quiz Configuration */}
        {formData.enableQuiz && (
          <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
            <h3 className="text-xs font-semibold text-[#051226] mb-2">{t("form.quizConfig")}</h3>

            {/* Quiz Dependency */}
            <div className="mb-3">
              <label className="block font-medium text-gray-600 mb-3 text-sm">{t("form.quizDependency")}</label>
              <div className="flex flex-wrap gap-4">
                {formData.visualShortVideos && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="quizDependency"
                      value="short_videos"
                      checked={formData.quizDependency === "short_videos"}
                      onChange={(e) => onChange("quizDependency", e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-xs text-gray-700">{t("form.quizDepShortVideos")}</span>
                  </label>
                )}
                {formData.visualInteractive && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="quizDependency"
                      value="interactive_videos"
                      checked={formData.quizDependency === "interactive_videos"}
                      onChange={(e) => onChange("quizDependency", e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-xs text-gray-700">{t("form.quizDepInteractiveVideos")}</span>
                  </label>
                )}
                {formData.visualOthers && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="quizDependency"
                      value="custom"
                      checked={formData.quizDependency === "custom"}
                      onChange={(e) => onChange("quizDependency", e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-xs text-gray-700">{t("form.quizDepCustom")}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="grid grid-cols-3 gap-2">
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">{t("form.quizzesPerModule")}</label>
                <input
                  type="number"
                  value={formData.totalQuizzesPerModule}
                  onChange={(e) => onChange("totalQuizzesPerModule", parseInt(e.target.value) || 1)}
                  min={1}
                  max={getMaxQuizzes()}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">{t("form.quizPassingThreshold")}</label>
                <input
                  type="number"
                  value={formData.quizPassingThreshold}
                  onChange={(e) => onChange("quizPassingThreshold", Math.min(100, parseInt(e.target.value) || 0))}
                  min={1}
                  max={100}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">{t("form.quizRetryLimit")}</label>
                <input
                  type="number"
                  value={formData.quizRetryThreshold}
                  onChange={(e) => onChange("quizRetryThreshold", parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
