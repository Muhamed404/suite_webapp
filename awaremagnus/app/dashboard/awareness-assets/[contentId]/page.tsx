"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthImage } from "@/components/ui/auth-image";

/** react-pdf/pdfjs uses DOMMatrix — must not load on the Node server bundle. */
const PdfViewer = dynamic(
  () => import("@/components/document-viewer/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
);
import { VideoPlayerWithFallback } from "@/components/modules/training-library/content-detail-screens/video-player-with-fallback";
import { useContent } from "@/hooks/useQuiz";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { isOrgAdmin } from "@/utils/roles";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  isBrochureDocumentContentType,
  isInteractiveContentType,
  isPosterContentType,
  isVideoContentType,
} from "@/components/modules/training-library/content-detail-screens";

function resolveAssetUrl(raw?: string | null) {
  if (!raw?.trim()) return null;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/contents/")) return `/awm${raw}`;
  return `/awm/contents/${raw.startsWith("/") ? raw.slice(1) : raw}`;
}

function isImageAsset(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((ext) => clean.endsWith(ext));
}

export default function AwarenessAssetDetailPage() {
  const params = useParams();
  const { dir } = useI18n();
  const tDashboard = useTranslations("dashboard");
  const tAwarenessAssets = useTranslations("awarenessAssets");
  const isRtl = dir === "rtl";
  const user = useAuthStore((s) => s.user);
  const isOrgAdminUser = isOrgAdmin(user?.role_id);

  const contentId = Number(params?.contentId ?? 0);
  const { data: contentRes, isLoading } = useContent(contentId, Number.isFinite(contentId) && contentId > 0);
  const content = contentRes?.success ? contentRes.data : null;

  if (user && !isOrgAdminUser) return null;

  const sourceUrl = resolveAssetUrl(content?.source_url ?? content?.source_path);
  const logoUrl = content?.logo_url ?? content?.logo_path;
  const previewUrl = logoUrl ? getContentAssetUrl(logoUrl) : null;
  const contentTypeId = content?.content_type_id;
  const title = content?.title ?? content?.name ?? tAwarenessAssets("fallback.asset", { id: contentId });

  const isVideo = isVideoContentType(contentTypeId, content?.content_type);
  const isDocument = isBrochureDocumentContentType(contentTypeId);
  const isInteractive = isInteractiveContentType(contentTypeId);
  const isPoster = isPosterContentType(contentTypeId);
  const shouldRenderImage = isPoster || (!!sourceUrl && isImageAsset(sourceUrl));

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
            ) : isDocument ? (
              <PdfViewer className="min-h-[70vh]" resolveUrl={false} src={sourceUrl} />
            ) : shouldRenderImage ? (
              <div className="relative overflow-hidden rounded-lg border border-[var(--strokeGray)] bg-white min-h-[70vh]">
                <AuthImage
                  fill
                  alt={title}
                  className="object-contain"
                  sizes="100vw"
                  src={sourceUrl ?? previewUrl ?? ""}
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

