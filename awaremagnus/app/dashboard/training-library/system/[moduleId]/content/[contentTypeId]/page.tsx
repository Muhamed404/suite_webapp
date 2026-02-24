"use client";

import { useParams } from "next/navigation";

import { ContentListPage } from "@/components/modules/training-library/content-list-page";

export default function SystemLibraryModuleContentListPage() {
  const params = useParams();
  const moduleId = params?.moduleId ? Number(params.moduleId) : 0;
  const contentTypeId = params?.contentTypeId ? Number(params.contentTypeId) : 0;

  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentTypeId || Number.isNaN(contentTypeId)) return null;

  return <ContentListPage contentTypeId={contentTypeId} libraryType="system" moduleId={moduleId} />;
}
