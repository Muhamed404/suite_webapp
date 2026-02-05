"use client";

import Image from "next/image";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

interface FilePreviewProps {
  file: File | null;
  previewUrl: string | null;
  type: "logo" | "source";
  className?: string;
}

export function FilePreview({
  file,
  previewUrl,
  type,
  className,
}: FilePreviewProps) {
  const t = useTranslations("content");

  const isImage = file?.type.startsWith("image/");
  const isVideo = file?.type.startsWith("video/");
  const isPdf = file?.type === "application/pdf";

  return (
    <div className={clsx("mb-4", className)}>
      <h4 className="font-medium text-[var(--mainblue)] mb-2 text-sm">
        {type === "logo" ? t("logoPreview") : t("filePreview")}
      </h4>
      <div className="border-2 border-dashed border-[var(--strokeGray)] rounded-2xl p-4 flex items-center justify-center min-h-[150px] bg-[var(--gray)]/20">
        {previewUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            {isImage && (
              <Image
                alt="Preview"
                className="max-w-full max-h-[150px] object-contain rounded"
                height={200}
                src={previewUrl}
                width={200}
              />
            )}
            {isVideo && (
              <video
                controls
                className="max-w-full max-h-[150px] rounded"
                src={previewUrl}
              >
                <track kind="captions" />
              </video>
            )}
            {isPdf && (
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-[var(--mainblue)] mx-auto mb-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    fillRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-[var(--darkgray)]">{file?.name}</p>
              </div>
            )}
            {!isImage && !isVideo && !isPdf && (
              <div className="text-center">
                <svg
                  className="w-8 h-8 text-[var(--darkgray)]/50 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect height="18" rx="4" width="18" x="3" y="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5-7 7" />
                </svg>
                <p className="text-xs text-[var(--darkgray)]">{file?.name}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="w-8 h-8 text-[var(--darkgray)]/50 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect height="18" rx="4" width="18" x="3" y="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5-7 7" />
            </svg>
            <p className="text-xs text-[var(--darkgray)]">{t("noFileSelected")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
