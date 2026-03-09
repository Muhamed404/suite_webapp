"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { ModuleLanguageSelector } from "./module-language-selector";
import { ModuleTranslationCard, type ModuleTranslation } from "./module-translation-card";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useCreateModule } from "@/hooks/useQuiz";
import { useCategories } from "@/hooks/useSuiteAwm";
import { getApiErrorMessage } from "@/utils/apiError";

function createEmptyTranslation(languageId: number): ModuleTranslation {
  return {
    language_id: languageId,
    name: "",
    description: "",
  };
}

/** Input wrapper classes matching HTML input-field, input-label, input-group */
const inputGroupClass = "mb-4";
const inputLabelClass = "block text-gray-700 mb-1 font-medium text-xs";
const inputFieldClass =
  "w-full px-[0.59rem] py-[0.59rem] border border-[#e5e7eb] rounded-lg text-xs outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function CreateModuleForm() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("module");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");

  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("1");
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([]);
  const [translations, setTranslations] = useState<ModuleTranslation[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const createModule = useCreateModule();
  const { data: categoriesList, isLoading: categoriesLoading } = useCategories();
  const categories = Array.isArray(categoriesList) ? categoriesList : [];

  const handleAddTranslation = useCallback(() => {
    if (selectedLanguageIds.length === 0) {
      setFormError(t("selectLanguageFirst"));

      return;
    }

    const existingIds = new Set(translations.map((tr) => tr.language_id));
    const toAdd = selectedLanguageIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) {
      setFormError(t("allLanguagesAdded"));

      return;
    }

    setTranslations((prev) => [...prev, ...toAdd.map((id) => createEmptyTranslation(id))]);
    setFormError(null);
  }, [selectedLanguageIds, translations, t]);

  const updateTranslation = useCallback(
    (index: number, updater: (prev: ModuleTranslation) => ModuleTranslation) => {
      setTranslations((prev) => prev.map((t, i) => (i === index ? updater(t) : t)));
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

    const invalidTranslations = translations.filter((t) => !t.name.trim());

    if (invalidTranslations.length > 0) {
      setFormError(t("validationTranslationFields"));

      return;
    }

    if (moduleCode.trim() && !/^[A-Za-z0-9_-]+$/.test(moduleCode.trim())) {
      setFormError(t("validationModuleCodeFormat"));

      return;
    }

    const code = moduleCode.trim() || `MOD-${Date.now()}`;

    try {
      const payload = {
        module: {
          category_id: Number(category),
          code,
          name: moduleName.trim() || undefined,
          difficulty: Number(difficulty),
          org_id: 0,
        },
        translations: translations.map((tr) => ({
          language_id: tr.language_id,
          name: tr.name.trim(),
          description: tr.description.trim() || undefined,
          logo_banner: tr.iconFile instanceof File ? tr.iconFile : undefined,
        })),
      };

      await createModule.mutateAsync(payload);

      setFormSuccess(t("createSuccess"));
      setModuleName("");
      setModuleCode("");

      setCategory("");
      setDifficulty("1");
      setSelectedLanguageIds([]);
      setTranslations([]);

      if (pathname?.includes("/training-library/my/")) {
        router.push("/dashboard/training-library/my");
      } else if (pathname?.includes("/training-library/system/")) {
        router.push("/dashboard/training-library/system");
      } else {
        router.push("/dashboard/module");
      }
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

    setCategory("");
    setDifficulty("1");
    setSelectedLanguageIds([]);
    setTranslations([]);
    setFormError(null);
    setFormSuccess(null);
  };

  const isSubmitting = createModule.isPending;

  return (
    <form className={clsx("flex flex-col", isRtl && "text-right")} onSubmit={handleSubmit}>
      {/* CREATE MODULE CARD - matches HTML */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <h2 className="text-xl font-semibold mb-1 text-gray-900">{t("title")}</h2>
        <p className="text-gray-500 mb-10 text-xs">{t("subtitle")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT FORM - matches HTML col-span-2 */}
          <div className="col-span-2 space-y-4">
            {/* Module Code */}
            <div className={inputGroupClass}>
              <label className={inputLabelClass} htmlFor="moduleCode">
                {t("moduleCode")}
              </label>
              <Input
                classNames={{
                  base: "w-full",
                  input: "text-xs",
                  inputWrapper:
                    "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-4",
                }}
                id="moduleCode"
                placeholder={t("moduleCodePlaceholder")}
                value={moduleCode}
                onValueChange={setModuleCode}
              />
              <p className="text-xs text-gray-500 mt-1">{t("moduleCodeHint")}</p>
            </div>

            {/* Name */}
            <div className={inputGroupClass}>
              <label className={inputLabelClass} htmlFor="moduleName">
                {t("name")}
              </label>
              <Input
                classNames={{
                  base: "w-full",
                  input: "text-xs",
                  inputWrapper:
                    "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-4",
                }}
                id="moduleName"
                placeholder={t("namePlaceholder")}
                value={moduleName}
                onValueChange={setModuleName}
              />
            </div>

            {/* Category */}
            <div className={inputGroupClass}>
              <label className={inputLabelClass} htmlFor="category">
                {t("moduleCategory")}
              </label>
              <Select
                classNames={{
                  trigger:
                    "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-xs px-4",
                }}
                id="category"
                placeholder={
                  categoriesLoading ? (t("loading") ?? "Loading...") : t("categoryPlaceholder")
                }
                selectedKeys={category ? [category] : []}
                onSelectionChange={(keys) => {
                  const v =
                    keys === "all" || !keys
                      ? ""
                      : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

                  setCategory(v);
                }}
              >
                {categories.map((cat) => (
                  <SelectItem key={String(cat.id)} textValue={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Difficulty */}
            <div className={inputGroupClass}>
              <label className={inputLabelClass} htmlFor="difficulty">
                {t("difficulty")}
              </label>
              <Select
                classNames={{
                  trigger:
                    "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-xs px-4",
                }}
                id="difficulty"
                selectedKeys={difficulty ? [difficulty] : []}
                onSelectionChange={(keys) => {
                  const v =
                    keys === "all" || !keys
                      ? "1"
                      : ((Array.from(keys as Iterable<string>)[0] as string) ?? "1");

                  setDifficulty(v);
                }}
              >
                <SelectItem key="1" textValue={t("difficultyLevels.1")}>
                  {t("difficultyLevels.1")}
                </SelectItem>
                <SelectItem key="2" textValue={t("difficultyLevels.2")}>
                  {t("difficultyLevels.2")}
                </SelectItem>
                <SelectItem key="3" textValue={t("difficultyLevels.3")}>
                  {t("difficultyLevels.3")}
                </SelectItem>
                <SelectItem key="4" textValue={t("difficultyLevels.4")}>
                  {t("difficultyLevels.4")}
                </SelectItem>
                <SelectItem key="5" textValue={t("difficultyLevels.5")}>
                  {t("difficultyLevels.5")}
                </SelectItem>
              </Select>
            </div>
          </div>

          {/* LANGUAGE SELECTOR - right column, matches HTML */}
          <ModuleLanguageSelector
            selectedLanguageIds={selectedLanguageIds}
            onAddTranslation={handleAddTranslation}
            onChange={setSelectedLanguageIds}
          />
        </div>
      </div>

      {/* MODULE TRANSLATION SECTION - matches HTML */}
      {translations.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-1 text-gray-900">{t("moduleTranslation")}</h2>
          <p className="text-gray-500 mb-6 text-xs">{t("moduleTranslationSubtitle")}</p>
          <div className="space-y-4" id="translationContainer">
            {translations.map((translation, index) => (
              <ModuleTranslationCard
                key={`${translation.language_id}-${index}`}
                translation={translation}
                onDescriptionChange={(description) =>
                  updateTranslation(index, (prev) => ({
                    ...prev,
                    description,
                  }))
                }
                onIconChange={(file, preview) =>
                  updateTranslation(index, (prev) => ({
                    ...prev,
                    iconFile: file ?? undefined,
                    iconPreview: preview ?? undefined,
                  }))
                }
                onNameChange={(name) => updateTranslation(index, (prev) => ({ ...prev, name }))}
                onRemove={() => removeTranslation(index)}
              />
            ))}
          </div>
        </div>
      )}

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4" role="alert">
          <p className="text-sm text-red-600">{formError}</p>
        </div>
      )}
      {formSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-4" role="status">
          <p className="text-sm text-green-700">{formSuccess}</p>
        </div>
      )}

      {/* FOOTER - matches HTML */}
      <div className={clsx("flex justify-end gap-2 py-4", isRtl && "flex-row-reverse")}>
        <Button
          className="px-6 py-2 bg-white rounded-full text-gray-600 hover:bg-gray-100 text-xs font-medium"
          isDisabled={isSubmitting}
          radius="full"
          size="sm"
          type="button"
          variant="flat"
          onPress={handleCancel}
        >
          {t("cancel")}
        </Button>
        <Button
          className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs font-medium"
          isLoading={isSubmitting}
          radius="full"
          size="sm"
          type="submit"
        >
          {isSubmitting ? t("saving") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
