"use client";

import Link from "next/link";
import clsx from "clsx";

import {
  isVideoContentType,
  isPosterContentType,
  isBrochureDocumentContentType,
  isInteractiveContentType,
  VideoContentDetailScreen,
  PosterContentDetailScreen,
  BrochureDocumentContentDetailScreen,
  InteractiveContentDetailScreen,
  DefaultContentDetailScreen,
} from "@/components/modules/training-library/content-detail-screens";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useContent } from "@/hooks/useQuiz";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

interface CampaignContentDetailPageProps {
  campaignId: number;
  moduleId: number;
  contentId: number;
}

/**
 * Content detail page within the campaign assignment flow.
 * Wraps the existing content-type screens (Video, Poster, Brochure, Interactive)
 * within the DashboardLayout appropriate for Org User.
 */
export function CampaignContentDetailPage({
  campaignId,
  moduleId,
  contentId,
}: CampaignContentDetailPageProps) {
  const { dir } = useI18n();
  const t = useTranslations("campaigns");
  const isRtl = dir === "rtl";

  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const content = contentRes?.success ? contentRes.data : null;
  const contentTypeId = content?.content_type_id ?? 0;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse rounded-xl bg-[var(--gray)]/30 w-full max-w-2xl h-64" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isVideo = isVideoContentType(contentTypeId, undefined);
  const isPoster = isPosterContentType(contentTypeId);
  const isBrochureDoc = isBrochureDocumentContentType(contentTypeId);
  const isInteractive = isInteractiveContentType(contentTypeId);

  /** Use "my" libraryType for the viewer screens since org user is a learner */
  const libraryType = "my" as const;

  const renderScreen = () => {
    if (isVideo) {
      return (
        <VideoContentDetailScreen
          contentId={contentId}
          contentTypeId={contentTypeId}
          libraryType={libraryType}
          moduleId={moduleId}
        />
      );
    }
    if (isPoster) {
      return (
        <PosterContentDetailScreen
          contentId={contentId}
          contentTypeId={contentTypeId}
          libraryType={libraryType}
          moduleId={moduleId}
        />
      );
    }
    if (isBrochureDoc) {
      return (
        <BrochureDocumentContentDetailScreen
          contentId={contentId}
          contentTypeId={contentTypeId}
          libraryType={libraryType}
          moduleId={moduleId}
        />
      );
    }
    if (isInteractive) {
      return (
        <InteractiveContentDetailScreen
          contentId={contentId}
          contentTypeId={contentTypeId}
          libraryType={libraryType}
          moduleId={moduleId}
        />
      );
    }

    return (
      <DefaultContentDetailScreen
        contentId={contentId}
        contentTypeId={contentTypeId}
        libraryType={libraryType}
        moduleId={moduleId}
      />
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-6xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-4 gap-1.5 flex-wrap",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
              {t("breadcrumb.dashboard")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href="/dashboard/campaign-assignments"
            >
              {t("title")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href={`/dashboard/campaign-assignments/${campaignId}/modules`}
            >
              {t("modulesTitle")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href={`/dashboard/campaign-assignments/${campaignId}/modules/${moduleId}`}
            >
              {t("contentsTitle")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{t("contentDetail")}</span>
          </nav>

          {/* Content Viewer */}
          {renderScreen()}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
