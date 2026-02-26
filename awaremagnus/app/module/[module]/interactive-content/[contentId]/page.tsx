"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useContent, useModule, useModules, useContentsByModule } from "@/hooks/useQuiz";
import { useI18n } from "@/i18n/I18nProvider";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return "20 to 60 minutes";
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrgUserInteractiveContentPage({
  params,
}: {
  params: Promise<{ module: string; contentId: string }>;
}) {
  const { module: moduleSlug, contentId: contentIdStr } = use(params);
  const contentId = Number(contentIdStr);

  const searchParams = useSearchParams();
  const campaignId = searchParams?.get("campaign_id") ?? "";
  const moduleIdParam = searchParams?.get("module_id");

  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  // Resolve moduleId – prefer explicit query param, fall back to slug lookup
  const { data: modulesRes } = useModules({ filter: moduleSlug });
  const resolvedModuleId = useMemo(() => {
    if (moduleIdParam) return Number(moduleIdParam);
    if (modulesRes?.success && modulesRes.data) {
      const title = moduleSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const found = modulesRes.data.find(
        (m) =>
          m.code?.toLowerCase() === moduleSlug.toLowerCase() ||
          m.title?.toLowerCase() === title.toLowerCase() ||
          m.translations?.some((t) => t.name.toLowerCase() === title.toLowerCase())
      );
      return found?.id ?? 0;
    }
    return 0;
  }, [moduleIdParam, modulesRes, moduleSlug]);

  const { data: moduleRes } = useModule(resolvedModuleId, !!resolvedModuleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);

  // Sibling interactive contents for the "Next" list
  const { data: siblingsRes } = useContentsByModule(resolvedModuleId, { enabled: !!resolvedModuleId });
  const siblings = useMemo(() => {
    if (!siblingsRes?.success) return [];
    return (siblingsRes.data ?? []).filter(
      (c) => c.content_type_id === 1 && c.id !== contentId
    );
  }, [siblingsRes, contentId]);

  const moduleTitle =
    moduleRes?.data?.title ??
    moduleRes?.data?.translations?.[0]?.name ??
    moduleSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const content = contentRes?.success ? contentRes.data : null;
  const contentName =
    content?.title ?? (content as any)?.name ?? `Interactive Content ${contentId}`;

  const sourceUrl = content?.source_url ?? (content as any)?.source_path;
  const interactiveUrl = sourceUrl?.trim()
    ? sourceUrl.startsWith("http")
      ? sourceUrl
      : sourceUrl.startsWith("/contents/")
      ? `/awm${sourceUrl}`
      : `/awm/contents/${sourceUrl.startsWith("/") ? sourceUrl.slice(1) : sourceUrl}`
    : null;

  const logoUrl = content?.logo_url || (content as any)?.logo_path;
  const coverImageUrl = logoUrl ? getContentAssetUrl(logoUrl) : null;

  // Back-link preserves campaign context
  const backHref = campaignId
    ? `/module/${moduleSlug}?campaign_id=${campaignId}`
    : `/module/${moduleSlug}`;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-5 gap-1.5 flex-wrap",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <Link className="hover:text-gray-700 transition-colors" href={backHref}>
              {moduleTitle}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">Interactive Content</span>
          </nav>

          {/* Title */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900">{contentName}</h1>
            {content?.description && (
              <p className="text-xs text-gray-500 mt-1">{content.description}</p>
            )}
          </div>

          {/* ── Interactive frame ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <div
              className="relative bg-black w-full"
              style={{ height: "calc(100vh - 260px)", minHeight: "480px" }}
            >
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="animate-pulse w-full h-full bg-gray-800" />
                </div>
              ) : interactiveUrl ? (
                <iframe
                  allowFullScreen
                  allow="fullscreen; autoplay"
                  className="w-full h-full border-0"
                  src={interactiveUrl}
                  style={{ display: "block", width: "100%", height: "100%" }}
                  title={contentName}
                />
              ) : coverImageUrl ? (
                // Fallback: show cover image when no source URL
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={contentName}
                  className="w-full h-full object-contain"
                  src={coverImageUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No interactive content available
                </div>
              )}
            </div>

            {/* ── Meta bar ──────────────────────────────────────────────── */}
            {content && (
              <>
                <div className="p-4 border-b border-gray-100">
                  <h4 className="text-sm font-semibold mb-1 text-gray-900">{contentName}</h4>
                  {content.description && (
                    <p className="text-xs text-gray-500">{content.description}</p>
                  )}
                  <div
                    className={clsx(
                      "flex items-center gap-4 mt-3 text-xs text-gray-600",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {formatDuration(content.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><rect height="18" rx="2" ry="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                      {formatDate(content.created_at)}
                    </span>
                  </div>
                </div>

                {/* ── Action bar ─────────────────────────────────────────── */}
                <div className={clsx("p-4 flex items-center gap-3 flex-wrap", isRtl && "flex-row-reverse")}>
                  {interactiveUrl && (
                    <a
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition"
                      href={interactiveUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      Open Full Screen
                    </a>
                  )}

                  {siblings.length > 0 && (
                    <Link
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition"
                      href={`/module/${moduleSlug}/interactive-content/${siblings[0].id}?campaign_id=${campaignId}&module_id=${resolvedModuleId}`}
                    >
                      Next
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                  )}

                  <Link
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition ms-auto"
                    href={backHref}
                  >
                    ← Back to Module
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* ── Sibling list ─────────────────────────────────────────────── */}
          {siblings.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <h5 className="text-sm font-semibold mb-3 text-gray-900">More Interactive Content</h5>
              <div className="space-y-2">
                {siblings.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition"
                    href={`/module/${moduleSlug}/interactive-content/${s.id}?campaign_id=${campaignId}&module_id=${resolvedModuleId}`}
                  >
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600 flex-shrink-0 text-sm">
                      📘
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {(s as any).title ?? (s as any).name ?? `Content ${s.id}`}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatDate(s.created_at)}</p>
                    </div>
                    <svg className="text-gray-400 flex-shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><polyline points="9 18 15 12 9 6" /></svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
