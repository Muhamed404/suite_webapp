"use client";

import type { ModuleLocale } from "../module/module-language-selector";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import {
  ContentTypeSelector,
  type ContentType,
  CONTENT_TYPE_TO_ID,
  CONTENT_TYPE_LABEL_KEYS,
} from "./content-type-selector";
import { ContentForm, type ContentTranslation } from "./content-form";

import { CONTENT_TYPES } from "@/constants/content-types";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModules } from "@/hooks/useQuiz";
import { useCreateContent } from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";
import { getLanguageId } from "@/utils/languageMapping";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

/** Minimal upload icon for dropzones */
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createEmptyTranslation(lang: ModuleLocale): ContentTranslation {
  return {
    lang,
    title: "",
    content: "",
    summary: "",
  };
}

export interface CreateContentFormProps {
  /** Pre-fill module when opened from module context (e.g. Training Library > Module > Add Content) */
  initialModuleId?: string;
  /** Pre-fill content type when opened for a specific type */
  initialContentType?: ContentType | null;
  /** Pre-fill content type by ID from API (e.g. from ?type= query). Used when content types come from Suite API. */
  initialContentTypeId?: number;
  /** Breadcrumb links: [{ label, href }]. If not provided, default breadcrumb is used. */
  breadcrumbLinks?: Array<{ label: string; href: string }>;
  /** Link for "Add New" / back button when in module context */
  returnHref?: string;
}

export function CreateContentForm({
  initialModuleId = "",
  initialContentType = null,
  initialContentTypeId,
  breadcrumbLinks,
  returnHref,
}: CreateContentFormProps = {}) {
  const t = useTranslations("content");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const router = useRouter();
  const apiContentTypes = CONTENT_TYPES;
  const useApiContentTypes = true;

  const [moduleId, setModuleId] = useState<string>(initialModuleId);
  const [contentType, setContentType] = useState<ContentType | null>(initialContentType);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<number | null>(
    initialContentTypeId ?? null
  );

  useEffect(() => {
    if (initialModuleId) setModuleId(initialModuleId);
    if (initialContentType) setContentType(initialContentType);
  }, [initialModuleId, initialContentType]);

  useEffect(() => {
    if (useApiContentTypes && initialContentTypeId != null) {
      setSelectedContentTypeId(initialContentTypeId);
    }
  }, [useApiContentTypes, initialContentTypeId]);

  const selectedApiContentType =
    useApiContentTypes && selectedContentTypeId != null
      ? apiContentTypes.find((ct) => ct.id === selectedContentTypeId)
      : null;
  const allowsFileUpload = selectedApiContentType?.allowsFileUpload ?? true;

  useEffect(() => {
    if (useApiContentTypes) {
      const ct = apiContentTypes.find((c) => c.id === selectedContentTypeId);
      const allowFile = ct?.allowsFileUpload ?? true;

      setSourceType(allowFile ? "file" : "url");
      setSourceUrl("");
      setSourceFile(null);
      setSourcePreview(null);
      setQuizExcelFile(null);
      if (quizExcelInputRef.current) quizExcelInputRef.current.value = "";
    }
  }, [useApiContentTypes, selectedContentTypeId, apiContentTypes]);

  const [language, setLanguage] = useState<ModuleLocale>("en");
  const [translation, setTranslation] = useState<ContentTranslation>(createEmptyTranslation("en"));
  const [duration, setDuration] = useState<number>(0);
  const [sourceType, setSourceType] = useState<"file" | "url">("file");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [quizExcelFile, setQuizExcelFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [lastCreatedWasQuiz, setLastCreatedWasQuiz] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const quizExcelInputRef = useRef<HTMLInputElement>(null);

  /** True when selected content type is Quiz (static or API) */
  const isQuizType =
    useApiContentTypes && selectedContentTypeId != null
      ? (apiContentTypes
          .find((ct) => ct.id === selectedContentTypeId)
          ?.name?.toLowerCase()
          .includes("quiz") ?? false)
      : contentType === "Quiz";

  const { data: modulesRes } = useModules();
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];
  const createContent = useCreateContent();

  const backHref =
    returnHref ??
    (moduleId ? `/dashboard/training-library/system/${moduleId}` : "/dashboard/module");

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys ? "" : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

    setModuleId(v);
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setContentType(type);
    setTranslation(createEmptyTranslation(language));
    setSourceType("file");
    setSourceUrl("");
    setSourceFile(null);
    setSourcePreview(null);
    setQuizExcelFile(null);
    if (quizExcelInputRef.current) quizExcelInputRef.current.value = "";
  };

  const handleLanguageChange = (lang: ModuleLocale) => {
    setLanguage(lang);
    setTranslation(createEmptyTranslation(lang));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file || !file.type.startsWith("image/")) {
      if (!file) {
        setLogoFile(null);
        setLogoPreview(null);
      }

      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];

    if (!file || !file.type.startsWith("image/")) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setSourceFile(null);
      setSourcePreview(null);

      return;
    }
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
  };

  const handleSourceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];

    if (!file) return;
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const clearSource = () => {
    setSourceFile(null);
    setSourcePreview(null);
    if (sourceInputRef.current) sourceInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!moduleId) {
      setFormError(t("validationModule"));

      return;
    }

    const effectiveContentTypeId = useApiContentTypes
      ? selectedContentTypeId
      : contentType != null
        ? CONTENT_TYPE_TO_ID[contentType]
        : null;

    if (effectiveContentTypeId == null) {
      setFormError(t("validationContentType"));

      return;
    }

    if (!translation.title.trim()) {
      setFormError(t("validationTitle"));

      return;
    }

    const requiresFileOrUrl = useApiContentTypes
      ? true
      : ["iSpring", "PDF", "Video", "Brochure", "Screen Saver", "Poster", "Game"].includes(
          contentType!
        );

    if (!isQuizType && requiresFileOrUrl) {
      if (!allowsFileUpload) {
        if (!sourceUrl?.trim()) {
          setFormError(t("validationFileOrUrl"));

          return;
        }
      } else {
        const hasFile = !!sourceFile;
        const hasUrl = sourceType === "url" && !!sourceUrl?.trim();

        if (!hasFile && !hasUrl) {
          setFormError(t("validationFileOrUrl"));

          return;
        }
      }
    }

    try {
      const payload = {
        mod_id: Number(moduleId),
        content_type_id: effectiveContentTypeId,
        lang_id: getLanguageId(translation.lang),
        name: translation.title.trim(),
        order: 1, // TODO: Calculate based on existing contents
        duration: duration || undefined,
        org_id: 0, // Will be set by backend from JWT token
        logo: isQuizType ? undefined : logoFile || undefined,
        source: isQuizType
          ? undefined
          : allowsFileUpload && sourceType === "file"
            ? sourceFile || undefined
            : undefined,
        source_url: isQuizType
          ? undefined
          : !allowsFileUpload
            ? sourceUrl?.trim() || undefined
            : sourceType === "url"
              ? sourceUrl?.trim() || undefined
              : undefined,
        translations: [
          {
            language_id: getLanguageId(translation.lang),
            title: translation.title.trim(),
            content: translation.content?.trim() || undefined,
            summary: translation.summary?.trim() || undefined,
          },
        ],
      };

      await createContent.mutateAsync(payload);

      setFormSuccess(t("createSuccess"));
      setLastCreatedWasQuiz(isQuizType);

      // Redirect to module details page after success
      setTimeout(() => {
        router.push(backHref);
      }, 1500);

      // Reset form (optional if redirecting)
      setModuleId("");
      setContentType(null);
      setSelectedContentTypeId(null);
      setLanguage("en");
      setTranslation(createEmptyTranslation("en"));
      setDuration(0);
      setSourceType("file");
      setSourceUrl("");
      setLogoFile(null);
      setSourceFile(null);
      setQuizExcelFile(null);
      setLogoPreview(null);
      setSourcePreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (sourceInputRef.current) sourceInputRef.current.value = "";
      if (quizExcelInputRef.current) quizExcelInputRef.current.value = "";
    } catch (err) {
      const msg = getApiErrorMessage(err, tCommon, {
        defaultKey: "errors.unknown",
        defaultValue: t("createError"),
      });

      setFormError(msg);
    }
  };

  const handleCancel = () => {
    setModuleId("");
    setContentType(null);
    setSelectedContentTypeId(null);
    setLanguage("en");
    setTranslation(createEmptyTranslation("en"));
    setDuration(0);
    setSourceType("file");
    setSourceUrl("");
    setLogoFile(null);
    setSourceFile(null);
    setQuizExcelFile(null);
    setLogoPreview(null);
    setSourcePreview(null);
    setFormError(null);
    setFormSuccess(null);
    setLastCreatedWasQuiz(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (sourceInputRef.current) sourceInputRef.current.value = "";
    if (quizExcelInputRef.current) quizExcelInputRef.current.value = "";
  };

  const isSubmitting = createContent.isPending;
  const selectedContentTypeName =
    useApiContentTypes && selectedContentTypeId != null
      ? apiContentTypes.find((t) => t.id === selectedContentTypeId)?.name
      : null;
  const requiresFileOrUrlForDisplay =
    useApiContentTypes && selectedContentTypeId != null
      ? true
      : contentType
        ? [
            "iSpring",
            "PDF",
            "Video",
            "Brochure",
            "Screen Saver",
            "Poster",
            "Game",
            "Misc",
          ].includes(contentType)
        : false;
  const showUrlOnly = requiresFileOrUrlForDisplay && !allowsFileUpload;
  const showFileOrUrlChoice = requiresFileOrUrlForDisplay && allowsFileUpload;

  const quizFormHref =
    returnHref && moduleId
      ? `${returnHref.replace(/\/$/, "")}/quizzes/create`
      : moduleId
        ? `/dashboard/training-library/system/${moduleId}/quizzes/create`
        : "/dashboard/quiz/create";

  const showModuleSelector = !initialModuleId;

  /** Resolve upload heading label: use translation key for static types, match API name to label or fallback to name */
  const uploadHeadingLabel = (() => {
    if (selectedContentTypeName) {
      const n = selectedContentTypeName.toLowerCase().trim();
      const keyMap: Record<string, string> = {
        "interactive contents": "contentTypes.interactiveContents",
        "motion videos": "contentTypes.motionVideos",
        brochures: "contentTypes.brochures",
        brochure: "contentTypes.brochure",
        posters: "contentTypes.posters",
        poster: "contentTypes.poster",
        "screen savers": "contentTypes.screenSavers",
        "screen saver": "contentTypes.screenSaver",
        games: "contentTypes.games",
        game: "contentTypes.game",
        documents: "contentTypes.documents",
        document: "contentTypes.pdf",
        misc: "contentTypes.misc",
        "vr games": "contentTypes.vrGames",
        video: "contentTypes.video",
        pdf: "contentTypes.pdf",
        quiz: "contentTypes.quiz",
        "manual quiz": "contentTypes.quiz",
        ispring: "contentTypes.iSpring",
        "interactive lesson": "contentTypes.iSpring",
        "interactive content": "contentTypes.iSpring",
        text: "contentTypes.misc",
        article: "contentTypes.misc",
      };
      const key = keyMap[n];

      if (key) {
        const translated = t(key);

        if (translated && translated !== key) return translated;
      }

      return selectedContentTypeName;
    }
    if (contentType && CONTENT_TYPE_LABEL_KEYS[contentType]) {
      return t(CONTENT_TYPE_LABEL_KEYS[contentType]);
    }

    return null;
  })();

  return (
    <div className={clsx("flex flex-col p-3 max-w-6xl mx-auto w-full", isRtl && "text-right")}>
      {/* Breadcrumb — text-xs text-gray-500, last item font-semibold text-gray-900 */}
      <nav
        className={clsx(
          "flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0",
          isRtl && "flex-row-reverse"
        )}
      >
        {breadcrumbLinks?.length ? (
          <>
            {breadcrumbLinks.map((link, i) => (
              <span key={link.href} className="contents">
                {i > 0 && <span className="text-gray-400">›</span>}
                <Link className="hover:text-gray-700 transition" href={link.href}>
                  {link.label}
                </Link>
              </span>
            ))}
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{t("breadcrumb.newContent")}</span>
          </>
        ) : (
          <>
            <Link
              className="hover:text-gray-700 transition"
              href="/dashboard/training-library/system"
            >
              {t("breadcrumb.trainingLibrary")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link className="hover:text-gray-700 transition" href="/dashboard/module">
              {t("breadcrumb.systemLibrary")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{t("breadcrumb.newContent")}</span>
          </>
        )}
      </nav>

      {/* Header — h3 text-xl font-semibold, subtitle text-gray-500 text-xs, Add New btn #3FBDFF */}
      <div className={clsx("flex flex-col gap-0.5 p-3 py-0", isRtl && "flex-row-reverse")}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <h3 className="text-xl font-semibold text-gray-900">{t("title")}</h3>
            <p className="text-gray-500 text-xs">{t("subtitle")}</p>
          </div>
          <div className="text-xs">
            <Button
              as={Link}
              className="flex items-center justify-center gap-2 px-8 max-sm:px-1.5 py-2 rounded-full bg-[#3FBDFF] text-white border border-transparent transition-all duration-300 hover:bg-[var(--mainblue)] hover:border-[var(--mainblue)]"
              href={backHref}
              radius="full"
              size="md"
            >
              <Image
                alt=""
                height={12}
                src={getContentAssetUrl("/images/img/add.svg")}
                width={12}
              />
              <span className="md:flex hidden text-xs">{t("addNew")}</span>
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Module selector: only when not in module context */}
        {showModuleSelector && (
          <section className="rounded-2xl border border-[var(--strokeGray)] bg-white p-5 mb-4 shadow-sm">
            <label className="block text-gray-700 mb-1.5 font-medium text-xs">
              {t("selectModule")}
            </label>
            <Select
              classNames={{
                trigger:
                  "h-9 min-h-9 rounded-full bg-white border border-gray-200 focus-within:border-[#32B8FF] transition-colors text-xs px-4",
              }}
              placeholder={t("modulePlaceholder")}
              selectedKeys={moduleId ? [moduleId] : []}
              onSelectionChange={handleModuleChange}
            >
              {modules.map((m) => {
                const name = m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;

                return (
                  <SelectItem key={String(m.id)} textValue={name}>
                    {name}
                  </SelectItem>
                );
              })}
            </Select>
          </section>
        )}

        {/* Content type cards strip — horizontal scroll, w-24 h-24 rounded-lg */}
        <div className="mt-6 mb-4 px-3">
          {useApiContentTypes ? (
            <ContentTypeSelector
              hideLabel
              apiContentTypes={apiContentTypes}
              cardClassName="rounded-lg"
              containerClassName="gap-2 min-w-max h-[99px] items-center px-1"
              quizLink={quizFormHref}
              selectedContentTypeId={selectedContentTypeId}
              onSelectContentTypeId={setSelectedContentTypeId}
            />
          ) : (
            <ContentTypeSelector
              hideLabel
              cardClassName="rounded-lg"
              containerClassName="gap-2 min-w-max h-[99px] items-center px-1"
              quizLink={quizFormHref}
              selectedType={contentType}
              onSelect={handleContentTypeSelect}
            />
          )}
        </div>

        {/* Main upload container — bg-white rounded-2xl shadow-sm p-5 */}
        <section className="bg-white rounded-2xl shadow-sm p-5 mx-3">
          <div className="flex gap-5 flex-col lg:flex-row">
            {/* Left: Upload title + Language + form (space-y-3 text-xs) */}
            <div className="flex-1 pr-4">
              <div className="flex items-start justify-between">
                <div className="w-full pr-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-2" id="uploadTitle">
                    {uploadHeadingLabel
                      ? `${t("uploadTitle")} ${uploadHeadingLabel}`
                      : t("selectContentType")}
                  </h3>

                  <label className="text-xs text-gray-600 block">{t("selectLanguage")}</label>
                  <div className="relative mt-1.5 mb-3">
                    <Select
                      classNames={{
                        trigger:
                          "w-full h-9 min-h-9 rounded-lg bg-white border border-gray-200 focus-within:border-[#32B8FF] text-xs px-3",
                      }}
                      selectedKeys={[language]}
                      onSelectionChange={(keys) => {
                        const v =
                          keys === "all" || !keys
                            ? "en"
                            : ((Array.from(keys as Iterable<string>)[0] as ModuleLocale) ?? "en");

                        handleLanguageChange(v);
                      }}
                    >
                      {[
                        { value: "en" as const, key: "languages.en" },
                        { value: "ar" as const, key: "languages.ar" },
                        { value: "ur" as const, key: "languages.ur" },
                        { value: "zh" as const, key: "languages.zh" },
                        { value: "ru" as const, key: "languages.ru" },
                      ].map(({ value, key }) => (
                        <SelectItem key={value} textValue={t(key)}>
                          {t(key)}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-3 text-xs" id="leftForm">
                    {!selectedContentTypeName && !contentType ? (
                      <p className="text-gray-400">{t("selectContentType")}</p>
                    ) : isQuizType ? (
                      <>
                        <ContentForm
                          hideLanguage
                          contentType="Quiz"
                          language={language}
                          showDescription={false}
                          translation={translation}
                          onLanguageChange={handleLanguageChange}
                          onTranslationChange={setTranslation}
                        />
                        <p className="text-xs text-gray-600">{t("quizMinimalTitle")}</p>
                        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                          <p className="text-xs text-gray-700 font-medium">{t("quizOptions")}</p>
                          <div>
                            <label className="block text-xs text-gray-600 font-medium mb-1.5">
                              {t("quizImportExcel")}
                            </label>
                            <input
                              ref={quizExcelInputRef}
                              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                              className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#32B8FF] file:px-3 file:py-1.5 file:text-xs file:text-white file:cursor-pointer"
                              type="file"
                              onChange={(e) => setQuizExcelFile(e.target.files?.[0] ?? null)}
                            />
                            <p className="text-xs text-gray-500 mt-1">{t("quizImportExcelHint")}</p>
                          </div>
                          <p className="text-xs text-gray-600">{t("quizOr")}</p>
                          <Link
                            className="inline-flex items-center gap-2 text-xs font-medium text-[#32B8FF] hover:underline"
                            href={quizFormHref}
                          >
                            {t("quizGoToForm")}
                          </Link>
                          <p className="text-xs text-gray-500">{t("quizGoToFormHint")}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ContentForm
                          hideLanguage
                          contentType={
                            contentType ??
                            (useApiContentTypes && selectedContentTypeId != null ? "Misc" : null)
                          }
                          language={language}
                          translation={translation}
                          onLanguageChange={handleLanguageChange}
                          onTranslationChange={setTranslation}
                        />
                        {(showUrlOnly || showFileOrUrlChoice) && (
                          <div className="space-y-3">
                            <label className="block text-xs text-gray-600 font-medium mb-1.5">
                              {showUrlOnly
                                ? t("sourceUrl")
                                : `${t("sourceFile")} / ${t("sourceUrl")}`}
                            </label>
                            {showFileOrUrlChoice && (
                              <div className="flex gap-4 flex-wrap">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    checked={sourceType === "file"}
                                    className="rounded-full border-gray-300 text-[#32B8FF] focus:ring-[#32B8FF]"
                                    name="sourceType"
                                    type="radio"
                                    onChange={() => setSourceType("file")}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {t("sourceTypeFile")}
                                  </span>
                                </label>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    checked={sourceType === "url"}
                                    className="rounded-full border-gray-300 text-[#32B8FF] focus:ring-[#32B8FF]"
                                    name="sourceType"
                                    type="radio"
                                    onChange={() => setSourceType("url")}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {t("sourceTypeUrl")}
                                  </span>
                                </label>
                              </div>
                            )}
                            {(showUrlOnly || sourceType === "url") && (
                              <input
                                className="w-full min-h-9 h-9 rounded-lg bg-white border border-gray-200 focus:border-[#32B8FF] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(50,184,255,0.1)] transition-colors px-3 text-xs outline-none placeholder:text-gray-400"
                                placeholder={t("sourceUrlPlaceholder")}
                                type="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Logo Preview + File Preview (dashed-preview, only for non-Quiz) */}
            {!isQuizType && (
              <div className="w-full lg:w-1/3 border-l border-gray-200 pl-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm">{t("logo")}</h4>
                  <input
                    ref={logoInputRef}
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={handleLogoFileChange}
                  />
                  <div
                    className={clsx(
                      "dashed-preview rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] transition-colors cursor-pointer",
                      logoFile && "border-[#32B8FF] bg-[var(--gray)]/20"
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleLogoDrop}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        logoInputRef.current?.click();
                      }
                    }}
                  >
                    {logoFile && logoPreview ? (
                      <>
                        <img
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border border-[var(--strokeGray)]"
                          src={logoPreview}
                        />
                        <p className="text-[14px] text-[var(--darkgray)] truncate max-w-full px-2">
                          {logoFile.name}
                        </p>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            className="text-[14px] text-[var(--blue)] rounded-full"
                            size="sm"
                            variant="flat"
                            onPress={() => logoInputRef.current?.click()}
                          >
                            {t("change")}
                          </Button>
                          <Button
                            className="text-[14px] text-red-500 rounded-full"
                            size="sm"
                            variant="light"
                            onPress={clearLogo}
                          >
                            {t("clear")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg
                          aria-hidden
                          className="w-8 h-8 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect height="18" rx="4" width="18" x="3" y="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5-7 7" />
                        </svg>
                      </>
                    )}
                  </div>
                </div>

                {/* File Preview: only show when file upload is allowed and source is File */}
                {showFileOrUrlChoice && sourceType === "file" && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">{t("sourceFile")}</h4>
                    <input
                      ref={sourceInputRef}
                      accept={
                        contentType === "Video"
                          ? "video/*"
                          : contentType === "PDF"
                            ? "application/pdf"
                            : contentType === "iSpring"
                              ? ".zip,.html"
                              : "*/*"
                      }
                      className="sr-only"
                      type="file"
                      onChange={handleSourceFileChange}
                    />
                    <div
                      className={clsx(
                        "dashed-preview rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] transition-colors cursor-pointer",
                        sourceFile && "border-[#32B8FF] bg-[var(--gray)]/20"
                      )}
                      role="button"
                      tabIndex={0}
                      onClick={() => sourceInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleSourceDrop}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          sourceInputRef.current?.click();
                        }
                      }}
                    >
                      {sourceFile ? (
                        <>
                          <UploadIcon className="w-10 h-10 text-[var(--darkgray)]/60" />
                          <p className="text-[14px] text-[var(--darkgray)] text-center truncate max-w-full px-2">
                            {sourceFile.name}
                          </p>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              className="text-[14px] text-[var(--blue)] rounded-full"
                              size="sm"
                              variant="flat"
                              onPress={() => sourceInputRef.current?.click()}
                            >
                              {t("change")}
                            </Button>
                            <Button
                              className="text-[14px] text-red-500 rounded-full"
                              size="sm"
                              variant="light"
                              onPress={clearSource}
                            >
                              {t("clear")}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="w-10 h-10 text-[var(--darkgray)]/60" />
                          <span className="text-[14px] text-[var(--darkgray)] text-center">
                            {t("dropzoneHint")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — border-t border-gray-100, Cancel + Submit */}
          <div
            className={clsx(
              "mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2",
              isRtl && "flex-row-reverse"
            )}
          >
            <Button
              className="px-6 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium"
              isDisabled={isSubmitting}
              radius="full"
              type="button"
              onPress={handleCancel}
            >
              {t("cancel")}
            </Button>
            <Button
              className="px-6 py-2 rounded-full bg-[#32B8FF] text-white hover:bg-[#26aee6] text-xs font-medium"
              isLoading={isSubmitting}
              radius="full"
              type="submit"
            >
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </div>
        </section>

        {formError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6 mx-3" role="alert">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}
        {formSuccess && (
          <div
            className="rounded-2xl border border-green-200 bg-green-50 p-4 mb-6 mx-3"
            role="status"
          >
            <p className="text-sm text-green-700">{formSuccess}</p>
            {lastCreatedWasQuiz && (
              <p className="text-sm text-green-700 mt-2">
                {t("quizSuccessAddQuestions")}{" "}
                <Link className="font-medium underline hover:no-underline" href={quizFormHref}>
                  {t("quizGoToForm")}
                </Link>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
