"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
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
  const { data: modulesData, isLoading, error } = useModules();
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target as Node)) {
        setModuleDropdownOpen(false);
      }
    };

    if (moduleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moduleDropdownOpen]);

  // Handle different possible data structures
  let modules: any[] = [];
  if (modulesData?.data && Array.isArray(modulesData.data)) {
    modules = modulesData.data;
  } else if ((modulesData as any)?.object && Array.isArray((modulesData as any).object)) {
    modules = (modulesData as any).object;
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

  const getModuleName = (module: any): string => {
    return module.title || module.name || module.translations?.[0]?.name || module.code || `Module ${module.id}`;
  };

  const getSelectedModuleName = (id: number): string => {
    const m = modules.find((mod: any) => mod.id === id);
    return m ? getModuleName(m) : `Module ${id}`;
  };

  const filteredModules = modules.filter((m: any) =>
    getModuleName(m).toLowerCase().includes(moduleSearch.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <BookOpen className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-[#051226]">
          {t("wizard.step3")} <span className="text-red-500 text-[10px]">*</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Module Selection */}
        <div className="input-group">
          <label className="block font-medium text-gray-600 mb-3 text-sm">
            {t("form.selectModules")} <span className="text-red-500">*</span>
          </label>

          <div className="relative" ref={moduleDropdownRef}>
            {/* Trigger button showing selected chips */}
            <button
              type="button"
              onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 bg-white min-h-[40px] text-left"
            >
              <div className="flex flex-wrap gap-2 flex-1">
                {isLoading ? (
                  <span className="text-gray-400 text-xs">Loading modules...</span>
                ) : formData.modules.length === 0 ? (
                  <span className="text-gray-500 text-sm">{t("form.selectModules")}</span>
                ) : (
                  formData.modules.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {getSelectedModuleName(id)}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModule(id);
                        }}
                        className="hover:text-blue-900 transition-colors flex-shrink-0 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            toggleModule(id);
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </div>
                    </span>
                  ))
                )}
              </div>
              <ChevronDown className={clsx("w-4 h-4 transition-transform flex-shrink-0", moduleDropdownOpen && "rotate-180")} />
            </button>

            {/* Dropdown panel */}
            {moduleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Search modules..."
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <p className="text-gray-400 text-xs text-center py-4">Loading modules...</p>
                  ) : error ? (
                    <p className="text-red-500 text-xs px-4 py-2">{(error as any).message}</p>
                  ) : filteredModules.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-4">No modules found</p>
                  ) : (
                    filteredModules.map((module: any) => (
                      <label
                        key={module.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div
                          className={clsx(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            formData.modules.includes(module.id)
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300"
                          )}
                        >
                          {formData.modules.includes(module.id) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{getModuleName(module)}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.modules && <p className="text-[10px] text-red-500 mt-1">{errors.modules}</p>}
        </div>

        {/* Visual Learning Options */}
        <div>
          <label className="block font-medium text-gray-600 mb-2 text-sm">
            {t("form.enableVisualLearning")} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all" onClick={() => onChange("visualShortVideos", !formData.visualShortVideos)}>
              <div
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  formData.visualShortVideos
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300 group-hover:border-blue-400"
                )}
              >
                {formData.visualShortVideos && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-700">{t("form.shortVideos")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all" onClick={() => onChange("visualInteractive", !formData.visualInteractive)}>
              <div
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  formData.visualInteractive
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300 group-hover:border-blue-400"
                )}
              >
                {formData.visualInteractive && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-700">{t("form.interactiveContent")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer group p-2 transition-all" onClick={() => onChange("visualOthers", !formData.visualOthers)}>
              <div
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  formData.visualOthers
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300 group-hover:border-blue-400"
                )}
              >
                {formData.visualOthers && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-700">{t("form.others")}</span>
            </label>
          </div>
          {errors.visualLearning && (
            <p className="text-[10px] text-red-500 mt-1">{errors.visualLearning}</p>
          )}
        </div>
      </div>
    </div>
  );
}
