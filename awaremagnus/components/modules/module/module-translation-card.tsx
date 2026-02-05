"use client";

import { useRef } from "react";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getLanguageFlag, getLanguageName } from "@/utils/supportedLanguages";

export interface ModuleTranslation {
  language_id: number;
  name: string;
  description: string;
  iconFile?: File | null;
  iconPreview?: string | null;
}

interface ModuleTranslationCardProps {
  translation: ModuleTranslation;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onIconChange?: (file: File | null, preview: string | null) => void;
  onRemove: () => void;
}

export function ModuleTranslationCard({
  translation,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onRemove,
}: ModuleTranslationCardProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const languageName = getLanguageName(translation.language_id);
  const languageFlag = getLanguageFlag(translation.language_id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!onIconChange) return;
    if (!file) {
      onIconChange(null, null);
      return;
    }
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onIconChange(file, url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/") || !onIconChange) return;
    const url = URL.createObjectURL(file);
    onIconChange(file, url);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleClearIcon = () => {
    onIconChange?.(null, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasIcon = translation.iconPreview || translation.iconFile;

  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--strokeGray)] bg-white p-5 relative",
        isRtl && "text-right",
      )}
    >
      <Button
        isIconOnly
        aria-label="Remove translation"
        className={clsx(
          "absolute w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-full",
          "border border-red-300 text-red-400 hover:text-red-600 hover:border-red-500 hover:bg-red-50 transition",
          isRtl ? "left-4 top-4" : "right-4 top-4",
        )}
        size="sm"
        type="button"
        variant="light"
        onPress={onRemove}
      >
        <svg
          className="w-4 h-4 stroke-current"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </Button>

      {/* Language header: flag + name */}
      <div
        className={clsx(
          "flex items-center gap-2 mb-4 py-2 px-3 rounded-xl bg-[var(--gray)]/40 border border-[var(--strokeGray)] w-fit",
          isRtl && "flex-row-reverse",
        )}
      >
        <span className="text-xl leading-none" aria-hidden>
          {languageFlag}
        </span>
        <span className="text-sm font-semibold text-[var(--mainblue)]">
          {languageName}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: name + description */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
              {t("moduleName")}
            </label>
            <Input
              classNames={{
                base: "w-full",
                input: "text-[14px]",
                inputWrapper:
                  "h-11 min-h-11 rounded-full bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-4",
              }}
              placeholder={t("moduleNamePlaceholder")}
              value={translation.name}
              onValueChange={onNameChange}
            />
          </div>
          <div>
            <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
              {t("moduleDescription")}
            </label>
            <Textarea
              classNames={{
                base: "w-full",
                input: "text-[14px]",
                inputWrapper:
                  "rounded-2xl bg-white border border-[var(--strokeGray)] focus-within:border-[var(--blue)] transition-colors duration-300 px-4 py-3 min-h-0",
              }}
              minRows={3}
              placeholder={t("moduleDescriptionPlaceholder")}
              value={translation.description}
              onValueChange={onDescriptionChange}
            />
          </div>
        </div>

        {/* Right: icon dropzone */}
        <div>
          <label className="block text-[var(--mainblue)] mb-1.5 font-medium text-sm">
            {t("translationIcon") ?? "Icon"}
          </label>
          <input
            ref={fileInputRef}
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={handleFileChange}
          />
          <div
            className={clsx(
              "rounded-2xl border-2 border-dashed min-h-[140px] flex flex-col items-center justify-center gap-2 p-4 transition-colors",
              hasIcon
                ? "border-[var(--blue)] bg-[var(--gray)]/30"
                : "border-[var(--strokeGray)] bg-[var(--gray)]/20 hover:border-[var(--blue)]/60 hover:bg-[var(--gray)]/30",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {hasIcon && translation.iconPreview ? (
              <>
                <img
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-[var(--strokeGray)]"
                  src={translation.iconPreview}
                />
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="flat"
                    className="text-[14px] text-[var(--blue)]"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    {t("change") ?? "Change"}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-[14px] text-red-500"
                    onPress={handleClearIcon}
                  >
                    {t("clear") ?? "Clear"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <svg
                  aria-hidden
                  className="w-10 h-10 text-[var(--darkgray)]/60"
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
                <span className="text-[14px] text-[var(--darkgray)] text-center">
                  {t("dropzoneHint") ?? "Drop icon or click"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
