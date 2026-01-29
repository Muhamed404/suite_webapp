"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModules } from "@/hooks/useQuiz";
import { useCreateContent } from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";
import { getLanguageId } from "@/utils/languageMapping";
import {
  ContentTypeSelector,
  type ContentType,
  CONTENT_TYPE_TO_ID,
} from "./content-type-selector";
import {
  ContentForm,
  type ContentTranslation,
} from "./content-form";
import { FilePreview } from "./file-preview";
import type { ModuleLocale } from "../module/module-language-selector";

function createEmptyTranslation(lang: ModuleLocale): ContentTranslation {
  return {
    lang,
    title: "",
    content: "",
    summary: "",
  };
}

export function CreateContentForm() {
  const t = useTranslations("content");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [moduleId, setModuleId] = useState<string>("");
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [language, setLanguage] = useState<ModuleLocale>("en");
  const [translation, setTranslation] = useState<ContentTranslation>(
    createEmptyTranslation("en")
  );
  const [duration, setDuration] = useState<number>(0);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const { data: modulesRes } = useModules({ status: 1 });
  const modules = modulesRes?.success ? modulesRes.data ?? [] : [];
  const createContent = useCreateContent();

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
    setModuleId(v);
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setContentType(type);
    setTranslation(createEmptyTranslation(language));
  };

  const handleLanguageChange = (lang: ModuleLocale) => {
    setLanguage(lang);
    setTranslation(createEmptyTranslation(lang));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceFile(file);
      const url = URL.createObjectURL(file);
      setSourcePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!moduleId) {
      setFormError(t("validationModule"));
      return;
    }

    if (!contentType) {
      setFormError(t("validationContentType"));
      return;
    }

    if (!translation.title.trim()) {
      setFormError(t("validationTitle"));
      return;
    }

    const requiresFile = ["iSpring", "PDF", "Video", "Brochure", "Screen Saver", "Poster", "Game"].includes(contentType);
    if (requiresFile && !sourceFile && !sourceUrl) {
      setFormError(t("validationFileOrUrl"));
      return;
    }

    try {
      const payload = {
        mod_id: Number(moduleId),
        content_type_id: CONTENT_TYPE_TO_ID[contentType],
        order: 1, // TODO: Calculate based on existing contents
        duration: duration || undefined,
        org_id: 0, // Will be set by backend from JWT token
        logo: logoFile || undefined,
        source: sourceFile || undefined,
        source_url: sourceUrl || undefined,
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
      // Reset form
      setModuleId("");
      setContentType(null);
      setLanguage("en");
      setTranslation(createEmptyTranslation("en"));
      setDuration(0);
      setSourceUrl("");
      setLogoFile(null);
      setSourceFile(null);
      setLogoPreview(null);
      setSourcePreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (sourceInputRef.current) sourceInputRef.current.value = "";
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
    setLanguage("en");
    setTranslation(createEmptyTranslation("en"));
    setDuration(0);
    setSourceUrl("");
    setLogoFile(null);
    setSourceFile(null);
    setLogoPreview(null);
    setSourcePreview(null);
    setFormError(null);
    setFormSuccess(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (sourceInputRef.current) sourceInputRef.current.value = "";
  };

  const isSubmitting = createContent.isPending;
  const requiresFile = contentType
    ? ["iSpring", "PDF", "Video", "Brochure", "Screen Saver", "Poster", "Game"].includes(
        contentType
      )
    : false;

  return (
    <div className={clsx("flex flex-col p-4", isRtl && "text-right")}>
      {/* Breadcrumb */}
      <nav
        className={clsx(
          "flex items-center text-[0.6rem] text-gray-500 gap-1.5 pb-4",
          isRtl && "flex-row-reverse"
        )}
      >
        <Link href="/dashboard/training-library" className="hover:text-gray-700 transition">
          {t("breadcrumb.trainingLibrary")}
        </Link>
        <span className="text-gray-400">›</span>
        <Link href="/dashboard/module" className="hover:text-gray-700 transition">
          {t("breadcrumb.systemLibrary")}
        </Link>
        <span className="text-gray-400">›</span>
        <span className="font-semibold text-gray-900">{t("breadcrumb.newContent")}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col leading-tight">
          <h3 className="text-xl font-medium">{t("title")}</h3>
          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>
        <Button
          as={Link}
          href="/dashboard/module"
          className="px-3 py-2 rounded-full bg-[#3FBDFF] text-white border border-transparent transition-all duration-300 hover:bg-[var(--mainblue)] hover:border-[var(--mainblue)] text-xs flex items-center gap-2"
        >
          <Image src="/images/img/add.svg" width={12} height={12} alt="" />
          <span className="hidden md:inline">{t("addNew")}</span>
        </Button>
      </div>

      {/* Module Selector */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-1.5">{t("selectModule")}</label>
        <Select
          selectedKeys={moduleId ? [moduleId] : []}
          onSelectionChange={handleModuleChange}
          placeholder={t("modulePlaceholder")}
          classNames={{
            trigger: "h-10 min-h-10 rounded-lg border border-gray-200 text-xs",
          }}
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
      </div>

      {/* Content Type Selector */}
      <ContentTypeSelector
        selectedType={contentType}
        onSelect={handleContentTypeSelect}
      />

      {/* Main Form Card */}
      <Card className="rounded-2xl shadow-sm">
        <CardBody className="p-5">
          <div className="flex gap-5 flex-col lg:flex-row">
            {/* LEFT FORM */}
            <div className="flex-1 pr-0 lg:pr-4">
              <div className="flex items-start justify-between">
                <div className="w-full pr-2">
                  <h3 className="text-lg font-medium mb-2">
                    {contentType
                      ? `${t("uploadTitle")} ${t(`contentTypes.${contentType}`)}`
                      : t("selectContentType")}
                  </h3>

                  <ContentForm
                    contentType={contentType}
                    language={language}
                    translation={translation}
                    onTranslationChange={setTranslation}
                    onLanguageChange={handleLanguageChange}
                    duration={duration}
                    onDurationChange={setDuration}
                    sourceUrl={sourceUrl}
                    onSourceUrlChange={setSourceUrl}
                  />

                  {/* File Uploads */}
                  <div className="mt-4 space-y-3">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">{t("logo")}</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2"
                      />
                    </div>

                    {/* Source File Upload */}
                    {requiresFile && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1.5">{t("sourceFile")}</label>
                        <input
                          ref={sourceInputRef}
                          type="file"
                          accept={
                            contentType === "Video"
                              ? "video/*"
                              : contentType === "PDF"
                              ? "application/pdf"
                              : contentType === "iSpring"
                              ? ".zip,.html"
                              : "*/*"
                          }
                          onChange={handleSourceFileChange}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PREVIEW */}
            <div className="w-full lg:w-1/3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4 mt-4 lg:mt-0">
              <FilePreview
                file={logoFile}
                previewUrl={logoPreview}
                type="logo"
              />
              <FilePreview
                file={sourceFile}
                previewUrl={sourcePreview}
                type="source"
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {formError && (
            <div className="mt-4">
              <p className="text-sm text-red-500" role="alert">
                {formError}
              </p>
            </div>
          )}
          {formSuccess && (
            <div className="mt-4">
              <p className="text-sm text-green-600" role="status">
                {formSuccess}
              </p>
            </div>
          )}

          {/* Footer */}
          <div
            className={clsx(
              "mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2",
              isRtl && "flex-row-reverse"
            )}
          >
            <Button
              type="button"
              variant="bordered"
              onPress={handleCancel}
              isDisabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              className="px-6 py-2 rounded-full bg-[#32B8FF] text-white hover:bg-[#26aee6] text-xs"
            >
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
