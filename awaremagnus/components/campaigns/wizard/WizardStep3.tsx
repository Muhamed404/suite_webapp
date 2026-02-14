"use client";

import { BookOpen } from "lucide-react";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useModules } from "@/hooks/useQuiz";

interface WizardStep3Props {
  formData: {
    modules: number[];
    visualShortVideos: boolean;
    visualInteractive: boolean;
    visualOthers: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function WizardStep3({ formData, onChange, errors }: WizardStep3Props) {
  const t = useTranslations("campaigns");
  const { data: modulesData, isLoading, error } = useModules({ status: 1 });
  
  // Handle different possible data structures
  let modules: any[] = [];
  if (modulesData?.data && Array.isArray(modulesData.data)) {
    modules = modulesData.data;
  } else if (modulesData?.object && Array.isArray(modulesData.object)) {
    modules = modulesData.object;
  } else if (Array.isArray(modulesData)) {
    modules = modulesData;
  }

  console.log('Modules data:', modulesData);
  console.log('Modules array:', modules);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  const toggleModule = (id: number) => {
    const newModules = formData.modules.includes(id)
      ? formData.modules.filter((m) => m !== id)
      : [...formData.modules, id];

    onChange("modules", newModules);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <BookOpen className="w-6 h-6 text-blue-500" />
        <span>{t("wizard.step3")} <span className="text-red-500">*</span></span>
      </h2>

      {/* Module Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">
          {t("form.selectModules")} <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading modules...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">Error loading modules: {error.message}</p>
          ) : modules.length === 0 ? (
            <p className="text-gray-500 text-sm">No modules available</p>
          ) : (
            <div className="space-y-2">
              {modules.map((module: any) => (
                <label
                  key={module.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.modules.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <span className="text-sm">
                    {module.title || module.name || module.translations?.[0]?.name || module.code}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <small className="text-gray-500 mt-2 block">{t("form.modulesPlaceholder")}</small>
        {errors.modules && <p className="text-red-500 text-sm mt-1">{errors.modules}</p>}
      </div>

      {/* Visual Learning Options */}
      <div>
        <label className="block text-sm font-medium mb-3">
          {t("form.enableVisualLearning")} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label
            className={clsx(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              formData.visualShortVideos ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
            )}
          >
            <input
              type="checkbox"
              checked={formData.visualShortVideos}
              onChange={(e) => onChange("visualShortVideos", e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <div>
              <div className="font-medium text-sm">{t("form.shortVideos")}</div>
            </div>
          </label>

          <label
            className={clsx(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              formData.visualInteractive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
            )}
          >
            <input
              type="checkbox"
              checked={formData.visualInteractive}
              onChange={(e) => onChange("visualInteractive", e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <div>
              <div className="font-medium text-sm">{t("form.interactiveContent")}</div>
            </div>
          </label>

          <label
            className={clsx(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              formData.visualOthers ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"
            )}
          >
            <input
              type="checkbox"
              checked={formData.visualOthers}
              onChange={(e) => onChange("visualOthers", e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <div>
              <div className="font-medium text-sm">{t("form.others")}</div>
            </div>
          </label>
        </div>
        <small className="text-gray-500 mt-2 block">{t("form.atleastOneVisual")}</small>
        {errors.visualLearning && <p className="text-red-500 text-sm mt-1">{errors.visualLearning}</p>}
      </div>
    </div>
  );
}
