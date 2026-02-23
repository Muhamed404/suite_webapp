"use client";

import { useParams } from "next/navigation";

import { ContentListPage } from "@/components/modules/training-library/content-list-page";

export default function MyLibraryModuleContentListPage() {
  const params = useParams();
  
  if (!params) return null;
  
  const moduleId = Number(params.moduleId);
  const contentTypeId = Number(params.contentTypeId);

  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentTypeId || Number.isNaN(contentTypeId)) return null;

  return <ContentListPage contentTypeId={contentTypeId} libraryType="my" moduleId={moduleId} />;
}
