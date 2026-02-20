"use client";

import { Award } from "lucide-react";
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step4")}</span>
      </h2>

      {/* Options */}
      <div>
        <h6 className="text-sm font-medium mb-3">Additional Options</h6>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300">
            <input
              type="checkbox"
              checked={formData.enableQuiz}
              onChange={(e) => onChange("enableQuiz", e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm">{t("form.enableQuiz")}</span>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300">
            <input
              type="checkbox"
              checked={formData.enableCertificate}
              onChange={(e) => onChange("enableCertificate", e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm">{t("form.enableCertificate")}</span>
          </label>
        </div>
      </div>

      {/* Quiz Configuration */}
      {formData.enableQuiz && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h6 className="text-sm font-medium">{t("form.quizConfig")}</h6>
          <p className="text-sm text-gray-600">{t("form.quizDependency")}</p>

          {/* Quiz Dependency */}
          <div className="space-y-2">
            {formData.visualShortVideos && (
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="radio"
                  name="quizDependency"
                  value="short_videos"
                  checked={formData.quizDependency === "short_videos"}
                  onChange={(e) => onChange("quizDependency", e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm">{t("form.quizDepShortVideos")}</span>
              </label>
            )}

            {formData.visualInteractive && (
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="radio"
                  name="quizDependency"
                  value="interactive_videos"
                  checked={formData.quizDependency === "interactive_videos"}
                  onChange={(e) => onChange("quizDependency", e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm">{t("form.quizDepInteractiveVideos")}</span>
              </label>
            )}

            {formData.visualOthers && (
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                <input
                  type="radio"
                  name="quizDependency"
                  value="custom"
                  checked={formData.quizDependency === "custom"}
                  onChange={(e) => onChange("quizDependency", e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm">{t("form.quizDepCustom")}</span>
              </label>
            )}
          </div>

          {/* Quiz Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("form.quizzesPerModule")}</label>
              <input
                type="number"
                value={formData.totalQuizzesPerModule}
                onChange={(e) => onChange("totalQuizzesPerModule", parseInt(e.target.value) || 1)}
                min={1}
                max={getMaxQuizzes()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <small className="text-gray-500 text-xs">1-{getMaxQuizzes()} questions</small>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("form.quizPassingThreshold")}</label>
              <input
                type="number"
                value={formData.quizPassingThreshold}
                onChange={(e) => onChange("quizPassingThreshold", Math.min(100, parseInt(e.target.value) || 0))}
                min={1}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <small className="text-gray-500 text-xs">Passing percentage</small>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("form.quizRetryLimit")}</label>
              <input
                type="number"
                value={formData.quizRetryThreshold}
                onChange={(e) => onChange("quizRetryThreshold", parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <small className="text-gray-500 text-xs">Retry attempts</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
