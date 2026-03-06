"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useUpdateModule, useAddModuleTranslation } from "@/hooks/useQuiz";
import { useCategories } from "@/hooks/useSuiteAwm";
import { getApiErrorMessage } from "@/utils/apiError";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { getLanguageFlag, getLanguageName, SUPPORTED_LANGUAGES } from "@/utils/supportedLanguages";
import type { ModuleTranslation } from "@/types/quiz";

/* ─── Styling helpers reused from create form ─── */
const inputGroupClass = "mb-4";
const inputLabelClass = "block text-gray-700 mb-1 font-medium text-xs";
const inputFieldWrapperClass =
  "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-4";

interface TranslationEditState {
  language_id: number;
  name: string;
  description: string;
  iconFile?: File | null;
  iconPreview?: string | null;
  /** URL of the existing banner (from API) */
  existingBannerUrl?: string | null;
  saving: boolean;
  error: string | null;
  success: boolean;
}

interface EditModuleFormProps {
  moduleId: number;
  /** Where to redirect on Cancel / Save */
  backHref: string;
}

export function EditModuleForm({ moduleId, backHref }: EditModuleFormProps) {
  const router = useRouter();
  const t = useTranslations("module");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  /* ─── Remote data ─── */
  const { data: moduleRes, isLoading: moduleLoading } = useModule(moduleId, !!moduleId);
  const { data: categoriesList, isLoading: categoriesLoading } = useCategories();
  const categories = Array.isArray(categoriesList) ? categoriesList : [];

  const updateModule = useUpdateModule();
  const addTranslation = useAddModuleTranslation();

  /* ─── Module-level form state ─── */
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  /* ─── Translations editing state: keyed by language_id ─── */
  const [translationStates, setTranslationStates] = useState<
    Record<number, TranslationEditState>
  >({});
  /** Which language_id row is open for editing */
  const [editingTranslationId, setEditingTranslationId] = useState<number | null>(null);

  /* ─── Add-new-translation state ─── */
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [addingTranslation, setAddingTranslation] = useState(false);
  const [newTranslation, setNewTranslation] = useState<{
    language_id: number | null;
    name: string;
    description: string;
    iconFile?: File | null;
    iconPreview?: string | null;
  }>({ language_id: null, name: "", description: "" });

  /* ─── Seed form from API data ─── */
  useEffect(() => {
    const mod = moduleRes?.success ? moduleRes.data : null;
    if (!mod) return;

    setCode(mod.code ?? "");
    setCategory(mod.category_id ? String(mod.category_id) : "");
    setDifficulty(mod.difficulty ? String(mod.difficulty) : "1");

    // Build initial translation states from existing translations
    const states: Record<number, TranslationEditState> = {};
    (mod.translations ?? []).forEach((tr) => {
      states[tr.language_id] = {
        language_id: tr.language_id,
        name: tr.name ?? "",
        description: tr.description ?? "",
        existingBannerUrl: tr.logo_banner_url ?? null,
        iconFile: null,
        iconPreview: null,
        saving: false,
        error: null,
        success: false,
      };
    });
    setTranslationStates(states);
  }, [moduleRes]);

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const existingLangIds = Object.keys(translationStates).map(Number);

  /* ─── Module-level save ─── */
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!category) {
      setFormError(t("validationCategory"));
      return;
    }

    try {
      await updateModule.mutateAsync({
        id: moduleId,
        payload: {
          category_id: Number(category),
          code: code.trim() || undefined,
          difficulty: Number(difficulty),
        },
      });
      setFormSuccess(t("updateSuccess") ?? "Module updated successfully.");
      // redirect back to module details after a short delay to allow user to see message
      setTimeout(() => {
        router.push(backHref);
      }, 800);
    } catch (err) {
      setFormError(
        getApiErrorMessage(err, tCommon, {
          defaultKey: "errors.unknown",
          defaultValue: t("updateError") ?? "Failed to update module.",
        })
      );
    }
  };

  /* ─── Translation row helpers ─── */
  const updateTrState = useCallback(
    (langId: number, patch: Partial<TranslationEditState>) => {
      setTranslationStates((prev) => ({
        ...prev,
        [langId]: { ...prev[langId], ...patch },
      }));
    },
    []
  );

  const handleSaveTranslation = async (langId: number) => {
    const st = translationStates[langId];
    if (!st) return;
    if (!st.name.trim()) {
      updateTrState(langId, { error: t("validationTranslationFields") ?? "Name is required." });
      return;
    }
    updateTrState(langId, { saving: true, error: null, success: false });
    try {
      await addTranslation.mutateAsync({
        moduleId,
        payload: {
          language_id: langId,
          title: st.name.trim(),
          name: st.name.trim(),
          description: st.description.trim() || undefined,
          logo_banner: st.iconFile instanceof File ? st.iconFile : undefined,
        },
      });
      updateTrState(langId, { saving: false, success: true });
      setEditingTranslationId(null);
    } catch (err) {
      updateTrState(langId, {
        saving: false,
        error:
          getApiErrorMessage(err, tCommon, {
            defaultKey: "errors.unknown",
            defaultValue: "Failed to save translation.",
          }) ?? "Failed to save translation.",
      });
    }
  };

  /* ─── Add new translation ─── */
  const handleAddNew = async () => {
    if (!newTranslation.language_id || !newTranslation.name.trim()) {
      return;
    }
    setAddingTranslation(true);
    try {
      await addTranslation.mutateAsync({
        moduleId,
        payload: {
          language_id: newTranslation.language_id,
          title: newTranslation.name.trim(),
          name: newTranslation.name.trim(),
          description: newTranslation.description.trim() || undefined,
          logo_banner:
            newTranslation.iconFile instanceof File ? newTranslation.iconFile : undefined,
        },
      });
      // Add translation to local state
      setTranslationStates((prev) => ({
        ...prev,
        [newTranslation.language_id!]: {
          language_id: newTranslation.language_id!,
          name: newTranslation.name.trim(),
          description: newTranslation.description.trim(),
          existingBannerUrl: null,
          iconFile: null,
          iconPreview: null,
          saving: false,
          error: null,
          success: true,
        },
      }));
      setNewTranslation({ language_id: null, name: "", description: "" });
      setShowAddTranslation(false);
    } catch (err) {
      /* surface error inline */
    } finally {
      setAddingTranslation(false);
    }
  };

  /* ─── File pick helper for edit rows ─── */
  function TranslationFileInput({
    langId,
    state,
  }: {
    langId: number;
    state: TranslationEditState;
  }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const hasIcon = state.iconPreview || state.existingBannerUrl;
    const previewSrc =
      state.iconPreview ?? (state.existingBannerUrl ? getContentAssetUrl(state.existingBannerUrl) : null);

    const handleFile = (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      updateTrState(langId, { iconFile: file, iconPreview: url });
    };

    return (
      <div>
        <label className={inputLabelClass}>{t("translationIcon") ?? "Logo Banner"}</label>
        <input
          ref={fileRef}
          accept="image/*"
          className="sr-only"
          type="file"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div
          className={clsx(
            "rounded-lg border-2 border-dashed min-h-[110px] flex flex-col items-center justify-center gap-2 p-3 cursor-pointer transition-colors text-center",
            hasIcon
              ? "border-blue-500 bg-gray-100/50"
              : "border-[#e5e7eb] bg-gray-50/80 hover:border-blue-400/60 hover:bg-gray-100/50"
          )}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
        >
          {previewSrc ? (
            <>
              <img
                alt=""
                className="w-14 h-14 rounded-lg object-cover border border-[#e5e7eb]"
                src={previewSrc}
              />
              <span className="text-[10px] text-gray-500">
                {t("clickToChange") ?? "Click to change"}
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[10px] text-gray-500">
                {t("uploadIcon") ?? "Upload or drag & drop"}
              </span>
            </>
          )}
        </div>
        {state.iconFile && (
          <button
            className="mt-1 text-[10px] text-red-500 hover:underline"
            type="button"
            onClick={() => updateTrState(langId, { iconFile: null, iconPreview: null })}
          >
            {tCommon("remove") ?? "Remove"}
          </button>
        )}
      </div>
    );
  }

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        {tCommon("loading") ?? "Loading…"}
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500 text-sm">
        {t("notFound") ?? "Module not found."}
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col gap-4", isRtl && "text-right")}>
      {/* ── MODULE FIELDS CARD ── */}
      <form className="bg-white rounded-xl p-5" onSubmit={handleSaveModule}>
        <h2 className="text-xl font-semibold mb-1 text-gray-900">
          {t("editModuleTitle") ?? "Edit Module"}
        </h2>
        <p className="text-gray-500 mb-8 text-xs">
          {t("editModuleSubtitle") ?? "Update module details below."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Code */}
          <div className={inputGroupClass}>
            <label className={inputLabelClass} htmlFor="edit-code">
              {t("moduleCode")}
            </label>
            <Input
              classNames={{
                base: "w-full",
                input: "text-xs",
                inputWrapper: inputFieldWrapperClass,
              }}
              id="edit-code"
              placeholder={t("moduleCodePlaceholder")}
              value={code}
              onValueChange={setCode}
            />
            <p className="text-xs text-gray-500 mt-1">{t("moduleCodeHint")}</p>
          </div>

          {/* Category */}
          <div className={inputGroupClass}>
            <label className={inputLabelClass} htmlFor="edit-category">
              {t("moduleCategory")}
            </label>
            <Select
              classNames={{
                trigger:
                  "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-xs px-4",
              }}
              id="edit-category"
              placeholder={
                categoriesLoading ? (t("loading") ?? "Loading…") : t("categoryPlaceholder")
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
            <label className={inputLabelClass} htmlFor="edit-difficulty">
              {t("difficulty")}
            </label>
            <Select
              classNames={{
                trigger:
                  "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-xs px-4",
              }}
              id="edit-difficulty"
              selectedKeys={difficulty ? [difficulty] : []}
              onSelectionChange={(keys) => {
                const v =
                  keys === "all" || !keys
                    ? "1"
                    : ((Array.from(keys as Iterable<string>)[0] as string) ?? "1");
                setDifficulty(v);
              }}
            >
              {["1", "2", "3", "4", "5"].map((lvl) => (
                <SelectItem key={lvl} textValue={t(`difficultyLevels.${lvl}`)}>
                  {t(`difficultyLevels.${lvl}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 mb-3" role="alert">
            <p className="text-xs text-red-600">{formError}</p>
          </div>
        )}
        {formSuccess && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 mb-3" role="status">
            <p className="text-xs text-green-700">{formSuccess}</p>
          </div>
        )}

        <div className={clsx("flex gap-3", isRtl ? "flex-row-reverse" : "flex-row")}>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2 text-xs font-semibold"
            isLoading={updateModule.isPending}
            type="submit"
          >
            {t("save") ?? "Save"}
          </Button>
          <Button
            className="rounded-full px-6 py-2 text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            type="button"
            variant="bordered"
            onPress={() => router.push(backHref)}
          >
            {tCommon("cancel") ?? "Cancel"}
          </Button>
        </div>
      </form>

      {/* ── MODULE TRANSLATIONS CARD ── */}
      <div className="bg-white rounded-xl p-5">
        <div className={clsx("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("moduleTranslation") ?? "Module Translation"}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {t("moduleTranslationSubtitle") ??
                "Add your module name and description in its relevant language."}
            </p>
          </div>
          <Button
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-4 py-1.5 text-xs font-medium"
            size="sm"
            type="button"
            onPress={() => {
              setShowAddTranslation(true);
              setEditingTranslationId(null);
            }}
          >
            + {t("addTranslation") ?? "Add Translation"}
          </Button>
        </div>

        {/* ── EXISTING TRANSLATIONS TABLE ── */}
        {Object.keys(translationStates).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    {t("tableLanguage") ?? "Language"}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    {t("tableName") ?? "Name"}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                    {t("tableDescription") ?? "Description"}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                    {t("tableLogoBanner") ?? "Logo Banner"}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    {t("tableStatus") ?? "Status"}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.values(translationStates).map((st) => (
                  <>
                    {/* ── ROW ── */}
                    <tr key={`row-${st.language_id}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">
                            {getLanguageFlag(st.language_id)}
                          </span>
                          <span className="font-medium text-gray-800">
                            {getLanguageName(st.language_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                        {st.name || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate hidden md:table-cell">
                        {st.description || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {(st.iconPreview ?? st.existingBannerUrl) ? (
                          <img
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            src={
                              st.iconPreview ??
                              getContentAssetUrl(st.existingBannerUrl!)
                            }
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {st.success ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                            ✓ {tCommon("saved") ?? "Saved"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
                            {t("statusActive") ?? "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          className="rounded-full bg-gray-800 text-white text-[10px] font-medium px-3 h-7 min-w-0"
                          size="sm"
                          type="button"
                          onPress={() =>
                            setEditingTranslationId((prev) =>
                              prev === st.language_id ? null : st.language_id
                            )
                          }
                        >
                          {editingTranslationId === st.language_id
                            ? (tCommon("close") ?? "Close")
                            : (t("editTranslation") ?? "Edit")}
                        </Button>
                      </td>
                    </tr>

                    {/* ── INLINE EDIT PANEL ── */}
                    {editingTranslationId === st.language_id && (
                      <tr key={`edit-${st.language_id}`}>
                        <td className="bg-gray-50/80 px-4 py-4" colSpan={6}>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Name */}
                            <div className="lg:col-span-2 space-y-3">
                              <div className={inputGroupClass}>
                                <label className={inputLabelClass}>{t("moduleName")}</label>
                                <Input
                                  classNames={{
                                    base: "w-full",
                                    input: "text-xs",
                                    inputWrapper: inputFieldWrapperClass,
                                  }}
                                  value={st.name}
                                  onValueChange={(v) =>
                                    updateTrState(st.language_id, { name: v, error: null, success: false })
                                  }
                                />
                              </div>
                              <div className={inputGroupClass}>
                                <label className={inputLabelClass}>
                                  {t("moduleDescription")}
                                </label>
                                <Textarea
                                  classNames={{
                                    base: "w-full",
                                    input: "text-xs",
                                    inputWrapper:
                                      "rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3 min-h-0",
                                  }}
                                  minRows={2}
                                  value={st.description}
                                  onValueChange={(v) =>
                                    updateTrState(st.language_id, { description: v, success: false })
                                  }
                                />
                              </div>
                              {st.error && (
                                <p className="text-xs text-red-500">{st.error}</p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 py-1.5 text-xs font-semibold"
                                  isLoading={st.saving}
                                  size="sm"
                                  type="button"
                                  onPress={() => handleSaveTranslation(st.language_id)}
                                >
                                  {t("save") ?? "Save"}
                                </Button>
                                <Button
                                  className="rounded-full px-4 py-1.5 text-xs border border-gray-300 text-gray-700"
                                  size="sm"
                                  type="button"
                                  variant="bordered"
                                  onPress={() => setEditingTranslationId(null)}
                                >
                                  {tCommon("cancel") ?? "Cancel"}
                                </Button>
                              </div>
                            </div>

                            {/* File upload */}
                            <TranslationFileInput langId={st.language_id} state={st} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4">
            {t("noTranslations") ?? "No translations yet. Add one below."}
          </p>
        )}

        {/* ── ADD NEW TRANSLATION PANEL ── */}
        {showAddTranslation && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              {t("addTranslation") ?? "Add Translation"}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                {/* Language dropdown */}
                <div className={inputGroupClass}>
                  <label className={inputLabelClass}>{t("selectLanguage") ?? "Language"}</label>
                  <Select
                    classNames={{
                      trigger:
                        "h-10 min-h-10 rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 text-xs px-4",
                    }}
                    placeholder={t("selectLanguage") ?? "Select language"}
                    selectedKeys={
                      newTranslation.language_id ? [String(newTranslation.language_id)] : []
                    }
                    onSelectionChange={(keys) => {
                      const v =
                        keys === "all" || !keys
                          ? null
                          : Number((Array.from(keys as Iterable<string>)[0] as string) ?? "");
                      setNewTranslation((prev) => ({ ...prev, language_id: v }));
                    }}
                  >
                    {SUPPORTED_LANGUAGES.filter(
                      (l) => !existingLangIds.includes(l.id)
                    ).map((lang) => (
                      <SelectItem key={String(lang.id)} textValue={lang.name}>
                        <span className="flex items-center gap-2">
                          <span>{getLanguageFlag(lang.id)}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Name */}
                <div className={inputGroupClass}>
                  <label className={inputLabelClass}>{t("moduleName")}</label>
                  <Input
                    classNames={{
                      base: "w-full",
                      input: "text-xs",
                      inputWrapper: inputFieldWrapperClass,
                    }}
                    placeholder={t("moduleNamePlaceholder")}
                    value={newTranslation.name}
                    onValueChange={(v) =>
                      setNewTranslation((prev) => ({ ...prev, name: v }))
                    }
                  />
                </div>

                {/* Description */}
                <div className={inputGroupClass}>
                  <label className={inputLabelClass}>{t("moduleDescription")}</label>
                  <Textarea
                    classNames={{
                      base: "w-full",
                      input: "text-xs",
                      inputWrapper:
                        "rounded-lg bg-white border border-[#e5e7eb] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3 min-h-0",
                    }}
                    minRows={2}
                    placeholder={t("moduleDescriptionPlaceholder")}
                    value={newTranslation.description}
                    onValueChange={(v) =>
                      setNewTranslation((prev) => ({ ...prev, description: v }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 py-1.5 text-xs font-semibold"
                    isDisabled={!newTranslation.language_id || !newTranslation.name.trim()}
                    isLoading={addingTranslation}
                    size="sm"
                    type="button"
                    onPress={handleAddNew}
                  >
                    {t("save") ?? "Save"}
                  </Button>
                  <Button
                    className="rounded-full px-4 py-1.5 text-xs border border-gray-300 text-gray-700"
                    size="sm"
                    type="button"
                    variant="bordered"
                    onPress={() => {
                      setShowAddTranslation(false);
                      setNewTranslation({ language_id: null, name: "", description: "" });
                    }}
                  >
                    {tCommon("cancel") ?? "Cancel"}
                  </Button>
                </div>
              </div>

              {/* File upload for new translation */}
              <div>
                <label className={inputLabelClass}>{t("translationIcon") ?? "Logo Banner"}</label>
                <NewTranslationFileInput
                  preview={newTranslation.iconPreview ?? null}
                  onFile={(file, preview) =>
                    setNewTranslation((prev) => ({
                      ...prev,
                      iconFile: file,
                      iconPreview: preview,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Standalone file input used only for the new-translation panel */
function NewTranslationFileInput({
  preview,
  onFile,
}: {
  preview: string | null;
  onFile: (file: File | null, preview: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("module");

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    onFile(file, URL.createObjectURL(file));
  };

  return (
    <>
      <input
        ref={fileRef}
        accept="image/*"
        className="sr-only"
        type="file"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        className={clsx(
          "rounded-lg border-2 border-dashed min-h-[110px] flex flex-col items-center justify-center gap-2 p-3 cursor-pointer transition-colors text-center",
          preview
            ? "border-blue-500 bg-gray-100/50"
            : "border-[#e5e7eb] bg-gray-50/80 hover:border-blue-400/60 hover:bg-gray-100/50"
        )}
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
      >
        {preview ? (
          <>
            <img
              alt=""
              className="w-14 h-14 rounded-lg object-cover border border-[#e5e7eb]"
              src={preview}
            />
            <span className="text-[10px] text-gray-500">
              {t("clickToChange") ?? "Click to change"}
            </span>
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span className="text-[10px] text-gray-500">
              {t("uploadIcon") ?? "Upload or drag & drop"}
            </span>
          </>
        )}
      </div>
      {preview && (
        <button
          className="mt-1 text-[10px] text-red-500 hover:underline"
          type="button"
          onClick={() => onFile(null, null)}
        >
          Remove
        </button>
      )}
    </>
  );
}
