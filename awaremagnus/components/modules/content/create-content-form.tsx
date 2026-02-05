"use client";

import type { ModuleLocale } from "../module/module-language-selector";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import {
  ContentTypeSelector,
  type ContentType,
  CONTENT_TYPE_TO_ID,
} from "./content-type-selector";
import { useContentTypes } from "@/hooks/useSuiteAwm";
import { ContentForm, type ContentTranslation } from "./content-form";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModules } from "@/hooks/useQuiz";
import { useCreateContent } from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";
import { getLanguageId } from "@/utils/languageMapping";

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
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
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

  const { data: contentTypesList } = useContentTypes();
  const apiContentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const useApiContentTypes = apiContentTypes.length > 0;

  const [moduleId, setModuleId] = useState<string>(initialModuleId);
  const [contentType, setContentType] = useState<ContentType | null>(initialContentType);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<number | null>(
    initialContentTypeId ?? null,
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

  useEffect(() => {
    if (useApiContentTypes) {
      setSourceType("file");
      setSourceUrl("");
      setSourceFile(null);
      setSourcePreview(null);
      setQuizExcelFile(null);
      if (quizExcelInputRef.current) quizExcelInputRef.current.value = "";
    }
  }, [useApiContentTypes, selectedContentTypeId]);

  const [language, setLanguage] = useState<ModuleLocale>("en");
  const [translation, setTranslation] = useState<ContentTranslation>(
    createEmptyTranslation("en"),
  );
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
      ? (apiContentTypes.find((ct) => ct.id === selectedContentTypeId)?.name
          ?.toLowerCase()
          .includes("quiz") ?? false)
      : contentType === "Quiz";

  const { data: modulesRes } = useModules({ status: 1 });
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];
  const createContent = useCreateContent();

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

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
      : [
          "iSpring",
          "PDF",
          "Video",
          "Brochure",
          "Screen Saver",
          "Poster",
          "Game",
        ].includes(contentType!);

    if (!isQuizType && requiresFileOrUrl) {
      const hasFile = !!sourceFile;
      const hasUrl = sourceType === "url" && !!sourceUrl?.trim();
      if (!hasFile && !hasUrl) {
        setFormError(t("validationFileOrUrl"));
        return;
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
        source:
          isQuizType ? undefined : sourceType === "file" ? sourceFile || undefined : undefined,
        source_url:
          isQuizType ? undefined : sourceType === "url" ? sourceUrl?.trim() || undefined : undefined,
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
      // Reset form
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

  const backHref = returnHref ?? "/dashboard/module";
  const quizFormHref =
    returnHref && moduleId
      ? `${returnHref.replace(/\/$/, "")}/quizzes/create`
      : moduleId
        ? `/dashboard/training-library/system/${moduleId}/quizzes/create`
        : "/dashboard/quiz/create";

  return (
    <div className={clsx("flex flex-col p-6 max-w-6xl mx-auto w-full", isRtl && "text-right")}>
      {/* Breadcrumb */}
      <nav
        className={clsx(
          "flex items-center text-sm text-[var(--darkgray)] gap-1.5 pb-4",
          isRtl && "flex-row-reverse",
        )}
      >
        {breadcrumbLinks?.length
          ? (
              <>
                {breadcrumbLinks.map((link, i) => (
                  <span key={link.href} className="contents">
                    {i > 0 && <span className="text-[var(--darkgray)]">›</span>}
                    <Link
                      className="hover:text-[var(--mainblue)] transition"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
                <span className="text-[var(--darkgray)]">›</span>
                <span className="font-semibold text-[var(--mainblue)]">
                  {t("breadcrumb.newContent")}
                </span>
              </>
            )
          : (
            <>
              <Link
                className="hover:text-[var(--mainblue)] transition"
                href="/dashboard/training-library/system"
              >
                {t("breadcrumb.trainingLibrary")}
              </Link>
              <span className="text-[var(--darkgray)]">›</span>
              <Link
                className="hover:text-[var(--mainblue)] transition"
                href="/dashboard/module"
              >
                {t("breadcrumb.systemLibrary")}
              </Link>
              <span className="text-[var(--darkgray)]">›</span>
              <span className="font-semibold text-[var(--mainblue)]">
                {t("breadcrumb.newContent")}
              </span>
            </>
          )}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col leading-tight">
          <h2 className="text-xl font-semibold text-[var(--mainblue)] mb-1">{t("title")}</h2>
          <p className="text-sm text-[var(--darkgray)]">{t("subtitle")}</p>
        </div>
        <Button
          as={Link}
          className="rounded-full bg-[var(--blue)] text-white text-sm font-medium h-11 px-6 hover:opacity-90 transition-opacity flex items-center gap-2"
          href={backHref}
          radius="full"
          size="md"
        >
          <Image alt="" height={12} src="/images/img/add.svg" width={12} />
          <span className="hidden md:inline">{t("addNew")}</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Module & Content Type Section */}
        <section className="rounded-2xl border border-[var(--strokeGray)] bg-white p-6 mb-6 shadow-none">
          <h3 className="text-xl font-semibold text-[var(--mainblue)] mb-6">
            {t("selectModule")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                {t("selectModule")}
              </label>
              <Select
                classNames={{
                  trigger:
                    "h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 text-[14px] px-5",
                }}
                placeholder={t("modulePlaceholder")}
                selectedKeys={moduleId ? [moduleId] : []}
                onSelectionChange={handleModuleChange}
              >
                {modules.map((m) => {
                  const name =
                    m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;

                  return (
                    <SelectItem key={String(m.id)} textValue={name}>
                      {name}
                    </SelectItem>
                  );
                })}
              </Select>
            </div>

            {/* Content Type Selector */}
            {useApiContentTypes ? (
              <ContentTypeSelector
                apiContentTypes={apiContentTypes}
                selectedContentTypeId={selectedContentTypeId}
                onSelectContentTypeId={setSelectedContentTypeId}
              />
            ) : (
              <ContentTypeSelector
                selectedType={contentType}
                onSelect={handleContentTypeSelect}
              />
            )}
          </div>
        </section>

        {/* Main Form Section */}
        <section className="rounded-2xl border border-[var(--strokeGray)] bg-white p-6 mb-6 shadow-none">
          <h3 className="text-xl font-semibold text-[var(--mainblue)] mb-1">
            {selectedContentTypeName
              ? `${t("uploadTitle")} ${selectedContentTypeName}`
              : contentType
                ? `${t("uploadTitle")} ${t(`contentTypes.${contentType}`)}`
                : t("selectContentType")}
          </h3>
          <p className="text-sm text-[var(--darkgray)] mb-6">
            {t("subtitle")}
          </p>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Left: fields — Quiz: minimal (language + title + Excel/Quiz Form); Others: full form + source type */}
            <div className="flex-1 space-y-4">
              {isQuizType ? (
                <>
                  <ContentForm
                    contentType="Quiz"
                    language={language}
                    translation={translation}
                    onLanguageChange={handleLanguageChange}
                    onTranslationChange={setTranslation}
                    showDescription={false}
                  />
                  <p className="text-sm text-[var(--darkgray)]">
                    {t("quizMinimalTitle")}
                  </p>
                  <div className="rounded-2xl border border-[var(--strokeGray)] bg-[var(--gray)]/20 p-4 space-y-4">
                    <p className="font-medium text-[var(--mainblue)] text-sm">
                      {t("quizOptions")}
                    </p>
                    <div>
                      <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                        {t("quizImportExcel")}
                      </label>
                      <input
                        ref={quizExcelInputRef}
                        accept=".xlsx,.xls"
                        className="block w-full text-sm text-[var(--darkgray)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--blue)] file:px-4 file:py-2 file:text-sm file:text-white file:cursor-pointer"
                        type="file"
                        onChange={(e) =>
                          setQuizExcelFile(e.target.files?.[0] ?? null)
                        }
                      />
                      <p className="text-xs text-[var(--darkgray)] mt-1">
                        {t("quizImportExcelHint")}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--darkgray)]">{t("quizOr")}</p>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--blue)] hover:underline"
                      href={quizFormHref}
                    >
                      {t("quizGoToForm")}
                    </Link>
                    <p className="text-xs text-[var(--darkgray)]">
                      {t("quizGoToFormHint")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ContentForm
                    contentType={
                      contentType ??
                      (useApiContentTypes && selectedContentTypeId != null
                        ? "Misc"
                        : null)
                    }
                    language={language}
                    translation={translation}
                    onLanguageChange={handleLanguageChange}
                    onTranslationChange={setTranslation}
                  />
                  {requiresFileOrUrlForDisplay && (
                    <div className="space-y-2">
                      <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                        {t("sourceFile")} / {t("sourceUrl")}
                      </label>
                      <div className="flex gap-4 flex-wrap">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sourceType"
                            checked={sourceType === "file"}
                            onChange={() => setSourceType("file")}
                            className="rounded-full border-[var(--strokeGray)] text-[var(--blue)] focus:ring-[var(--blue)]"
                          />
                          <span className="text-sm">{t("sourceTypeFile")}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sourceType"
                            checked={sourceType === "url"}
                            onChange={() => setSourceType("url")}
                            className="rounded-full border-[var(--strokeGray)] text-[var(--blue)] focus:ring-[var(--blue)]"
                          />
                          <span className="text-sm">{t("sourceTypeUrl")}</span>
                        </label>
                      </div>
                      {sourceType === "url" && (
                        <input
                          type="url"
                          placeholder={t("sourceUrlPlaceholder")}
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          className="w-full h-11 min-h-11 rounded-full bg-[var(--gray)] border border-[var(--strokeGray)] focus:border-[var(--blue)] transition-colors px-5 text-[14px] outline-none"
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right: logo + source file (only for non-Quiz) */}
            {!isQuizType && (
              <div className="w-full lg:w-1/3 lg:min-w-[240px] space-y-4">
                <div>
                  <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                    {t("logo")}
                  </label>
                  <input
                    ref={logoInputRef}
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={handleLogoFileChange}
                  />
                  <div
                    className={clsx(
                      "rounded-2xl border-2 border-dashed min-h-[140px] flex flex-col items-center justify-center gap-2 p-4 transition-colors cursor-pointer",
                      logoFile
                        ? "border-[var(--blue)] bg-[var(--gray)]/30"
                        : "border-[var(--strokeGray)] bg-[var(--gray)]/20 hover:border-[var(--blue)]/60 hover:bg-[var(--gray)]/30",
                    )}
                    onDrop={handleLogoDrop}
                    onDragOver={handleDragOver}
                    role="button"
                    tabIndex={0}
                    onClick={() => logoInputRef.current?.click()}
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
                            size="sm"
                            variant="flat"
                            className="text-[14px] text-[var(--blue)] rounded-full"
                            onPress={() => logoInputRef.current?.click()}
                          >
                            {t("change")}
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            className="text-[14px] text-red-500 rounded-full"
                            onPress={clearLogo}
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

                {requiresFileOrUrlForDisplay && sourceType === "file" && (
                  <div>
                    <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
                      {t("sourceFile")}
                    </label>
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
                        "rounded-2xl border-2 border-dashed min-h-[140px] flex flex-col items-center justify-center gap-2 p-4 transition-colors cursor-pointer",
                        sourceFile
                          ? "border-[var(--blue)] bg-[var(--gray)]/30"
                          : "border-[var(--strokeGray)] bg-[var(--gray)]/20 hover:border-[var(--blue)]/60 hover:bg-[var(--gray)]/30",
                      )}
                      onDrop={handleSourceDrop}
                      onDragOver={handleDragOver}
                      role="button"
                      tabIndex={0}
                      onClick={() => sourceInputRef.current?.click()}
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
                              size="sm"
                              variant="flat"
                              className="text-[14px] text-[var(--blue)] rounded-full"
                              onPress={() => sourceInputRef.current?.click()}
                            >
                              {t("change")}
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              className="text-[14px] text-red-500 rounded-full"
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
        </section>

        {formError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6" role="alert">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}
        {formSuccess && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 mb-6" role="status">
            <p className="text-sm text-green-700">{formSuccess}</p>
            {lastCreatedWasQuiz && (
              <p className="text-sm text-green-700 mt-2">
                {t("quizSuccessAddQuestions")}{" "}
                <Link
                  className="font-medium underline hover:no-underline"
                  href={quizFormHref}
                >
                  {t("quizGoToForm")}
                </Link>
              </p>
            )}
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
  );
}
