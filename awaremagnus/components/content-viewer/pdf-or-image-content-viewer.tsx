"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import clsx from "clsx";

import { AuthImage } from "@/components/ui/auth-image";
import { isImageContent, isPdfContent, resolveAwmContentUrl } from "@/utils/contentMediaType";

const PdfViewer = dynamic(
  () => import("@/components/document-viewer/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
);

export interface PdfOrImageContentViewerProps {
  /** Raw `source_url` / `source_path` from the API (used for PDF viewer URL resolution). */
  rawSourceUrl?: string | null;
  authToken?: string | null;
  alt: string;
  className?: string;
  pdfFallbackSrc: string;
  imageFallbackSrc?: string;
  /** Minimum height for PDF viewer area. */
  minHeight?: number | string;
  /** Fixed viewport height for image preview (capped at 70vh). */
  imageViewportHeight?: number;
  imageClassName?: string;
}

/**
 * Renders brochure/poster (and similar) assets as PDF or image based on the source file type.
 */
export function PdfOrImageContentViewer({
  rawSourceUrl,
  authToken,
  alt,
  className,
  pdfFallbackSrc,
  imageFallbackSrc,
  minHeight = 800,
  imageViewportHeight = 560,
  imageClassName = "object-contain object-center",
}: PdfOrImageContentViewerProps) {
  const displayUrl = resolveAwmContentUrl(rawSourceUrl);

  if (!rawSourceUrl?.trim() && !displayUrl) {
    return (
      <div
        className="w-full flex items-center justify-center text-gray-500 text-sm bg-gray-50"
        style={{ minHeight }}
      >
        Content not found
      </div>
    );
  }

  if (isPdfContent(rawSourceUrl)) {
    return (
      <div className={clsx("w-full overflow-hidden", className)} style={{ minHeight }}>
        <PdfViewer
          authToken={authToken}
          className="w-full"
          fallbackSrc={pdfFallbackSrc}
          resolveUrl={rawSourceUrl ? !rawSourceUrl.startsWith("http") : true}
          src={rawSourceUrl ?? undefined}
        />
      </div>
    );
  }

  if (isImageContent(rawSourceUrl) && displayUrl) {
    return (
      <div className={clsx("w-full bg-gray-50 p-4 sm:p-6 flex justify-center", className)}>
        <div
          className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm"
          style={{
            height: imageViewportHeight,
            maxHeight: "70vh",
            minHeight: 240,
          }}
        >
          <AuthImage
            fill
            alt={alt}
            className={imageClassName}
            fallbackContent={
              imageFallbackSrc ? (
                <Image
                  fill
                  alt={alt}
                  className={imageClassName}
                  sizes="(max-width: 896px) 100vw, 896px"
                  src={imageFallbackSrc}
                />
              ) : undefined
            }
            loadingContent={
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="w-full h-full animate-pulse bg-gray-200" />
              </div>
            }
            sizes="(max-width: 896px) 100vw, 896px"
            src={displayUrl}
          />
        </div>
      </div>
    );
  }

  if (displayUrl) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center gap-3 text-gray-600 text-sm bg-gray-50 px-4"
        style={{ minHeight }}
      >
        <p>Preview is not available for this file type.</p>
        <a
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition"
          download
          href={displayUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Download file
        </a>
      </div>
    );
  }

  return (
    <div
      className="w-full flex items-center justify-center text-gray-500 text-sm bg-gray-50"
      style={{ minHeight }}
    >
      Content not found
    </div>
  );
}
