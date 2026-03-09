"use client";

import { useParams } from "next/navigation";

import { CampaignContentDetailPage } from "@/components/modules/campaign";

export default function CampaignContentDetailRoute() {
  const params = useParams();

  if (!params) return null; // guard for possible null
  const campaignId = Number(params.campaignId);
  const moduleId = Number(params.moduleId);
  const contentId = Number(params.contentId);

  if (!campaignId || Number.isNaN(campaignId)) return null;
  if (!moduleId || Number.isNaN(moduleId)) return null;
  if (!contentId || Number.isNaN(contentId)) return null;

  return (
    <CampaignContentDetailPage campaignId={campaignId} contentId={contentId} moduleId={moduleId} />
  );
}
