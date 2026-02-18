"use client";

import type { Module, ModuleContent } from "@/types/quiz";
import type { LibraryType } from "../library-page";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

import { breadcrumbLinkClassName } from "../shared-styles";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContent, useContentsByModule } from "@/hooks/useQuiz";
import { CONTENT_TYPES } from "@/constants/content-types";
import { AuthImage } from "@/components/ui/auth-image";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

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
  if (minutes == null || minutes <= 0) return "20 to 60 minutes";
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface InteractiveContentDetailScreenProps {
  moduleId: number;
  contentTypeId: number;
  contentId: number;
  libraryType: LibraryType;
}

export function InteractiveContentDetailScreen({
  moduleId,
  contentTypeId,
  contentId,
  libraryType,
}: InteractiveContentDetailScreenProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const libraryLabel = libraryType === "system" ? "System Library" : "My Library";
  const listHref = `${basePath}/${moduleId}/content/${contentTypeId}`;

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const { data: contentsRes } = useContentsByModule(moduleId, !!moduleId);
  const contentTypesList = CONTENT_TYPES;

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const rawContent = contentRes?.success ? contentRes.data : null;
  const content = rawContent as ModuleContent | null;
  const allContents = contentsRes?.success ? (contentsRes.data ?? []) : [];
  const interactives = (allContents as ModuleContent[])
    .filter((c) => c.content_type_id === contentTypeId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  const currentIndex = interactives.findIndex((c) => c.id === contentId);
  const nextItem =
    currentIndex >= 0 && currentIndex < interactives.length - 1
      ? interactives[currentIndex + 1]
      : null;
  const nextHref = nextItem
    ? `${basePath}/${moduleId}/content/${contentTypeId}/${nextItem.id}`
    : null;
  const otherItems = interactives.filter((c) => c.id !== contentId);

  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const typeLabel =
    contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? "Interactive Training";
  const moduleTitle = moduleData ? moduleName(moduleData) : "";

  const sourceUrl = content?.source_url ?? (content as { source_path?: string })?.source_path;

  // Use the local same-origin proxy /awm/contents/...
  // This is better for SCORM/iSpring as it handles relative asset paths correctly.
  const fullInteractiveUrl = sourceUrl?.trim()
    ? sourceUrl.startsWith("http")
      ? sourceUrl
      : sourceUrl.startsWith("/contents/")
        ? `/awm${sourceUrl}`
        : `/awm/contents/${sourceUrl.startsWith("/") ? sourceUrl.slice(1) : sourceUrl}`
    : null;

  const logoUrl = content?.logo_url || (content as any)?.logo_path;
  const completeImageUrl = logoUrl ? getContentAssetUrl(logoUrl) : null;

  if (content) {
    console.log("COMPLETE IMAGE URL:", completeImageUrl);
    console.log("COMPLETE INTERACTIVE URL:", fullInteractiveUrl);
  }

  if (!moduleData) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col", isRtl && "text-right")}>
          <div>
            <nav
              className={clsx(
                "flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0",
                isRtl && "flex-row-reverse"
              )}
            >
              <Link
                className={clsx("hover:text-gray-700 transition", breadcrumbLinkClassName)}
                href={basePath}
              >
                Training Library
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                className={clsx("hover:text-gray-700 transition", breadcrumbLinkClassName)}
                href={basePath}
              >
                {libraryLabel}
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                className={clsx("hover:text-gray-700 transition", breadcrumbLinkClassName)}
                href={`${basePath}/${moduleId}`}
              >
                {moduleTitle}
              </Link>
              <span className="text-gray-400">›</span>
              <span className="font-semibold text-gray-900">{typeLabel}</span>
            </nav>

            <div className="flex flex-col px-3 gap-2">
              <div>
                <div className="flex flex-col">
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

                  <div className="bg-white rounded-xl overflow-hidden">
                    {/* Interactive content container - responsive, fills available space */}
                    <div
                      className="relative bg-black w-full"
                      style={{
                        height: "calc(100vh - 200px)",
                        minHeight: "500px",
                      }}
                    >
                      {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <div className="animate-pulse w-full h-full bg-gray-800" />
                        </div>
                      ) : fullInteractiveUrl ? (
                        <iframe
                          allowFullScreen
                          allow="fullscreen; autoplay"
                          className="w-full h-full border-0"
                          src={fullInteractiveUrl}
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                          }}
                          title={content ? contentTitle(content) : "Interactive Training"}
                        />
                      ) : content ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No interactive content available
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Content not found
                        </div>
                      )}
                    </div>

                    {content && (
                      <>
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
                              <span>Duration: {formatDuration(content.duration)}</span>
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
                              <span>{t("library.posterViews") ?? "1,234 views"}</span>
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

                        <div
                          className={clsx(
                            "p-4 flex items-center justify-between flex-wrap gap-3",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          <div
                            className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}
                          >
                            <a
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition"
                              href={fullInteractiveUrl ?? "#"}
                              rel="noopener noreferrer"
                              target="_blank"
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
                              {t("library.beginTraining") ?? "Begin Training"}
                            </a>
                            {nextHref ? (
                              <Link
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition"
                                href={nextHref}
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
                                {t("library.next") ?? "Next"}
                              </Link>
                            ) : (
                              <span className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-400 rounded-full text-xs font-medium cursor-not-allowed">
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
                                {t("library.next") ?? "Next"}
                              </span>
                            )}
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
                      </>
                    )}
                  </div>

                  {otherItems.length > 0 && (
                    <div className="mt-4 bg-white rounded-xl p-4">
                      <h5 className="text-sm font-semibold mb-3 text-gray-900">
                        {t("library.nextInteractiveTraining") ?? "Next Interactive Training"}
                      </h5>
                      <div className="space-y-3">
                        {otherItems.slice(0, 5).map((item: ModuleContent) => (
                          <InteractiveListItem
                            key={item.id}
                            basePath={basePath}
                            contentTypeId={contentTypeId}
                            isRtl={isRtl}
                            item={item}
                            moduleId={moduleId}
                            typeLabel={typeLabel}
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

function InteractiveListItem({
  item,
  basePath,
  moduleId,
  contentTypeId,
  typeLabel,
  isRtl,
}: {
  item: ModuleContent;
  basePath: string;
  moduleId: number;
  contentTypeId: number;
  typeLabel: string;
  isRtl: boolean;
}) {
  const detailHref = `${basePath}/${moduleId}/content/${contentTypeId}/${item.id}`;
  const logoUrl = getContentAssetUrl(item.logo_url ?? item.logo_path);
  const duration = item.duration
    ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, "0")}`
    : "—";

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
          {duration !== "—" && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
              {duration}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
          <Image fill alt="" className="object-cover" sizes="128px" src={CARD_ASSET} />
          {duration !== "—" && (
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h6 className="text-xs font-semibold mb-1 line-clamp-2 text-gray-900">
          {contentTitle(item)}
        </h6>
        <p className="text-[10px] text-gray-500 mb-1">{typeLabel}</p>
        <p className="text-[10px] text-gray-400">{formatDate(item.created_at)}</p>
      </div>
    </Link>
  );
}
