"use client";

import type { Module, ModuleContent } from "@/types/quiz";
import type { LibraryType } from "../library-page";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

import { VideoPlayerWithFallback } from "./video-player-with-fallback";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContent, useContentsByModule } from "@/hooks/useQuiz";
import { CONTENT_TYPES } from "@/constants/content-types";
import { AuthImage } from "@/components/ui/auth-image";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isPlatformAdmin, isOrgAdmin, isOrgUser } from "@/utils/roles";

/** Card asset used as fallback thumbnail when logo is invalid */
const CARD_ASSET = getContentAssetUrl("/images/Card.png");

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);

    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDuration(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface VideoContentDetailScreenProps {
  moduleId: number;
  contentTypeId: number;
  contentId: number;
  libraryType: LibraryType;
  breadcrumbContext?: "training-library" | "campaign" | "my-assignments";
  campaignId?: number;
}

export function VideoContentDetailScreen({
  moduleId,
  contentTypeId,
  contentId,
  libraryType,
  breadcrumbContext = "training-library",
  campaignId,
}: VideoContentDetailScreenProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  console.log("🎥 VideoContentDetailScreen RECEIVED:");
  console.log("   breadcrumbContext:", breadcrumbContext);
  console.log("   campaignId:", campaignId);
  console.log("   libraryType:", libraryType);
  console.log("   moduleId:", moduleId);
  console.log("   contentTypeId:", contentTypeId);
  console.log("   Breadcrumb condition check - campaignId check:", !!campaignId);
  console.log(
    "   Breadcrumb will render:",
    breadcrumbContext === "campaign"
      ? "CAMPAIGN"
      : breadcrumbContext === "my-assignments"
        ? "MY-ASSIGNMENTS"
        : "TRAINING-LIBRARY"
  );

  const basePath =
    breadcrumbContext === "campaign"
      ? `/dashboard/campaign-assignments/${campaignId}`
      : `/dashboard/training-library/${libraryType}`;
  const listHref =
    breadcrumbContext === "campaign"
      ? `${basePath}/modules/${moduleId}/content/${contentTypeId}`
      : `${basePath}/${moduleId}/content/${contentTypeId}`;

  const { user } = useAuthStore();
  const roleId = user?.role_id;
  const isAdminView = isPlatformAdmin(roleId) || isOrgAdmin(roleId);

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const { data: contentsRes } = useContentsByModule(moduleId, !!moduleId);
  const contentTypesList = CONTENT_TYPES;

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const rawContent = contentRes?.success ? contentRes.data : null;
  const content = rawContent as ModuleContent | null;
  const allContents = contentsRes?.success ? (contentsRes.data ?? []) : [];
  const videos = allContents.filter(
    (c: ModuleContent) => c.content_type_id === contentTypeId && c.id !== contentId
  );
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const typeLabel =
    contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? `Type ${contentTypeId}`;
  const moduleTitle = moduleData ? moduleName(moduleData) : "";

  const logoUrl = getContentAssetUrl(content?.logo_url ?? content?.logo_path);
  const sourceUrl = content?.source_url ?? (content as { source_path?: string })?.source_path;

  // Use the local proxy /awm/contents/... instead of the direct service URL
  // This avoids CORS issues and allows the same-origin proxy to handle Range headers.
  const fullVideoUrl = sourceUrl?.trim()
    ? sourceUrl.startsWith("http")
      ? sourceUrl
      : sourceUrl.startsWith("/contents/")
        ? `/awm${sourceUrl}`
        : `/awm/contents/${sourceUrl.startsWith("/") ? sourceUrl.slice(1) : sourceUrl}`
    : null;

  const completeImageUrl = logoUrl;

  if (content) {
    console.log("COMPLETE IMAGE URL:", completeImageUrl);
    console.log("COMPLETE VIDEO URL (PROXY):", fullVideoUrl);
  }

  if (!moduleData) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col", isRtl && "text-right")}>
          <div>
            {/* Breadcrumb - pixel perfect from HTML */}
            <nav
              className={clsx(
                "flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0",
                isRtl && "flex-row-reverse"
              )}
            >
              {breadcrumbContext === "campaign" ? (
                <>
                  <Link
                    className="hover:text-gray-700 transition"
                    href="/dashboard/campaign-assignments"
                  >
                    {t("moduleDetails.breadcrumbAwarenessCampaign")}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <Link className="hover:text-gray-700 transition" href={basePath}>
                    {t("moduleDetails.breadcrumbCampaign")}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <Link
                    className="hover:text-gray-700 transition"
                    href={`${basePath}/modules/${moduleId}`}
                  >
                    {moduleTitle}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">{typeLabel}</span>
                </>
              ) : breadcrumbContext === "my-assignments" ? (
                <>
                  <Link
                    className="hover:text-gray-700 transition"
                    href="/dashboard/campaign-assignments"
                  >
                    {t("moduleDetails.breadcrumbMyAssignments")}
                  </Link>
                  <span className="text-gray-400">›</span>
                  {campaignId ? (
                    <Link
                      className="hover:text-gray-700 transition"
                      href={`/dashboard/campaign-assignments/${campaignId}/modules/${moduleId}`}
                    >
                      {moduleTitle}
                    </Link>
                  ) : (
                    <span>{moduleTitle}</span>
                  )}
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">{typeLabel}</span>
                </>
              ) : (
                <>
                  <Link className="hover:text-gray-700 transition" href={basePath}>
                    {t("moduleDetails.breadcrumbTrainingLibrary")}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <Link className="hover:text-gray-700 transition" href={basePath}>
                    {libraryType === "system"
                      ? t("moduleDetails.coreModules")
                      : t("moduleDetails.breadcrumbMyLibrary")}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <Link className="hover:text-gray-700 transition" href={`${basePath}/${moduleId}`}>
                    {moduleTitle}
                  </Link>
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">{typeLabel}</span>
                </>
              )}
            </nav>

            <div className="flex flex-col px-3 gap-2">
              <div>
                <div className="flex flex-col">
                  {/* Header section */}
                  <div
                    className={clsx(
                      "flex items-center justify-between mb-4",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {moduleTitle} : {typeLabel}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {content?.description ??
                          "This is an interactive training module that covers the basics of physical security."}
                      </p>
                    </div>
                  </div>

                  {/* Video Player Container - pixel perfect */}
                  <div className="bg-white rounded-xl overflow-hidden">
                    {/* Video Player */}
                    <div className="relative bg-black" style={{ height: "60vh" }}>
                      {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <div className="animate-pulse w-full h-full bg-gray-800" />
                        </div>
                      ) : content && fullVideoUrl ? (
                        <div className="w-full h-full">
                          <VideoPlayerWithFallback height="100%" url={fullVideoUrl} width="100%" />
                        </div>
                      ) : content ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No video source available
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Content not found
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    {content && (
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-base font-semibold mb-1 text-gray-900">
                          {contentTitle(content)}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {content.description ??
                            "Learn about physical security best practices and protocols"}
                        </p>
                        <div
                          className={clsx(
                            "flex items-center gap-4 mt-3 text-xs text-gray-600",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>
                              Duration: {formatDuration(content.duration) || "20 to 60 minutes"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>1,234 views</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>{formatDate(content.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video Controls/Options */}
                    {content && (
                      <div
                        className={clsx(
                          "p-4 flex items-center justify-between flex-wrap gap-3",
                          isRtl && "flex-row-reverse"
                        )}
                      >
                        <div
                          className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}
                        >
                          {isOrgUser(roleId) && (
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition"
                            type="button"
                          >
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Begin Training
                          </button>
                          )}
                          <button
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition"
                            type="button"
                          >
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            Next
                          </button>
                        </div>
                        <div
                          className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}
                        >
                          <button
                            aria-label="Share"
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                            type="button"
                          >
                            <svg
                              className="text-gray-600"
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                            </svg>
                          </button>
                          <button
                            aria-label="Download"
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                            type="button"
                          >
                            <svg
                              className="text-gray-600"
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" x2="12" y1="15" y2="3" />
                            </svg>
                          </button>
                          <button
                            aria-label="More"
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                            type="button"
                          >
                            <svg
                              className="text-gray-600"
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Next Video Training - Related videos from endpoint */}
                  {videos.length > 0 && (
                    <div className="mt-4 bg-white rounded-xl p-4">
                      <h5 className="text-sm font-semibold mb-3 text-gray-900">
                        Next Video Training
                      </h5>
                      <div className="space-y-3">
                        {videos.slice(0, 5).map((video: ModuleContent) => (
                          <VideoListItem
                            key={video.id}
                            basePath={basePath}
                            contentTypeId={contentTypeId}
                            isRtl={isRtl}
                            moduleId={moduleId}
                            typeLabel={typeLabel}
                            video={video}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function VideoListItem({
  video,
  basePath,
  moduleId,
  contentTypeId,
  typeLabel,
  isRtl,
}: {
  video: ModuleContent;
  basePath: string;
  moduleId: number;
  contentTypeId: number;
  typeLabel: string;
  isRtl: boolean;
}) {
  const detailHref = `${basePath}/${moduleId}/content/${contentTypeId}/${video.id}`;
  const logoUrl = getContentAssetUrl(video.logo_url ?? video.logo_path);
  const duration = video.duration
    ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}`
    : "5:42";

  const cardWithDuration = (
    <div className="relative flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
      <Image fill alt="" className="object-cover" sizes="128px" src={CARD_ASSET} />
      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
        {duration}
      </div>
    </div>
  );

  return (
    <Link
      className={clsx(
        "flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition",
        isRtl && "flex-row-reverse"
      )}
      href={detailHref}
    >
      {logoUrl ? (
        <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-gray-200">
          <AuthImage
            fill
            alt=""
            className="object-cover"
            fallbackContent={
              <div className="relative w-full h-full">
                <Image fill alt="" className="object-cover" sizes="128px" src={CARD_ASSET} />
              </div>
            }
            sizes="128px"
            src={logoUrl}
          />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
            {duration}
          </div>
        </div>
      ) : (
        cardWithDuration
      )}
      <div className="flex-1 min-w-0">
        <h6 className="text-xs font-semibold mb-1 line-clamp-2 text-gray-900">
          {contentTitle(video)}
        </h6>
        <p className="text-[10px] text-gray-500 mb-1">{typeLabel}</p>
        <p className="text-[10px] text-gray-400">{formatDate(video.created_at)}</p>
      </div>
    </Link>
  );
}
