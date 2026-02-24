"use client";

import { useParams } from "next/navigation";

import { CampaignModuleContentsPage } from "@/components/modules/campaign";

export default function CampaignModuleContentsRoute() {
  const params = useParams();
  if (!params) return null;
  const campaignId = Number(params.campaignId);
  const moduleId = Number(params.moduleId);

  if (!campaignId || Number.isNaN(campaignId)) return null;
  if (!moduleId || Number.isNaN(moduleId)) return null;

  return <CampaignModuleContentsPage campaignId={campaignId} moduleId={moduleId} />;
}
