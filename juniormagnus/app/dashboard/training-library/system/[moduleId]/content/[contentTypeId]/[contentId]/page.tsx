"use client";

import { useParams } from "next/navigation";

import { ContentDetailPage } from "@/components/modules/training-library/content-detail-page";

export default function SystemLibraryModuleContentDetailPage() {
  const params = useParams();
  const moduleId = params?.moduleId ? Number(params.moduleId) : 0;
  const contentTypeId = params?.contentTypeId ? Number(params.contentTypeId) : 0;
  const contentId = params?.contentId ? Number(params.contentId) : 0;

  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentTypeId || Number.isNaN(contentTypeId)) return null;
  if (!contentId || Number.isNaN(contentId)) return null;

  return (
    <ContentDetailPage
      contentId={contentId}
      contentTypeId={contentTypeId}
      libraryType="system"
      moduleId={moduleId}
    />
  );
}
