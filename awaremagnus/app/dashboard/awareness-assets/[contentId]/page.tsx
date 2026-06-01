"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";

import { PdfOrImageContentViewer } from "@/components/content-viewer/pdf-or-image-content-viewer";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VideoPlayerWithFallback } from "@/components/modules/training-library/content-detail-screens/video-player-with-fallback";
import { useContent } from "@/hooks/useQuiz";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { resolveAwmContentUrl } from "@/utils/contentMediaType";
import { canAccessAwarenessAssets } from "@/utils/roles";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  isBrochureDocumentContentType,
  isInteractiveContentType,
  isPosterContentType,
  isVideoContentType,
} from "@/components/modules/training-library/content-detail-screens";

const BROCHURE_PDF_FALLBACK = getContentAssetUrl("/brochure.pdf");
const POSTER_IMAGE_FALLBACK = getContentAssetUrl("/posters.png");

export default function AwarenessAssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { dir } = useI18n();
  const tDashboard = useTranslations("dashboard");
  const tAwarenessAssets = useTranslations("awarenessAssets");
  const isRtl = dir === "rtl";
  const user = useAuthStore((s) => s.user);
  const canAccessAssets = canAccessAwarenessAssets(user?.role_id);

  const contentId = Number(params?.contentId ?? 0);
  const { data: contentRes, isLoading } = useContent(
    contentId,
    Number.isFinite(contentId) && contentId > 0 && canAccessAssets
  );
  const content = contentRes?.success ? contentRes.data : null;

  useEffect(() => {
    if (user && !canAccessAssets) {
      router.replace("/dashboard");
    }
  }, [user, canAccessAssets, router]);

  if (user && !canAccessAssets) return null;

  const rawSourceUrl = content?.source_url ?? content?.source_path ?? null;
  const sourceUrl = resolveAwmContentUrl(rawSourceUrl);
  const contentTypeId = content?.content_type_id;
  const title = content?.title ?? content?.name ?? tAwarenessAssets("fallback.asset", { id: contentId });

  const isVideo = isVideoContentType(contentTypeId, content?.content_type);
  const isBrochureOrPoster =
    isBrochureDocumentContentType(contentTypeId) || isPosterContentType(contentTypeId);
  const isInteractive = isInteractiveContentType(contentTypeId);
  const pdfOrImageFallback = isPosterContentType(contentTypeId)
    ? POSTER_IMAGE_FALLBACK
    : BROCHURE_PDF_FALLBACK;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6", isRtl && "text-right")}>
          <nav
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-4 gap-1.5 flex-wrap",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
              {tDashboard("menu.dashboard")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard/awareness-assets">
              {tDashboard("menu.awarenessAssets")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{title}</span>
          </nav>

          <div className="rounded-lg border border-[var(--strokeGray)] bg-white p-4">
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-[var(--mainblue)]">{title}</h1>
              {content?.description && (
                <p className="mt-1 text-sm text-[var(--darkgray)]">{content.description}</p>
              )}
            </div>

            {isLoading ? (
              <div className="h-[60vh] animate-pulse rounded-lg bg-[var(--gray)]/30" />
            ) : !content ? (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                {tAwarenessAssets("states.fetchError")}
              </div>
            ) : !sourceUrl ? (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                {tAwarenessAssets("states.noSource")}
              </div>
            ) : isInteractive ? (
              <div className="overflow-hidden rounded-lg border border-[var(--strokeGray)] bg-white">
                <iframe
                  className="w-full"
                  src={sourceUrl}
                  title={title}
                  style={{ minHeight: "70vh", border: "none" }}
                />
              </div>
            ) : isVideo ? (
              <div className="overflow-hidden rounded-lg border border-[var(--strokeGray)] bg-black">
                <div style={{ height: "70vh" }}>
                  <VideoPlayerWithFallback url={sourceUrl} />
                </div>
              </div>
            ) : isBrochureOrPoster ? (
              <div className="overflow-hidden rounded-lg border border-[var(--strokeGray)] bg-white">
                <PdfOrImageContentViewer
                  alt={title}
                  className="relative min-h-[70vh]"
                  imageFallbackSrc={pdfOrImageFallback}
                  minHeight="70vh"
                  pdfFallbackSrc={pdfOrImageFallback}
                  rawSourceUrl={rawSourceUrl}
                />
              </div>
            ) : (
              <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                <a className="text-blue-600 underline" href={sourceUrl} rel="noopener noreferrer" target="_blank">
                  {tAwarenessAssets("actions.view")}
                </a>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

