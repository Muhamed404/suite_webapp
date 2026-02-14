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
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Info className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step1")}</span>
      </h2>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("form.campaignName")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.campaignName}
          onChange={(e) => onChange("campaignName", e.target.value)}
          className={clsx(
            "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
            errors.campaignName ? "border-red-500" : "border-gray-300"
          )}
          placeholder={t("form.campaignNamePlaceholder")}
        />
        {errors.campaignName && <p className="text-red-500 text-sm mt-1">{errors.campaignName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t("form.description")}</label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t("form.descriptionPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("form.startDate")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className={clsx(
              "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              errors.startDate ? "border-red-500" : "border-gray-300"
            )}
          />
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("form.endDate")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            min={formData.startDate || new Date().toISOString().split("T")[0]}
            className={clsx(
              "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              errors.endDate ? "border-red-500" : "border-gray-300"
            )}
          />
          {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="gamification"
          checked={formData.gamified}
          onChange={(e) => onChange("gamified", e.target.checked)}
          className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="gamification" className="text-sm font-medium cursor-pointer">
          {t("form.gamification")}
        </label>
      </div>
    </div>
  );
}
