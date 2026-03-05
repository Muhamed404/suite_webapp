"use client";

import { useParams } from "next/navigation";

import { ContentDetailPage } from "@/components/modules/training-library/content-detail-page";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles";

export default function MyLibraryModuleContentDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  
  const moduleId = params?.moduleId ? Number(params.moduleId) : 0;
  const contentTypeId = params?.contentTypeId ? Number(params.contentTypeId) : 0;
  const contentId = params?.contentId ? Number(params.contentId) : 0;

  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentTypeId || Number.isNaN(contentTypeId)) return null;
  if (!contentId || Number.isNaN(contentId)) return null;

  // For org-users in My Modules, show my-assignments breadcrumb
  return (
    <ContentDetailPage
      breadcrumbContext={isOrgUser(user?.role_id) ? "my-assignments" : "training-library"}
      contentId={contentId}
      contentTypeId={contentTypeId}
      libraryType="my"
      moduleId={moduleId}
    />
  );
}
