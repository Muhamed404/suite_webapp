"use client";

import { Layout } from "lucide-react";
import clsx from "clsx";
import { useMemo, useEffect, useRef } from "react";

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
  const prevFieldsKey = useRef<string>("");
  const parseWeightValue = (value: string): number => {
    const parsedValue = Number.parseInt(value, 10);
    if (Number.isNaN(parsedValue)) return 0;
    return Math.min(100, Math.max(0, parsedValue));
  };

  // Auto-distribute weights equally only for the 3 main content types.
  useEffect(() => {
    const activeMainFields: Array<{ key: string; value: boolean }> = [
      { key: "motionVideoWeight", value: formData.visualShortVideos },
      { key: "interactiveContentWeight", value: formData.visualInteractive },
      { key: "quizProgressWeight", value: formData.enableQuiz },
    ];

    const selectedFields = activeMainFields.filter((f) => f.value);
    const fieldsKey = selectedFields.map((f) => f.key).join(",");

    if (fieldsKey === prevFieldsKey.current || selectedFields.length === 0) return;
    prevFieldsKey.current = fieldsKey;

    const count = selectedFields.length;
    let weights: number[] = [];

    if (count === 1) {
      weights = [100];
    } else if (count === 2) {
      weights = [50, 50];
    } else if (count === 3) {
      weights = [30, 30, 40];
    }

    selectedFields.forEach((field, idx) => {
      onChange(field.key, weights[idx]);
    });
  }, [formData.visualShortVideos, formData.visualInteractive, formData.enableQuiz]);

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

  const formulaParts = useMemo(() => {
    const parts: string[] = [];

    if (formData.visualShortVideos) parts.push(`Videos (${formData.motionVideoWeight}%)`);
    if (formData.visualInteractive)
      parts.push(`Interactive (${formData.interactiveContentWeight}%)`);
    if (formData.enableQuiz) parts.push(`Quiz (${formData.quizProgressWeight}%)`);
    if (formData.visualOthers && formData.enableDocuments)
      parts.push(`Documents (${formData.documentWeight}%)`);
    if (formData.visualOthers && formData.enableGames)
      parts.push(`Games (${formData.gameWeight}%)`);
    if (formData.visualOthers && formData.enableMiscItems) {
      parts.push(`Brochures (${formData.brochureWeight}%)`);
      parts.push(`Posters (${formData.posterWeight}%)`);
      parts.push(`Screensavers (${formData.screensaverWeight}%)`);
      parts.push(`VR Games (${formData.vrGameWeight}%)`);
    }

    return parts;
  }, [formData]);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <Layout className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-[#051226]">
          {t("wizard.step5")} <span className="text-red-500 text-[10px]">*</span>
        </h2>
      </div>

      {errors.weights && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
          {errors.weights}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {/* Other Content Type Toggles (if "Others" visual selected) */}
        {formData.visualOthers && (
          <div className="border-b border-gray-200 pb-4">
            <h6 className="text-xs font-semibold text-[#051226] mb-3">Additional Content Types</h6>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all">
                <div
                  className={clsx(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                    formData.enableDocuments
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 group-hover:border-blue-400"
                  )}
                  onClick={() => onChange("enableDocuments", !formData.enableDocuments)}
                >
                  {formData.enableDocuments && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-700">{t("form.enableDocuments")}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all">
                <div
                  className={clsx(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                    formData.enableGames
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 group-hover:border-blue-400"
                  )}
                  onClick={() => onChange("enableGames", !formData.enableGames)}
                >
                  {formData.enableGames && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-700">{t("form.enableGames")}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all">
                <div
                  className={clsx(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                    formData.enableMiscItems
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 group-hover:border-blue-400"
                  )}
                  onClick={() => onChange("enableMiscItems", !formData.enableMiscItems)}
                >
                  {formData.enableMiscItems && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-700">{t("form.enableMiscItems")}</span>
              </label>
            </div>
          </div>
        )}

        {/* Weight Configuration */}
        <div>
          <h6 className="text-sm font-semibold text-[#051226] mb-2">
            How would you like users to complete their module?{" "}
            <span className="text-red-500">*</span>
          </h6>
          <div className="grid grid-cols-2 gap-2">
            {formData.visualShortVideos && (
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">
                  {t("form.motionVideoWeight")}
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  max={100}
                  min={0}
                  type="number"
                  value={formData.motionVideoWeight}
                  onChange={(e) => onChange("motionVideoWeight", parseWeightValue(e.target.value))}
                />
              </div>
            )}
            {formData.visualInteractive && (
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">
                  {t("form.interactiveContentWeight")}
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  max={100}
                  min={0}
                  type="number"
                  value={formData.interactiveContentWeight}
                  onChange={(e) => onChange("interactiveContentWeight", parseWeightValue(e.target.value))}
                />
              </div>
            )}
            {formData.enableQuiz && (
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">
                  {t("form.quizProgressWeight")}
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  max={100}
                  min={0}
                  type="number"
                  value={formData.quizProgressWeight}
                  onChange={(e) => onChange("quizProgressWeight", parseWeightValue(e.target.value))}
                />
              </div>
            )}
            {formData.visualOthers && formData.enableDocuments && (
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">
                  {t("form.documentWeight")}
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  max={100}
                  min={0}
                  type="number"
                  value={formData.documentWeight}
                  onChange={(e) => onChange("documentWeight", parseWeightValue(e.target.value))}
                />
              </div>
            )}
            {formData.visualOthers && formData.enableGames && (
              <div className="input-group">
                <label className="block font-medium text-gray-600 mb-1 text-xs">
                  {t("form.gameWeight")}
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  max={100}
                  min={0}
                  type="number"
                  value={formData.gameWeight}
                  onChange={(e) => onChange("gameWeight", parseWeightValue(e.target.value))}
                />
              </div>
            )}
            {formData.visualOthers && formData.enableMiscItems && (
              <>
                <div className="input-group">
                  <label className="block font-medium text-gray-600 mb-1 text-xs">
                    {t("form.brochureWeight")}
                  </label>
                  <input
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    max={100}
                    min={0}
                    type="number"
                    value={formData.brochureWeight}
                    onChange={(e) => onChange("brochureWeight", parseWeightValue(e.target.value))}
                  />
                </div>
                <div className="input-group">
                  <label className="block font-medium text-gray-600 mb-1 text-xs">
                    {t("form.posterWeight")}
                  </label>
                  <input
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    max={100}
                    min={0}
                    type="number"
                    value={formData.posterWeight}
                    onChange={(e) => onChange("posterWeight", parseWeightValue(e.target.value))}
                  />
                </div>
                <div className="input-group">
                  <label className="block font-medium text-gray-600 mb-1 text-xs">
                    {t("form.screensaverWeight")}
                  </label>
                  <input
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    max={100}
                    min={0}
                    type="number"
                    value={formData.screensaverWeight}
                    onChange={(e) => onChange("screensaverWeight", parseWeightValue(e.target.value))}
                  />
                </div>
                <div className="input-group">
                  <label className="block font-medium text-gray-600 mb-1 text-xs">
                    {t("form.vrGameWeight")}
                  </label>
                  <input
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    max={100}
                    min={0}
                    type="number"
                    value={formData.vrGameWeight}
                    onChange={(e) => onChange("vrGameWeight", parseWeightValue(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>

          {/* Weight Total */}
          <div className="mt-3">
            <strong className="text-sm">
              Total:{" "}
              <span
                className={clsx(
                  "text-lg font-bold",
                  totalWeight === 100 ? "text-blue-500" : "text-red-600"
                )}
              >
                {totalWeight}
              </span>
              /100
            </strong>
            {totalWeight !== 100 && (
              <div className="text-[10px] text-red-500 mt-0.5">
                Total weights must equal exactly 100.
              </div>
            )}
          </div>

          {/* Progress Formula */}
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-100">
            <h6 className="mb-1.5 text-xs font-semibold text-[#051226]">Progress Formula:</h6>
            <div className="text-[10px] text-gray-600 leading-relaxed">
              {formulaParts.length === 0
                ? "Enable content types and assign weights to see progress calculation examples."
                : `Progress = ${formulaParts.join(" + ")}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
