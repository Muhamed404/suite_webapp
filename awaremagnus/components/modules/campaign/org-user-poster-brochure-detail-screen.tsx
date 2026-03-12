"use client";

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
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { CONTENT_TYPES } from "@/constants/content-types";

const PdfViewer = dynamic(
  () => import("@/components/document-viewer/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
);

const BROCHURE_FALLBACK_PDF = getContentAssetUrl("/brochure.pdf");
const POSTER_FALLBACK_IMG = getContentAssetUrl("/posters.png");

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

function formatDuration(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return "20 to 60 minutes";
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

  const isBrochure = contentTypeId === 3 || contentTypeId === 6 || contentTypeId === 7;
  const isPoster = contentTypeId === 4 || contentTypeId === 5;
  const isDocument = contentTypeId === 6 || contentTypeId === 7;

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

  const docReportContents = docReportRes?.data?.reportContents ?? [];
  const docReportEntry =
    docReportContents.find((rc: any) => rc.content_id === contentId) ?? docReportContents[0];
  const docStatusName: string = (docReportEntry?.status?.name ?? "").toUpperCase();
  const isCompleted = docStatusName === "COMPLETED";
  const showMarkAsCompleted = isDocument && !!docReportEntry && !isCompleted;

  function handleMarkAsCompleted() {
    completeContentMutation.mutate(
      { campaign_id: campaignId, module_id: moduleId, content_id: contentId },
      {
        onSuccess: () => {
          void refetchDocReport();
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
              ) : isBrochure ? (
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
                        {formatDuration(content.duration)}
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
                              : (t("library.downloadBrochure") ?? "Download Brochure")}
                      </a>

                      {/* Next item */}
                      {nextItemHref ? (
                        <Link
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition-colors"
                          href={nextItemHref}
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
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          {t("library.next") ?? "Next"}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-300 rounded-full text-xs font-medium cursor-not-allowed select-none">
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
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          {t("library.next") ?? "Next"}
                        </span>
                      )}
                    </div>

                    {/* Right: icon actions */}
                    <div className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      {/* Mark as Completed button (documents only, shown when not yet completed) */}
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
                            ? t("library.markingAsCompleted")
                            : t("library.markAsCompleted")}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Siblings list (other items in same type) ── */}
            {siblings.filter((s) => s.id !== contentId).length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {contentTypeId === 4
                    ? (t("library.nextPosterTraining") ?? "More Posters")
                    : contentTypeId === 5
                      ? (t("library.nextScreenSaverTraining") ?? "More Screen Savers")
                      : contentTypeId === 6
                        ? (t("library.nextDocumentTraining") ?? "More Documents")
                        : contentTypeId === 7
                          ? (t("library.nextDocumentTraining") ?? "More Documents")
                          : (t("library.nextBrochureTraining") ?? "More Brochures")}
                </h4>
                <div className="space-y-2">
                  {siblings
                    .filter((s) => s.id !== contentId)
                    .slice(0, 8)
                    .map((sibling) => {
                      const siblingHref = `/module/${moduleData?.code ?? moduleId}/content/${encodeURIComponent(typeLabel.toLowerCase())}/${sibling.id}?mod_id=${moduleId}&contype_id=${contentTypeId}&campaign_id=${campaignId}`;
                      const thumbUrl =
                        sibling.logo_url || (sibling as any).logo_path
                          ? getContentAssetUrl(sibling.logo_url ?? (sibling as any).logo_path)
                          : null;

                      return (
                        <Link
                          key={sibling.id}
                          className={clsx(
                            "flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors",
                            isRtl && "flex-row-reverse"
                          )}
                          href={siblingHref}
                        >
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {thumbUrl ? (
                              <AuthImage
                                fill
                                alt=""
                                className="object-cover"
                                sizes="48px"
                                src={thumbUrl}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <svg
                                  className="text-gray-400"
                                  fill="none"
                                  height="18"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  width="18"
                                >
                                  {isPoster ? (
                                    <>
                                      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </>
                                  ) : (
                                    <>
                                      <path d="M14 2H6a2 a2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </>
                                  )}
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                              {getContentTitle(sibling)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {typeLabel} · {formatDate(sibling.created_at)}
                            </p>
                          </div>

                          {/* Arrow */}
                          <svg
                            className="flex-shrink-0 text-gray-300"
                            fill="none"
                            height="14"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="14"
                          >
                            <polyline points={isRtl ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                          </svg>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
