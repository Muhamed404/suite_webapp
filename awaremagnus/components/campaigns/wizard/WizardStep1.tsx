"use client";

import { Info } from "lucide-react";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

interface WizardStep1Props {
  formData: {
    campaignName: string;
    description: string;
    startDate: string;
    endDate: string;
    gamified: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function WizardStep1({ formData, onChange, errors }: WizardStep1Props) {
  const t = useTranslations("campaigns");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 mb-8">
        <Info className="w-4 h-4 text-blue-400" />
        <h2 className="text-base font-semibold text-[#051226]">{t("wizard.step1")}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Campaign Name */}
        <div className="input-group">
          <label className="input-label">
            {t("form.campaignName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.campaignName}
            onChange={(e) => onChange("campaignName", e.target.value)}
            className={clsx(
              "input-field",
              errors.campaignName ? "border-red-500" : ""
            )}
            placeholder={t("form.campaignNamePlaceholder")}
          />
          {errors.campaignName && <p className="field-error">{errors.campaignName}</p>}
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">{t("form.description")}</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={2}
            className="input-field"
            placeholder={t("form.descriptionPlaceholder")}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div className="input-group">
            <label className="input-label">
              {t("form.startDate")} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => onChange("startDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={clsx(
                "input-field",
                errors.startDate ? "border-red-500" : ""
              )}
            />
            {errors.startDate && <p className="field-error">{errors.startDate}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">
              {t("form.endDate")} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => onChange("endDate", e.target.value)}
              min={formData.startDate || new Date().toISOString().split("T")[0]}
              className={clsx(
                "input-field",
                errors.endDate ? "border-red-500" : ""
              )}
            />
            {errors.endDate && <p className="field-error">{errors.endDate}</p>}
          </div>
        </div>

        {/* Gamification Toggle */}
        <div className="flex items-center gap-2">
          <label className="lang-item flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              id="gamified"
              checked={formData.gamified}
              onChange={(e) => onChange("gamified", e.target.checked)}
              className="real-checkbox sr-only"
            />
            <span className="visual-tick w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center transition-all group-hover:border-blue-500">
              <i data-lucide="check" className="w-2.5 h-2.5 text-white opacity-0"></i>
            </span>
            <span className="text-xs text-gray-700">Enable Gamification</span>
          </label>
        </div>
      </div>
    </div>
  );
}
