"use client";

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
} from "./content-detail-screens";

import { useContent } from "@/hooks/useQuiz";

interface ContentDetailPageProps {
  moduleId: number;
  contentTypeId: number;
  contentId: number;
  libraryType: "my" | "system";
  breadcrumbContext?: "training-library" | "campaign" | "my-assignments";
  campaignId?: number;
}

/**
 * Content detail page: fetches content by ID and routes to the correct screen based on
 * the API response (contentType.id / contype_id). This ensures brochures show the PDF
 * viewer and videos show the video player even if the URL type param is wrong.
 * API: GET /module-content/:id returns { object: { contype_id, source_url, contentType: { id, name }, ... } }
 */
export function ContentDetailPage({
  moduleId,
  contentTypeId,
  contentId,
  libraryType,
  breadcrumbContext = "training-library",
  campaignId,
}: ContentDetailPageProps) {
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const content = contentRes?.success ? contentRes.data : null;
  const contentTypeIdFromApi = content?.content_type_id ?? contentTypeId;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse rounded-xl bg-[var(--gray)]/30 w-full max-w-2xl h-64" />
      </div>
    );
  }

  const isVideo = isVideoContentType(contentTypeIdFromApi, undefined);
  const isPoster = isPosterContentType(contentTypeIdFromApi);
  const isBrochureDoc = isBrochureDocumentContentType(contentTypeIdFromApi);
  const isInteractive = isInteractiveContentType(contentTypeIdFromApi);

  if (isVideo) {
    return (
      <VideoContentDetailScreen
        breadcrumbContext={breadcrumbContext}
        campaignId={campaignId}
        contentId={contentId}
        contentTypeId={contentTypeIdFromApi}
        libraryType={libraryType}
        moduleId={moduleId}
      />
    );
  }

  if (isPoster) {
    return (
      <PosterContentDetailScreen
        breadcrumbContext={breadcrumbContext}
        campaignId={campaignId}
        contentId={contentId}
        contentTypeId={contentTypeIdFromApi}
        libraryType={libraryType}
        moduleId={moduleId}
      />
    );
  }

  if (isBrochureDoc) {
    return (
      <BrochureDocumentContentDetailScreen
        breadcrumbContext={breadcrumbContext}
        campaignId={campaignId}
        contentId={contentId}
        contentTypeId={contentTypeIdFromApi}
        libraryType={libraryType}
        moduleId={moduleId}
      />
    );
  }

  if (isInteractive) {
    return (
      <InteractiveContentDetailScreen
        breadcrumbContext={breadcrumbContext}
        campaignId={campaignId}
        contentId={contentId}
        contentTypeId={contentTypeIdFromApi}
        libraryType={libraryType}
        moduleId={moduleId}
      />
    );
  }

  return (
    <DefaultContentDetailScreen
      breadcrumbContext={breadcrumbContext}
      campaignId={campaignId}
      contentId={contentId}
      contentTypeId={contentTypeIdFromApi}
      libraryType={libraryType}
      moduleId={moduleId}
    />
  );
}
