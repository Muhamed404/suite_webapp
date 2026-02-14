"use client";

import { BarChart } from "lucide-react";
import clsx from "clsx";
import { useMemo } from "react";

import { useTranslations } from "@/i18n/useTranslations";

interface WizardStep5Props {
  formData: {
    visualShortVideos: boolean;
    visualInteractive: boolean;
    visualOthers: boolean;
    enableQuiz: boolean;
    enableGames: boolean;
    enableMiscItems: boolean;
    enableDocuments: boolean;
    motionVideoWeight: number;
    interactiveContentWeight: number;
    documentWeight: number;
    gameWeight: number;
    brochureWeight: number;
    posterWeight: number;
    screensaverWeight: number;
    vrGameWeight: number;
    quizProgressWeight: number;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function WizardStep5({ formData, onChange, errors }: WizardStep5Props) {
  const t = useTranslations("campaigns");

  const totalWeight = useMemo(() => {
    let total = 0;

    if (formData.visualShortVideos) total += formData.motionVideoWeight;
    if (formData.visualInteractive) total += formData.interactiveContentWeight;
    if (formData.visualOthers) {
      if (formData.enableDocuments) total += formData.documentWeight;
      if (formData.enableGames) total += formData.gameWeight;
      if (formData.enableMiscItems) {
        total += formData.brochureWeight;
        total += formData.posterWeight;
        total += formData.screensaverWeight;
        total += formData.vrGameWeight;
      }
    }
    if (formData.enableQuiz) total += formData.quizProgressWeight;

    return total;
  }, [formData]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <BarChart className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step5")} <span className="text-red-500">*</span></span>
      </h2>

      {errors.weights && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.weights}
        </div>
      )}

      {/* Others Content Types */}
      {formData.visualOthers && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h6 className="text-sm font-medium mb-3">Other Content Types</h6>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableDocuments}
                onChange={(e) => onChange("enableDocuments", e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm">{t("form.enableDocuments")}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableGames}
                onChange={(e) => onChange("enableGames", e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm">{t("form.enableGames")}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableMiscItems}
                onChange={(e) => onChange("enableMiscItems", e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm">{t("form.enableMiscItems")}</span>
            </label>
          </div>
        </div>
      )}

      {/* Weights */}
      <div>
        <h6 className="text-sm font-medium mb-3">{t("form.contentWeights")} <span className="text-red-500">*</span></h6>
        <div className="space-y-4">
          {formData.visualShortVideos && (
            <div>
              <label className="block text-sm mb-2">{t("form.motionVideoWeight")}</label>
              <input
                type="number"
                value={formData.motionVideoWeight}
                onChange={(e) => onChange("motionVideoWeight", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.visualInteractive && (
            <div>
              <label className="block text-sm mb-2">{t("form.interactiveContentWeight")}</label>
              <input
                type="number"
                value={formData.interactiveContentWeight}
                onChange={(e) => onChange("interactiveContentWeight", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.visualOthers && formData.enableDocuments && (
            <div>
              <label className="block text-sm mb-2">{t("form.documentWeight")}</label>
              <input
                type="number"
                value={formData.documentWeight}
                onChange={(e) => onChange("documentWeight", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.visualOthers && formData.enableGames && (
            <div>
              <label className="block text-sm mb-2">{t("form.gameWeight")}</label>
              <input
                type="number"
                value={formData.gameWeight}
                onChange={(e) => onChange("gameWeight", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.visualOthers && formData.enableMiscItems && (
            <>
              <div>
                <label className="block text-sm mb-2">{t("form.brochureWeight")}</label>
                <input
                  type="number"
                  value={formData.brochureWeight}
                  onChange={(e) => onChange("brochureWeight", parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">{t("form.posterWeight")}</label>
                <input
                  type="number"
                  value={formData.posterWeight}
                  onChange={(e) => onChange("posterWeight", parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">{t("form.screensaverWeight")}</label>
                <input
                  type="number"
                  value={formData.screensaverWeight}
                  onChange={(e) => onChange("screensaverWeight", parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">{t("form.vrGameWeight")}</label>
                <input
                  type="number"
                  value={formData.vrGameWeight}
                  onChange={(e) => onChange("vrGameWeight", parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {formData.enableQuiz && (
            <div>
              <label className="block text-sm mb-2">{t("form.quizProgressWeight")}</label>
              <input
                type="number"
                value={formData.quizProgressWeight}
                onChange={(e) => onChange("quizProgressWeight", parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Total Weight */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Weight:</span>
          <span
            className={clsx("text-2xl font-bold", totalWeight === 100 ? "text-green-600" : "text-red-600")}
          >
            {totalWeight}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{t("form.totalWeight")}</p>
      </div>
    </div>
  );
}
