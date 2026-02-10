"use client";

import { useParams } from "next/navigation";

import { ContentDetailPage } from "@/components/modules/training-library/content-detail-page";

export default function SystemLibraryModuleContentDetailPage() {
  const params = useParams();
  const moduleId = Number(params.moduleId);
  const contentTypeId = Number(params.contentTypeId);
  const contentId = Number(params.contentId);

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
