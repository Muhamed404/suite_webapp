"use client";

import { useState, useEffect } from "react";

import type { Module, ModuleContent } from "@/types/quiz";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthImage } from "@/components/ui/auth-image";
import {
  useModule,
  useContent,
  useContentsByModule,
  useReportCampaign,
  useReportModuleByParams,
  useDocumentContentReport,
  useCompleteContent,
} from "@/hooks/useQuiz";
import { useAuthStore } from "@/hooks/useAuthStore";
import { quizService } from "@/services/quizService";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { CONTENT_TYPES } from "@/constants/content-types";
import { VideoPlayerWithFallback } from "@/components/modules/training-library/content-detail-screens/video-player-with-fallback";

const PdfViewer = dynamic(
  () => import("@/components/document-viewer/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
);

const BROCHURE_FALLBACK_PDF = getContentAssetUrl("/brochure.pdf");
const POSTER_FALLBACK_IMG = getContentAssetUrl("/posters.png");
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const DOC_EXTENSIONS = new Set(["doc", "docx"]);

// ─── helpers ─────────────────────────────────────────────────────────────────

function getModuleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function getContentTitle(c: ModuleContent): string {
  return c.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);

    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function formatDuration(minutes: number | undefined, t: (key: string) => string | undefined): string {
  if (minutes == null || minutes <= 0) return t("library.durationFallback") ?? "20 to 60 minutes";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function resolveSourceUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (s.startsWith("http")) return s;
  if (s.startsWith("/contents/")) return `/awm${s}`;

  return `/awm/contents/${s.startsWith("/") ? s.slice(1) : s}`;
}

function extractFileExtension(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const cleanUrl = url.trim().split("?")[0].split("#")[0];
  const lastDot = cleanUrl.lastIndexOf(".");

  if (lastDot < 0 || lastDot === cleanUrl.length - 1) return null;

  return cleanUrl.slice(lastDot + 1).toLowerCase();
}

// ─── component ───────────────────────────────────────────────────────────────

export interface OrgUserPosterBrochureDetailScreenProps {
  contentId: number;
  contentTypeId: number;
  moduleId: number;
  campaignId: number;
}

export function OrgUserPosterBrochureDetailScreen({
  contentId,
  contentTypeId,
  moduleId,
  campaignId,
}: OrgUserPosterBrochureDetailScreenProps) {
  const { dir } = useI18n();
  const t = useTranslations("module");
  const tc = useTranslations("campaigns");
  const isRtl = dir === "rtl";
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // types for which we fetch live report status (Brochures=3, Posters=4, ScreenSavers=5, Misc=8)
  const AGGREGATED_REPORT_TYPE_IDS = [3, 4, 5, 8];
  const isTargetAggregatedType = AGGREGATED_REPORT_TYPE_IDS.includes(contentTypeId);

  const isBrochure = contentTypeId === 3 || contentTypeId === 6 || contentTypeId === 7 || contentTypeId === 8;
  const isPoster = contentTypeId === 4 || contentTypeId === 5;
  const isDocument = contentTypeId === 6 || contentTypeId === 7;
  // Screen saver (5) and poster (4) — all types handled here; also include Misc (8)
  const isAggregatedContent = isPoster || isBrochure || contentTypeId === 8;

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const { data: contentsRes } = useContentsByModule(moduleId, !!moduleId);

  // Document-specific: two-step resolution of reportModuleId
  // Step 1: get report_campaign_id
  const { data: reportCampaignRes } = useReportCampaign(campaignId, isDocument && !!campaignId);
  const reportCampaignId: number | undefined =
    reportCampaignRes?.data?.id ??
    reportCampaignRes?.data?.reportCampaign?.id ??
    (Array.isArray(reportCampaignRes?.data) ? reportCampaignRes.data[0]?.id : undefined) ??
    undefined;
  // Step 2: get report_module_id using report_campaign_id + module_id
  const { data: reportModuleRes } = useReportModuleByParams(
    reportCampaignId ?? 0,
    moduleId,
    isDocument && !!reportCampaignId && !!moduleId
  );
  const reportModuleId: number | undefined =
    reportModuleRes?.data?.id ??
    reportModuleRes?.data?.reportModule?.id ??
    (Array.isArray(reportModuleRes?.data) ? reportModuleRes.data[0]?.id : undefined) ??
    undefined;
  const { data: docReportRes, refetch: refetchDocReport } = useDocumentContentReport(
    contentId,
    reportModuleId,
    isDocument && !!contentId
  );
  const completeContentMutation = useCompleteContent();

  // Document-based completion tracking (types 6 & 7)
  const docReportContents = docReportRes?.data?.reportContents ?? [];
  const docReportEntry =
    docReportContents.find((rc: any) => rc.content_id === contentId) ?? docReportContents[0];
  const docStatusName: string = (docReportEntry?.status?.name ?? "").toUpperCase();
  const isDocCompleted = docStatusName === "COMPLETED";

  // Local state for poster / screen-saver completion (types 4 & 5)
  const [isPosterDone, setIsPosterDone] = useState(false);

  // Live report content for aggregated types (3, 4, 5, 8)
  const [aggregatedReportContent, setAggregatedReportContent] = useState<any>(null);

  useEffect(() => {
    if (!isTargetAggregatedType || !campaignId || !moduleId || !contentId || !user?.id) return;

    quizService
      .getReportCampaign(campaignId, user.id)
      .then((res) => {
        const entry = res?.data?.reportCampaigns?.[0];
        if (!entry?.id) return null;
        return quizService.getReportModuleByParams(entry.id, moduleId);
      })
      .then((res2) => {
        const mod = res2?.data?.reportModules?.[0];
        if (!mod?.id) return null;
        return quizService.getContentsReport(mod.id);
      })
      .then((res3) => {
        const match = (res3?.data?.reportContents as any[])?.find(
          (rc: any) => rc.content_id === contentId
        );
        if (!match?.id) return null;
        return quizService.getReportContentById(match.id);
      })
      .then((res4) => {
        if (res4?.success) {
          setAggregatedReportContent(res4.data);
        }
      })
      .catch((err) => console.error("[poster-detail] report content chain error", err));
  }, [isTargetAggregatedType, campaignId, moduleId, contentId, user?.id]);

  const aggregatedStatusName = (aggregatedReportContent?.status?.name ?? "").toUpperCase();
  const isAggregatedInProgress = aggregatedStatusName === "IN_PROGRESS";
  const isAggregatedCompleted = aggregatedStatusName === "COMPLETED";

  // Unified completed flag
  const isCompleted = isDocument
    ? isDocCompleted
    : isTargetAggregatedType
      ? isAggregatedCompleted || isPosterDone
      : isPosterDone;

  // Show Mark as Done only for aggregated types when IN_PROGRESS; for others when not completed
  const showMarkAsCompleted = isAggregatedContent && !isCompleted &&
    (isTargetAggregatedType ? isAggregatedInProgress : true);

  function handleMarkAsCompleted() {
    completeContentMutation.mutate(
      { campaign_id: campaignId, module_id: moduleId, content_id: contentId },
      {
        onSuccess: () => {
          if (isDocument) {
            void refetchDocReport();
          } else {
            setIsPosterDone(true);
          }
        },
      }
    );
  }

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const content = (contentRes?.success ? contentRes.data : null) as ModuleContent | null;

  // Sibling list (same content type) – used for "next" navigation
  const allContents = (contentsRes?.success ? (contentsRes.data ?? []) : []) as ModuleContent[];
  const siblings = allContents
    .filter((c) => c.content_type_id === contentTypeId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  const currentIndex = siblings.findIndex((c) => c.id === contentId);
  const nextItem =
    currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const contentTypes = Array.isArray(CONTENT_TYPES) ? CONTENT_TYPES : [];
  const typeLabel = contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? "Content";
  const moduleTitle = moduleData ? getModuleName(moduleData) : "";

  // Source URL
  const rawSourceUrl =
    content?.source_url ?? (content as { source_path?: string } | null)?.source_path ?? null;
  const resolvedUrl = resolveSourceUrl(rawSourceUrl);
  const fileExtension = extractFileExtension(rawSourceUrl ?? resolvedUrl);
  const isPdfFile = fileExtension == null || fileExtension === "pdf";
  const isImageFile = fileExtension != null && IMAGE_EXTENSIONS.has(fileExtension);
  const isDocFile = fileExtension != null && DOC_EXTENSIONS.has(fileExtension);
  const officePreviewSourceUrl =
    isDocFile && resolvedUrl
      ? resolvedUrl.startsWith("http")
        ? resolvedUrl
        : typeof window !== "undefined"
          ? `${window.location.origin}${resolvedUrl}`
          : null
      : null;
  const officeViewerEmbedUrl =
    officePreviewSourceUrl != null
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(officePreviewSourceUrl)}`
      : null;

  // Detect if Misc content is a video file
  const isVideoSource = !!(rawSourceUrl?.match(/\.(mp4|webm|mov|ogg|avi|m3u8)(\?|$)/i));
  const isMiscVideo = contentTypeId === 8 && isVideoSource;

  // Poster thumbnail (logo_url as fallback for posters)
  const posterDisplayUrl =
    resolvedUrl ??
    (content?.logo_url || (content as any)?.logo_path
      ? getContentAssetUrl(content?.logo_url ?? (content as any)?.logo_path)
      : null);

  // Campaign navigation paths
  const campaignModulesHref = `/dashboard/campaign-assignments/${campaignId}/modules`;
  const campaignModuleContentsHref = `/dashboard/campaign-assignments/${campaignId}/modules/${moduleId}`;

  const nextItemHref = nextItem
    ? `/module/${moduleData?.code ?? moduleId}/content/${encodeURIComponent(typeLabel.toLowerCase())}/${nextItem.id}?mod_id=${moduleId}&contype_id=${contentTypeId}&campaign_id=${campaignId}`
    : null;

  if (!moduleData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 flex items-center justify-center min-h-[300px]">
            <div className="animate-pulse rounded-xl bg-gray-200 w-full max-w-2xl h-64" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col", isRtl && "text-right")}>
          {/* ── Breadcrumb ── */}
          <nav
            className={clsx(
              "flex items-center flex-wrap text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link
              className="hover:text-gray-700 transition-colors"
              href="/dashboard/campaign-assignments"
            >
              {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
            </Link>
            <span className="text-gray-400">›</span>
            {campaignId ? (
              <Link
                className="hover:text-gray-700 transition-colors"
                href={`/module/${moduleData?.code ?? moduleId}?campaign_id=${campaignId}`}
              >
                {moduleTitle}
              </Link>
            ) : (
              <span>{moduleTitle}</span>
            )}
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{typeLabel}</span>
          </nav>

          <div className="flex flex-col px-3 gap-4">
            {/* ── Page heading ── */}
            <div
              className={clsx(
                "flex items-start justify-between gap-4",
                isRtl && "flex-row-reverse"
              )}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {moduleTitle} : {typeLabel}
                </h2>
                {content?.description && (
                  <p className="text-xs text-gray-500 mt-1">{content.description}</p>
                )}
              </div>
            </div>

            {/* ── Main viewer card ── */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Viewer area */}
              {isLoading ? (
                <div className="w-full bg-gray-100 animate-pulse" style={{ minHeight: 480 }} />
              ) : isPoster ? (
                /* ── Poster image viewer ── */
                <div className="w-full bg-gray-50 p-4" style={{ minHeight: 480 }}>
                  <div className="relative w-full max-w-4xl mx-auto aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-inner">
                    {posterDisplayUrl ? (
                      <AuthImage
                        fill
                        alt={content ? getContentTitle(content) : "Awareness Poster"}
                        className="object-contain"
                        fallbackContent={
                          <Image
                            fill
                            alt="Poster"
                            className="object-contain"
                            sizes="(max-width: 896px) 100vw, 896px"
                            src={POSTER_FALLBACK_IMG}
                          />
                        }
                        loadingContent={<div className="w-full h-full animate-pulse bg-gray-200" />}
                        sizes="(max-width: 896px) 100vw, 896px"
                        src={posterDisplayUrl}
                      />
                    ) : (
                      <Image
                        fill
                        alt="Poster"
                        className="object-contain"
                        sizes="(max-width: 896px) 100vw, 896px"
                        src={POSTER_FALLBACK_IMG}
                      />
                    )}
                  </div>
                </div>
              ) : isMiscVideo ? (
                /* ── Misc video player ── */
                <div className="w-full bg-black" style={{ minHeight: 480 }}>
                  <VideoPlayerWithFallback
                    height="480px"
                    url={resolvedUrl ?? ""}
                    width="100%"
                  />
                </div>
              ) : isBrochure ? (
                isPdfFile ? (
                  /* ── PDF viewer ── */
                  <div style={{ minHeight: 800 }}>
                    <PdfViewer
                      authToken={token}
                      className="w-full"
                      fallbackSrc={BROCHURE_FALLBACK_PDF}
                      resolveUrl={rawSourceUrl ? !rawSourceUrl.startsWith("http") : true}
                      src={rawSourceUrl ?? undefined}
                    />
                  </div>
                ) : isImageFile && resolvedUrl ? (
                  /* ── Image viewer ── */
                  <div className="w-full bg-gray-50 p-4" style={{ minHeight: 480 }}>
                    <div className="relative w-full max-w-5xl mx-auto h-[760px] bg-white rounded-xl overflow-hidden shadow-inner">
                      <AuthImage
                        fill
                        alt={content ? getContentTitle(content) : "Brochure image"}
                        className="object-contain"
                        loadingContent={<div className="w-full h-full animate-pulse bg-gray-200" />}
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        src={resolvedUrl}
                      />
                    </div>
                  </div>
                ) : isDocFile && officeViewerEmbedUrl ? (
                  /* ── DOC/DOCX viewer ── */
                  <iframe
                    className="w-full h-[800px] border-0 bg-gray-50"
                    src={officeViewerEmbedUrl}
                    title={content ? getContentTitle(content) : "Document preview"}
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm bg-gray-50">
                    Preview not available for this file type.
                  </div>
                )
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm bg-gray-50">
                  Preview not available for this content type.
                </div>
              )}

              {/* ── Content metadata ── */}
              {content && (
                <>
                  <div
                    className={clsx("px-5 py-4 border-t border-gray-100", isRtl && "text-right")}
                  >
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getContentTitle(content)}
                    </h3>
                    {content.description && (
                      <p className="text-xs text-gray-500 mt-1">{content.description}</p>
                    )}

                    <div
                      className={clsx(
                        "flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      {/* Duration */}
                      <span className="flex items-center gap-1.5">
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
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatDuration(content.duration, t)}
                      </span>

                      {/* Date */}
                      <span className="flex items-center gap-1.5">
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
                          <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        {formatDate(content.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* ── Actions bar ── */}
                  <div
                    className={clsx(
                      "px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    {/* Left: Download + Next */}
                    <div className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      {/* Download */}
                      <a
                        download
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors"
                        href={isPoster ? (posterDisplayUrl ?? "#") : (resolvedUrl ?? "#")}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        {contentTypeId === 4
                          ? (t("library.downloadPoster") ?? "Download Poster")
                          : contentTypeId === 5
                            ? (t("library.downloadScreenSaver") ?? "Download Screen Saver")
                            : contentTypeId === 6 || contentTypeId === 7
                              ? (t("library.downloadDocument") ?? "Download Document")
                              : contentTypeId === 8
                                ? (isMiscVideo ? "Download Video" : "Download File")
                                : (t("library.downloadBrochure") ?? "Download Brochure")}
                      </a>
                    </div>

                    {/* Right: icon actions */}
                    <div className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      {/* Completed badge */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-medium">
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
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Completed
                        </span>
                      )}
                      {/* Mark as Done button — shown for all aggregated content types when not yet completed */}
                      {showMarkAsCompleted && (
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-60 text-white rounded-full text-xs font-medium transition-colors"
                          disabled={completeContentMutation.isPending}
                          type="button"
                          onClick={handleMarkAsCompleted}
                        >
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
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {completeContentMutation.isPending
                            ? t("library.markingAsCompleted") ?? "Marking..."
                            : t("library.markAsCompleted") ?? "Mark as Done"}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
