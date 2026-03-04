"use client";

import { useParams, useSearchParams } from "next/navigation";

import { ContentDetailPage } from "@/components/modules/training-library/content-detail-page";
import { OrgUserPosterBrochureDetailScreen } from "@/components/modules/campaign/org-user-poster-brochure-detail-screen";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles";
import {
  isPosterContentType,
  isBrochureDocumentContentType,
} from "@/components/modules/training-library/content-detail-screens";

export default function ModuleContentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const contentId = params?.contentId ? Number(params.contentId) : 0;
  const moduleId = searchParams?.get("mod_id") ? Number(searchParams.get("mod_id")) : 0;
  const contentTypeId = searchParams?.get("contype_id")
    ? Number(searchParams.get("contype_id"))
    : 0;
  const campaignId = searchParams?.get("campaign_id")
    ? Number(searchParams.get("campaign_id"))
    : 0;

  if (!contentId || Number.isNaN(contentId)) return null;
  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentTypeId || Number.isNaN(contentTypeId)) return null;

  // Org user viewing a poster/brochure/document/screen-saver (types 3,4,5,6,7)
  if (
    isOrgUser(user?.role_id) &&
    (isPosterContentType(contentTypeId) || isBrochureDocumentContentType(contentTypeId) || contentTypeId === 5 || contentTypeId === 6)
  ) {
    return (
      <OrgUserPosterBrochureDetailScreen
        campaignId={campaignId}
        contentId={contentId}
        contentTypeId={contentTypeId}
        moduleId={moduleId}
      />
    );
  }

  // Org admin / platform admin → standard system library view
  return (
    <ContentDetailPage
      contentId={contentId}
      contentTypeId={contentTypeId}
      libraryType="system"
      moduleId={moduleId}
    />
  );
}
