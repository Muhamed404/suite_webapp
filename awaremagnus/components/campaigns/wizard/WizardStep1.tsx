"use client";

import { Megaphone } from "lucide-react";
import clsx from "clsx";
import { DatePicker } from "@heroui/date-picker";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";

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
    <div>
      <div className="flex items-center gap-1.5 mb-8">
        <Megaphone className="w-4 h-4 text-blue-400" />
        <h2 className="text-base font-semibold text-[#051226]">{t("wizard.step1")}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Campaign Name */}
        <div className="input-group">
          <label className="block font-medium text-gray-600 mb-3 text-sm">
            {t("form.campaignName")} <span className="text-red-500">*</span>
          </label>
          <input
            className={clsx(
              "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all",
              errors.campaignName ? "border-red-500" : "border-gray-200"
            )}
            placeholder={t("form.campaignNamePlaceholder")}
            type="text"
            value={formData.campaignName}
            onChange={(e) => onChange("campaignName", e.target.value)}
          />
          {errors.campaignName && (
            <p className="text-[10px] text-red-500 mt-0.5">{errors.campaignName}</p>
          )}
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="block font-medium text-gray-600 mb-3 text-sm">
            {t("form.description")}
          </label>
          <textarea
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
            placeholder={t("form.descriptionPlaceholder")}
            rows={2}
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div className="input-group">
            <label className="block font-medium text-gray-600 mb-2 text-sm">
              {t("form.startDate")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              aria-label="Campaign Start Date"
              className="w-full"
              classNames={{
                selectorButton: "h-8 min-w-8",
              }}
              granularity="day"
              minValue={today(getLocalTimeZone()) as any}
              value={formData.startDate ? (parseDate(formData.startDate) as any) : null}
              onChange={(date) => onChange("startDate", date ? date.toString() : "")}
            />
            {errors.startDate && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.startDate}</p>
            )}
          </div>
          <div className="input-group">
            <label className="block font-medium text-gray-600 mb-2 text-sm">
              {t("form.endDate")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              aria-label="Campaign End Date"
              className="w-full"
              classNames={{
                selectorButton: "h-8 min-w-8",
              }}
              granularity="day"
              minValue={
                (formData.startDate ? parseDate(formData.startDate) : today(getLocalTimeZone())) as any
              }
              value={formData.endDate ? (parseDate(formData.endDate) as any) : null}
              onChange={(date) => onChange("endDate", date ? date.toString() : "")}
            />
            {errors.endDate && <p className="text-[10px] text-red-500 mt-0.5">{errors.endDate}</p>}
          </div>
        </div>

        {/* Gamification Toggle - circular checkbox style */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <div
              className={clsx(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                formData.gamified
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-300 group-hover:border-blue-400"
              )}
              onClick={() => onChange("gamified", !formData.gamified)}
            >
              {formData.gamified && (
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
            <span className="text-xs text-gray-700">Enable Gamification</span>
          </label>
        </div>
      </div>
    </div>
  );
}
