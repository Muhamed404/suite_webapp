"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ModuleLanguageSelector,
  type ModuleLocale,
} from "./module-language-selector";
import {
  ModuleTranslationCard,
  type ModuleTranslation,
} from "./module-translation-card";
import { useCreateModule } from "@/hooks/useQuiz";
import { getLanguageId } from "@/utils/languageMapping";
import { getApiErrorMessage } from "@/utils/apiError";

function createEmptyTranslation(lang: ModuleLocale): ModuleTranslation {
  return {
    lang,
    name: "",
    description: "",
  };
}

export function CreateModuleForm() {
  const t = useTranslations("module");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [creationDay, setCreationDay] = useState("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("1");
  const [selectedLanguages, setSelectedLanguages] = useState<ModuleLocale[]>([]);
  const [translations, setTranslations] = useState<ModuleTranslation[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const createModule = useCreateModule();

  // TODO: Fetch categories from API when endpoint is available
  const categories = [
    { id: "1", name: "Application Security" },
    { id: "2", name: "Network Security" },
    { id: "3", name: "Data Protection" },
    { id: "4", name: "Physical Security" },
    { id: "5", name: "Social Engineering" },
  ];

  const handleAddTranslation = useCallback(() => {
    if (selectedLanguages.length === 0) {
      setFormError(t("selectLanguageFirst"));
      return;
    }

    // Find first language that doesn't have a translation yet
    const existingLangs = new Set(translations.map((t) => t.lang));
    const availableLang = selectedLanguages.find((lang) => !existingLangs.has(lang));

    if (!availableLang) {
      setFormError(t("allLanguagesAdded"));
      return;
    }

    setTranslations((prev) => [...prev, createEmptyTranslation(availableLang)]);
    setFormError(null);
  }, [selectedLanguages, translations, t]);

  const updateTranslation = useCallback(
    (index: number, updater: (prev: ModuleTranslation) => ModuleTranslation) => {
      setTranslations((prev) =>
        prev.map((t, i) => (i === index ? updater(t) : t))
      );
    },
    []
  );

  const removeTranslation = useCallback((index: number) => {
    setTranslations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!category) {
      setFormError(t("validationCategory"));
      return;
    }

    if (translations.length === 0) {
      setFormError(t("validationTranslations"));
      return;
    }

    // Validate translations - name is required, description is optional
    const invalidTranslations = translations.filter(
      (t) => !t.name.trim()
    );
    if (invalidTranslations.length > 0) {
      setFormError(t("validationTranslationFields"));
      return;
    }

    // Validate module code format (alphanumeric with underscores and hyphens)
    if (moduleCode.trim() && !/^[A-Za-z0-9_-]+$/.test(moduleCode.trim())) {
      setFormError(t("validationModuleCodeFormat"));
      return;
    }

    // Generate module code if not provided
    const code = moduleCode.trim() || `MOD-${Date.now()}`;

    try {
      const payload = {
        module: {
          category_id: Number(category),
          code,
          difficulty: Number(difficulty),
          org_id: 0, // Will be set by backend from JWT token
        },
        translations: translations.map((t) => ({
          language_id: getLanguageId(t.lang),
          name: t.name.trim(),
          description: t.description.trim() || undefined,
        })),
      };

      await createModule.mutateAsync(payload);

      setFormSuccess(t("createSuccess"));
      // Reset form
      setModuleName("");
      setModuleCode("");
      setCreationDay("");
      setCategory("");
      setDifficulty("1");
      setSelectedLanguages([]);
      setTranslations([]);
    } catch (err) {
      const msg = getApiErrorMessage(err, tCommon, {
        defaultKey: "errors.unknown",
        defaultValue: t("createError"),
      });
      setFormError(msg);
    }
  };

  const handleCancel = () => {
    setModuleName("");
    setModuleCode("");
    setCreationDay("");
    setCategory("");
    setDifficulty("1");
    setSelectedLanguages([]);
    setTranslations([]);
    setFormError(null);
    setFormSuccess(null);
  };

  const isSubmitting = createModule.isPending;

  return (
    <div className={clsx("flex flex-col p-2", isRtl && "text-right")}>
      <div className="bg-[#F3F7FA] min-h-screen">
        {/* Breadcrumb */}
        <div className="text-[10px] text-gray-500 mb-2">
          {t("breadcrumbPrefix")}
          <span className="font-medium text-gray-700">{t("breadcrumbCurrent")}</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CREATE MODULE CARD */}
          <div className="bg-white rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-1">{t("title")}</h2>
          <p className="text-gray-500 mb-2 text-xs">{t("subtitle")}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT FORM */}
            <div className="col-span-2 space-y-4">
              {/* Module Code */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-xs">
                  {t("moduleCode")}
                </label>
                <Input
                  value={moduleCode}
                  onValueChange={setModuleCode}
                  placeholder={t("moduleCodePlaceholder")}
                  classNames={{
                    base: "w-full",
                    input: "text-xs",
                    inputWrapper:
                      "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
                  }}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  {t("moduleCodeHint")}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-xs">
                  {t("name")}
                </label>
                <Input
                  value={moduleName}
                  onValueChange={setModuleName}
                  placeholder={t("namePlaceholder")}
                  classNames={{
                    base: "w-full",
                    input: "text-xs",
                    inputWrapper:
                      "h-10 min-h-10 rounded-lg border border-gray-200 bg-white focus-within:border-[#3FBDFF] px-3 py-2",
                  }}
                />
              </div>

              {/* Creation Day */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-xs">
                  {t("creationDay")}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={creationDay}
                    onChange={(e) => setCreationDay(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring focus:ring-blue-100 text-xs h-10"
                  />
                  <Image
                    src="/images/date.svg"
                    width={12}
                    height={12}
                    className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
                    alt=""
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-xs">
                  {t("moduleCategory")}
                </label>
                <Select
                  selectedKeys={category ? [category] : []}
                  onSelectionChange={(keys) => {
                    const v =
                      keys === "all" || !keys
                        ? ""
                        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
                    setCategory(v);
                  }}
                  placeholder={t("categoryPlaceholder")}
                  classNames={{
                    trigger: "h-10 min-h-10 rounded-lg border border-gray-200 text-xs",
                  }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} textValue={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-xs">
                  {t("difficulty")}
                </label>
                <Select
                  selectedKeys={difficulty ? [difficulty] : []}
                  onSelectionChange={(keys) => {
                    const v =
                      keys === "all" || !keys
                        ? "1"
                        : (Array.from(keys as Iterable<string>)[0] as string) ?? "1";
                    setDifficulty(v);
                  }}
                  classNames={{
                    trigger: "h-10 min-h-10 rounded-lg border border-gray-200 text-xs",
                  }}
                >
                  <SelectItem key="1" textValue="1">
                    {t("difficultyLevels.1")}
                  </SelectItem>
                  <SelectItem key="2" textValue="2">
                    {t("difficultyLevels.2")}
                  </SelectItem>
                  <SelectItem key="3" textValue="3">
                    {t("difficultyLevels.3")}
                  </SelectItem>
                  <SelectItem key="4" textValue="4">
                    {t("difficultyLevels.4")}
                  </SelectItem>
                  <SelectItem key="5" textValue="5">
                    {t("difficultyLevels.5")}
                  </SelectItem>
                </Select>
              </div>
            </div>

            {/* LANGUAGE SELECTOR */}
            <ModuleLanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={setSelectedLanguages}
              onAddTranslation={handleAddTranslation}
            />
          </div>
        </div>

        {/* MODULE TRANSLATION SECTION */}
        {translations.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h2 className="text-lg font-semibold mb-1">{t("moduleTranslation")}</h2>
            <p className="text-gray-500 mb-2 text-xs">
              {t("moduleTranslationSubtitle")}
            </p>

            <div className="space-y-4">
              {translations.map((translation, index) => (
                <ModuleTranslationCard
                  key={`${translation.lang}-${index}`}
                  translation={translation}
                  onNameChange={(name) =>
                    updateTranslation(index, (prev) => ({ ...prev, name }))
                  }
                  onDescriptionChange={(description) =>
                    updateTranslation(index, (prev) => ({ ...prev, description }))
                  }
                  onRemove={() => removeTranslation(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {formError && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-sm text-red-500" role="alert">
              {formError}
            </p>
          </div>
        )}
        {formSuccess && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-sm text-green-600" role="status">
              {formSuccess}
            </p>
          </div>
        )}

        {/* FOOTER */}
        <div
          className={clsx(
            "flex justify-end gap-2 py-4",
            isRtl && "flex-row-reverse"
          )}
        >
          <Button
            type="button"
            variant="bordered"
            onPress={handleCancel}
            isDisabled={isSubmitting}
            className="px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 text-xs"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs"
          >
            {isSubmitting ? t("saving") : t("submit")}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );
}
