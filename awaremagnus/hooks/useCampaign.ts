import { useQuery } from "@tanstack/react-query";

import { campaignService } from "@/services/campaignService";
import { useAuthStore } from "@/hooks/useAuthStore";

export const CAMPAIGN_KEYS = {
  assignedCampaigns: ["campaign", "assigned"] as const,
  campaignModules: (campaignId: number) => ["campaign", "modules", campaignId] as const,
  userCertificates: ["certificate", "user"] as const,
};

/** Fetch campaigns assigned to the current Org User */
export function useAssignedCampaigns(campaignId?: string, enabled = true) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...CAMPAIGN_KEYS.assignedCampaigns, campaignId],
    queryFn: () => campaignService.getAssignedCampaigns(user?.id || 0, campaignId),
    enabled: enabled && !!user?.id,
  });
}

/** Fetch modules belonging to a specific campaign assignment */
export function useCampaignModules(campaignId: number, enabled = true) {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.campaignModules(campaignId),
    queryFn: () => campaignService.getCampaignModules(campaignId),
    enabled: enabled && !!campaignId,
  });
}

/** Fetch certificates earned by the current Org User */
export function useUserCertificates(enabled = true) {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.userCertificates,
    queryFn: campaignService.getUserCertificates,
    enabled,
  });
}
