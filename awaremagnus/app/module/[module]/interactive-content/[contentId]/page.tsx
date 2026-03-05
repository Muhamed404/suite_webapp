"use client";

import { use, useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useMutation } from "@tanstack/react-query";
import { quizService } from "@/services/quizService";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useContent, useModule, useModules, useContentsByModule, useContentReportByContentId } from "@/hooks/useQuiz";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

import { isOrgUser } from "@/utils/roles";


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



const CONNECTOR_SCRIPT = [
  '(function() {',
  '  window.ispringPresentationConnector = {};',
  '  window.ispringPresentationConnector.register = function(player) {',
  '    try {',
  '      var controller = (player.view && player.view().playbackController) ? player.view().playbackController() : (player.getPlaybackController && player.getPlaybackController());',
  '      var presentation = (player.presentation && player.presentation()) || (player.getPresentation && player.getPresentation());',
  '      if (!controller || !presentation) { console.error("[ispring] player API mismatch"); return; }',
  '      var slides = presentation.slides ? presentation.slides() : (presentation.getSlides && presentation.getSlides());',
  '      var totalSlides = slides ? (slides.count ? slides.count() : (slides.getSlidesCount ? slides.getSlidesCount() : 0)) : 0;',
  '      var sendUpdate = function() {',
  '        try {',
  '          var currentIndex = controller.currentSlideIndex();',
  '          var currentSlide = currentIndex + 1;',
  '          var slidesLeft = totalSlides - currentSlide;',
  '          var progressPct = totalSlides > 0 ? Math.round((currentSlide / totalSlides) * 100) : 0;',
  '          window.parent.postMessage({',
  '            type: "ispringProgress",',
  '            current_slide: currentSlide,',
  '            total_slides: totalSlides,',
  '            slides_left: slidesLeft,',
  '            progress_percentage: progressPct',
  '          }, "*");',
  '        } catch (e) { console.error("[ispring] sendUpdate:", e); }',
  '      };',
  '      if (controller.slideChangeEvent && controller.slideChangeEvent().addHandler) {',
  '        controller.slideChangeEvent().addHandler(sendUpdate, null);',
  '      } else {',
  '        setInterval(sendUpdate, 500);',
  '      }',
  '      sendUpdate();',
  '    } catch (e) {',
  '      console.error("[ispring] register error:", e);',
  '    }',
  '  };',
  '})();',
].join('\n');

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

  const token = useAuthStore((s) => s.token);

  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  // Refs for iSpring integration
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const infoRef = useRef<HTMLSpanElement>(null);
  const [iframeSrcdoc, setIframeSrcdoc] = useState<string | null>(null);
  const campaignIdRef = useRef(campaignId);
  const moduleIdRef = useRef(0);
  const contentIdRef = useRef(contentId);
  const tokenRef = useRef(token);
  const existingProgressRef = useRef<number>(-1);
  useEffect(() => { campaignIdRef.current = campaignId; }, [campaignId]);
  useEffect(() => { tokenRef.current = token; }, [token]);
  const t = useTranslations("module");
  const user = useAuthStore((s) => s.user);
  const isOrgUserCheck = isOrgUser(user?.role_id);

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

  const { data: contentReportData } = useContentReportByContentId(contentId, !!contentId);

  useEffect(() => {
    if (!contentReportData) return;
    const items: any[] =
      contentReportData?.object?.reportContents ??
      (Array.isArray(contentReportData?.object) ? contentReportData.object : []);
    const match = items.find((rc: any) => rc.content_id === contentId || rc.id === contentId);
    if (match != null && match.progress_percentage != null) {
      existingProgressRef.current = parseFloat(match.progress_percentage);
    }
  }, [contentReportData, contentId]);

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

  useEffect(() => { moduleIdRef.current = resolvedModuleId; }, [resolvedModuleId]);
  useEffect(() => { contentIdRef.current = contentId; }, [contentId]);

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

  const progressMutation = useMutation({
    mutationFn: (payload: {
      campaign_id: number;
      module_id: number;
      content_id: number;
      progress_percentage: number;
    }) => quizService.updateContentProgress(payload),
  });

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'ispringProgress') return;
      const d = event.data as {
        current_slide: number; total_slides: number;
        slides_left: number; progress_percentage: number;
      };
      // Update info span directly — no React re-render needed
      if (infoRef.current) {
        infoRef.current.innerHTML =
          `Slide: ${d.current_slide} / ${d.total_slides} &nbsp;|&nbsp; Slides left: ${d.slides_left}`;
      }
      (window as any).__ispringLastProgress = d;
      const cid = campaignIdRef.current;
      const mid = moduleIdRef.current;
      const ctid = contentIdRef.current;
      if (!cid || !mid || !ctid) return;

      const existing = existingProgressRef.current;
      const incoming = d.progress_percentage;

      // Already completed – never send another update
      if (existing >= 100) return;
      // No improvement over what was already saved – skip
      if (incoming <= existing) return;

      try {
        await progressMutation.mutateAsync({
          campaign_id: Number(cid),
          module_id: mid,
          content_id: ctid,
          progress_percentage: incoming,
        });
        // Keep ref in sync so the next slide event compares correctly
        existingProgressRef.current = incoming;
      } catch (e) {
        console.error("[updateProgressAPI] error:", e);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [progressMutation]); // include mutation in deps just to satisfy lint

  useEffect(() => {
    if (!interactiveUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(interactiveUrl);
        if (!res.ok || cancelled) return;
        let html = await res.text();
        // Compute absolute base URL so all relative assets still resolve
        const absoluteUrl = new URL(interactiveUrl, window.location.href).href;
        const baseUrl = absoluteUrl.substring(0, absoluteUrl.lastIndexOf('/') + 1);
        const baseTag = `<base href="${baseUrl}">`;
        const connectorTag = `<script>${CONNECTOR_SCRIPT}<\/script>`;
        // Inject as early as possible so connector exists before player.js runs
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}${connectorTag}`);
        } else if (/<html[^>]*>/i.test(html)) {
          html = html.replace(/<html[^>]*>/i, (m) => `${m}<head>${baseTag}${connectorTag}</head>`);
        } else {
          html = baseTag + connectorTag + html;
        }
        if (!cancelled) setIframeSrcdoc(html);
      } catch (e) {
        console.error('[ispring] fetch error:', e);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactiveUrl]);
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
            {isOrgUserCheck ? (
              <>
                <Link className="hover:text-gray-700 transition-colors" href="/dashboard/campaign-assignments">
                  {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
                </Link>
                <span className="text-gray-400">›</span>
                {campaignId ? (
                  <Link className="hover:text-gray-700 transition-colors" href={backHref}>
                    {moduleTitle}
                  </Link>
                ) : (
                  <span>{moduleTitle}</span>
                )}
                <span className="text-gray-400">›</span>
                <span className="font-semibold text-gray-900">Interactive Content</span>
              </>
            ) : (
              <>
                <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
                  Dashboard
                </Link>
                <span className="text-gray-400">›</span>
                <Link className="hover:text-gray-700 transition-colors" href={backHref}>
                  {moduleTitle}
                </Link>
                <span className="text-gray-400">›</span>
                <span className="font-semibold text-gray-900">Interactive Content</span>
              </>
            )}
          </nav>

          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900">{contentName}</h1>
            {content?.description && (
              <p className="text-xs text-gray-500 mt-1">{content.description}</p>
            )}
          </div>

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
                  ref={iframeRef}
                  allowFullScreen
                  allow="fullscreen; autoplay"
                  className="w-full h-full border-0"
                  {...(iframeSrcdoc ? { srcDoc: iframeSrcdoc } : { src: interactiveUrl })}
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

            <div className={clsx("flex items-center gap-4 px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-700", isRtl && "flex-row-reverse")}>
              <span ref={infoRef} id="ispring-info" style={{ fontFamily: "Arial, sans-serif" }}>Loading...</span>
            </div>

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


        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
