"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { ModuleLanguageSelector } from "./module-language-selector";
import {
  ModuleTranslationCard,
  type ModuleTranslation,
} from "./module-translation-card";

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

export function CreateModuleForm() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("module");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [creationDay, setCreationDay] = useState("");
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

    setTranslations((prev) => [
      ...prev,
      ...toAdd.map((id) => createEmptyTranslation(id)),
    ]);
    setFormError(null);
  }, [selectedLanguageIds, translations, t]);

  const updateTranslation = useCallback(
    (
      index: number,
      updater: (prev: ModuleTranslation) => ModuleTranslation,
    ) => {
      setTranslations((prev) =>
        prev.map((t, i) => (i === index ? updater(t) : t)),
      );
    },
    [],
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
    const invalidTranslations = translations.filter((t) => !t.name.trim());

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
          name: moduleName.trim() || undefined,
          difficulty: Number(difficulty),
          org_id: 0, // Will be set by backend from JWT token
        },
        translations: translations.map((tr) => ({
          language_id: tr.language_id,
          name: tr.name.trim(),
          description: tr.description.trim() || undefined,
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
      setSelectedLanguageIds([]);
      setTranslations([]);

      // Redirect to module list based on current path
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
    setCreationDay("");
    setCategory("");
    setDifficulty("1");
    setSelectedLanguageIds([]);
    setTranslations([]);
    setFormError(null);
    setFormSuccess(null);
  };

  const isSubmitting = createModule.isPending;

  return (
    <div className={clsx("flex flex-col p-6 max-w-6xl mx-auto w-full", isRtl && "text-right")}>
      <div>
        <form onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-[var(--strokeGray)] bg-white p-6 mb-6 shadow-none">
            <h2 className="text-xl font-semibold text-[var(--mainblue)] mb-1">{t("title")}</h2>
            <p className="text-sm text-[var(--darkgray)] mb-6">{t("subtitle")}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT FORM */}
              <div className="col-span-2 space-y-4">
                {/* Module Code */}
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("moduleCode")}
                  </label>
                  <Input
                    classNames={{
                      base: "w-full",
                      input: "text-[14px]",
                      inputWrapper:
                        "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-5",
                    }}
                    placeholder={t("moduleCodePlaceholder")}
                    value={moduleCode}
                    onValueChange={setModuleCode}
                  />
                  <p className="text-sm text-[var(--darkgray)] mt-1.5">
                    {t("moduleCodeHint")}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("name")}
                  </label>
                  <Input
                    classNames={{
                      base: "w-full",
                      input: "text-[14px]",
                      inputWrapper:
                        "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-5",
                    }}
                    placeholder={t("namePlaceholder")}
                    value={moduleName}
                    onValueChange={setModuleName}
                  />
                </div>

                {/* Creation Day */}
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("creationDay")}
                  </label>
                  <div className="relative">
                    <input
                      className="w-full h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus:border-[var(--blue)] focus:outline-none text-[14px] px-5 transition-colors duration-300"
                      type="date"
                      value={creationDay}
                      onChange={(e) => setCreationDay(e.target.value)}
                    />
                    <Image
                      alt=""
                      className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
                      height={16}
                      src="/images/date.svg"
                      width={16}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("moduleCategory")}
                  </label>
                  <Select
                    classNames={{
                      trigger:
                        "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 text-[14px] px-5",
                    }}
                    placeholder={
                      categoriesLoading ? t("loading") ?? "Loading..." : t("categoryPlaceholder")
                    }
                    selectedKeys={category ? [category] : []}
                    onSelectionChange={(keys) => {
                      const v =
                        keys === "all" || !keys
                          ? ""
                          : ((Array.from(
                              keys as Iterable<string>,
                            )[0] as string) ?? "");

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
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("difficulty")}
                  </label>
                  <Select
                    classNames={{
                      trigger:
                        "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 text-[14px] px-5",
                    }}
                    selectedKeys={difficulty ? [difficulty] : []}
                    onSelectionChange={(keys) => {
                      const v =
                        keys === "all" || !keys
                          ? "1"
                          : ((Array.from(
                              keys as Iterable<string>,
                            )[0] as string) ?? "1");

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

              {/* LANGUAGE SELECTOR */}
              <ModuleLanguageSelector
                selectedLanguageIds={selectedLanguageIds}
                onAddTranslation={handleAddTranslation}
                onChange={setSelectedLanguageIds}
              />
            </div>
          </section>

          {/* MODULE TRANSLATION SECTION */}
          {translations.length > 0 && (
            <section className="rounded-2xl border border-[var(--strokeGray)] bg-white p-6 mb-6 shadow-none">
              <h2 className="text-xl font-semibold text-[var(--mainblue)] mb-1">
                {t("moduleTranslation")}
              </h2>
              <p className="text-sm text-[var(--darkgray)] mb-6">
                {t("moduleTranslationSubtitle")}
              </p>
              <div className="space-y-5">
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
                    onNameChange={(name) =>
                      updateTranslation(index, (prev) => ({ ...prev, name }))
                    }
                    onRemove={() => removeTranslation(index)}
                  />
                ))}
              </div>
            </section>
          )}


          {formError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6" role="alert">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          {formSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 mb-6" role="status">
              <p className="text-sm text-green-700">{formSuccess}</p>
            </div>
          )}

          <div
            className={clsx(
              "flex justify-end gap-3 py-4",
              isRtl && "flex-row-reverse",
            )}
          >
            <Button
              className="rounded-full border border-[var(--strokeGray)] text-[var(--mainblue)] text-sm font-medium h-11 px-6 hover:bg-[var(--gray)]/50 transition-colors"
              radius="full"
              size="md"
              isDisabled={isSubmitting}
              type="button"
              variant="bordered"
              onPress={handleCancel}
            >
              {t("cancel")}
            </Button>
            <Button
              className="rounded-full bg-[var(--blue)] text-white text-sm font-medium h-11 px-6 hover:opacity-90 transition-opacity"
              radius="full"
              size="md"
              isLoading={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
