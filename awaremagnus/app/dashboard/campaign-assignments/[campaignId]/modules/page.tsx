"use client";

import { useParams } from "next/navigation";

import { CampaignModulesPage } from "@/components/modules/campaign";

export default function CampaignModulesRoute() {
  const params = useParams();
  const campaignId = Number(params.campaignId);

  if (!campaignId || Number.isNaN(campaignId)) return null;

  return <CampaignModulesPage campaignId={campaignId} />;
}
