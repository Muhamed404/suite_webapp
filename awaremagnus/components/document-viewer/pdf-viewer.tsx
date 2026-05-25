"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { AWM_BASE_PATH } from "@/services/awmStorage";

pdfjs.GlobalWorkerOptions.workerSrc =
  typeof window !== "undefined"
    ? `${AWM_BASE_PATH}/vendor/pdfjs/pdf.worker.min.mjs`
    : "";

/** Demo fallback PDF in public folder when content URL fails or is missing. */
export const DEMO_FALLBACK_PDF = getContentAssetUrl("/brochure.pdf");

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200, 250] as const;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

export interface PdfViewerProps {
  src: string | null | undefined;
  authToken?: string | null;
  width?: number;
  className?: string;
  resolveUrl?: boolean;
  fallbackSrc?: string | null;
}

export function PdfViewer({
  src,
  authToken,
  width,
  className,
  resolveUrl = true,
  fallbackSrc,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fitMode, setFitMode] = useState<"width" | "page" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const pdfUrl = useMemo(() => {
    if (!src?.trim()) return null;
    const raw = src.trim();

    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

    return resolveUrl ? getContentAssetUrl(raw) : raw;
  }, [src, resolveUrl]);

  const documentOptions = useMemo(
    () =>
      authToken && !useFallback
        ? {
            httpHeaders: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        : undefined,
    [authToken, useFallback]
  );

  const fileToShow = useFallback && fallbackSrc ? fallbackSrc : pdfUrl;
  const hasFile = fileToShow || (fallbackSrc && !pdfUrl);

  const defaultWidth = typeof window !== "undefined" ? Math.min(window.innerWidth - 80, 900) : 900;
  const effectiveWidth = width ?? defaultWidth;

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(numPages, p));

    setPageNumber(next);
    setPageInput(String(next));
  };

  const handlePageInputBlur = () => {
    const n = parseInt(pageInput, 10);

    if (!Number.isNaN(n)) goToPage(n);
    else setPageInput(String(pageNumber));
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePageInputBlur();
  };

  const zoomIn = () => {
    setFitMode(null);
    setScale((s) => Math.min(MAX_SCALE, s + 0.25));
    setShowZoomMenu(false);
  };
  const zoomOut = () => {
    setFitMode(null);
    setScale((s) => Math.max(MIN_SCALE, s - 0.25));
    setShowZoomMenu(false);
  };
  const setZoomPercent = (pct: number) => {
    setFitMode(null);
    setScale(pct / 100);
    setShowZoomMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!fullscreen) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);

    el.addEventListener("fullscreenchange", onFsChange);

    return () => el.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handlePrint = async () => {
    const url = fileToShow || fallbackSrc;
    if (!url) return;

    if (authToken && !useFallback) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank", "noopener");
      } catch (err) {
        console.error("Print fetch failed:", err);
        window.open(url, "_blank", "noopener");
      }
    } else {
      window.open(url, "_blank", "noopener");
    }
  };

  const handleDownload = async () => {
    const url = fileToShow || fallbackSrc;
    if (!url) return;

    if (authToken && !useFallback) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "document.pdf";
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        console.error("Download fetch failed:", err);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.pdf";
        a.click();
      }
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.pdf";
      a.click();
    }
  };

  const rotateCw = () => setRotation((r) => (r + 90) % 360);

  if (!hasFile) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg min-h-[400px] ${className ?? ""}`}
      >
        <p className="text-gray-500 text-sm">No document specified.</p>
      </div>
    );
  }

  const zoomLabel =
    fitMode === "width"
      ? "Fit width"
      : fitMode === "page"
        ? "Fit page"
        : `${Math.round(scale * 100)}%`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm ${className ?? ""} ${fullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}
    >
      {/* Toolbar - matches app: text-xs, size-4 icons */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-gray-200 shadow-sm flex-wrap shrink-0">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            disabled={pageNumber <= 1}
            title="Previous page"
            onClick={() => goToPage(pageNumber - 1)}
          >
            <ChevronLeftIcon />
          </ToolbarButton>
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 min-w-[90px] justify-center">
            <input
              aria-label="Page number"
              className="w-6 bg-transparent text-center text-xs text-gray-900 font-medium border-none focus:outline-none focus:ring-0 p-0"
              type="text"
              value={pageInput}
              onBlur={handlePageInputBlur}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
            />
            <span className="text-gray-500 text-xs">/ {numPages}</span>
          </div>
          <ToolbarButton
            disabled={pageNumber >= numPages}
            title="Next page"
            onClick={() => goToPage(pageNumber + 1)}
          >
            <ChevronRightIcon />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarButton title="Zoom out" onClick={zoomOut}>
            <ZoomOutIcon />
          </ToolbarButton>
          <div className="relative">
            <button
              className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium text-gray-700 min-w-[72px] justify-center border border-gray-200 bg-gray-50"
              title="Zoom"
              type="button"
              onClick={() => setShowZoomMenu(!showZoomMenu)}
            >
              <span>{zoomLabel}</span>
              <ChevronDownIcon />
            </button>
            {showZoomMenu && (
              <>
                <div
                  aria-hidden
                  className="fixed inset-0 z-10"
                  onClick={() => setShowZoomMenu(false)}
                />
                <div className="absolute top-full left-0 mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                  {ZOOM_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 rounded mx-0.5"
                      type="button"
                      onClick={() => setZoomPercent(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-0.5" />
                  <button
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 rounded mx-0.5"
                    type="button"
                    onClick={() => {
                      setFitMode("width");
                      setShowZoomMenu(false);
                    }}
                  >
                    Fit width
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 rounded mx-0.5"
                    type="button"
                    onClick={() => {
                      setFitMode("page");
                      setShowZoomMenu(false);
                    }}
                  >
                    Fit page
                  </button>
                </div>
              </>
            )}
          </div>
          <ToolbarButton title="Zoom in" onClick={zoomIn}>
            <ZoomInIcon />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2">
          <ToolbarButton title="Rotate" onClick={rotateCw}>
            <RotateIcon />
          </ToolbarButton>
          <ToolbarButton title="Download" onClick={handleDownload}>
            <DownloadIcon />
          </ToolbarButton>
          <ToolbarButton title="Print" onClick={handlePrint}>
            <PrintIcon />
          </ToolbarButton>
          <ToolbarButton
            title={fullscreen ? "Exit full screen" : "Full screen"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </ToolbarButton>
        </div>
      </div>

      {/* Document area */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-100/80 p-4 min-h-[500px]">
        <Document
          error={
            loadError ? (
              <div className="flex items-center justify-center min-h-[400px] text-red-600 text-sm">
                {loadError}
              </div>
            ) : null
          }
          file={fileToShow || fallbackSrc!}
          loading={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse text-gray-500 text-sm">Loading PDF…</div>
            </div>
          }
          options={documentOptions}
          onLoadError={() => {
            if (fallbackSrc && !useFallback) {
              setUseFallback(true);
              setLoadError(null);
            } else {
              setLoadError("Failed to load PDF file.");
            }
          }}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setPageNumber(1);
            setPageInput("1");
            setLoadError(null);
          }}
        >
          {numPages > 0 && (
            <div className="flex flex-col items-center">
              <Page
                className="shadow-lg bg-white"
                pageNumber={pageNumber}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                rotate={rotation}
                scale={fitMode === "page" ? 1 : fitMode === "width" ? undefined : scale}
                width={
                  fitMode === "width"
                    ? (typeof window !== "undefined"
                        ? Math.min(window.innerWidth - 80, 900)
                        : effectiveWidth) - 48
                    : undefined
                }
              />
            </div>
          )}
        </Document>
      </div>

      {/* Bottom bar - text-xs to match rest of app */}
      {numPages > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-200 text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Previous page"
              className="p-1 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-40"
              disabled={pageNumber <= 1}
              type="button"
              onClick={() => goToPage(pageNumber - 1)}
            >
              <ChevronLeftIcon />
            </button>
            <span>
              Page {pageNumber} of {numPages}
            </span>
            <button
              aria-label="Next page"
              className="p-1 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-40"
              disabled={pageNumber >= numPages}
              type="button"
              onClick={() => goToPage(pageNumber + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
          <span className="font-medium text-gray-500 text-xs">{zoomLabel}</span>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={title}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      disabled={disabled}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Icons at 16px (size-4) to match app toolbar icons */
function ChevronLeftIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function ZoomInIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}
function ZoomOutIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" />
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0115-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 01-15 6.7L3 16" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}
function ExitFullscreenIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 002 2v3" />
    </svg>
  );
}
