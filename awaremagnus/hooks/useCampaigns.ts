import type {
  CampaignCreatePayload,
  CampaignUpdatePayload,
  CampaignQueryParams,
  CampaignListResponse,
  CampaignWithDetails,
} from "@/types/campaign";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { suiteAwmService } from "@/services/suiteAwmService";

export const CAMPAIGN_KEYS = {
  campaigns: (params?: CampaignQueryParams) => ["campaigns", params] as const,
  campaign: (id: number) => ["campaign", id] as const,
  statistics: (id: number) => ["campaign", id, "statistics"] as const,
  leaderboard: (id: number) => ["campaign", id, "leaderboard"] as const,
};

/** Get all campaigns with optional filters */
export function useCampaigns(params?: CampaignQueryParams) {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.campaigns(params),
    queryFn: () => suiteAwmService.getCampaigns(params),
  });
}

/** Get campaign by ID */
export function useCampaign(id: number, enabled = true) {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.campaign(id),
    queryFn: () => suiteAwmService.getCampaignById(id),
    enabled: enabled && !!id,
  });
}

/** Create new campaign */
export function useCreateCampaign() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CampaignCreatePayload) => suiteAwmService.createCampaign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

/** Update existing campaign */
export function useUpdateCampaign() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CampaignUpdatePayload }) =>
      suiteAwmService.updateCampaign(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: CAMPAIGN_KEYS.campaign(id) });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

/** Delete campaign */
export function useDeleteCampaign() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => suiteAwmService.deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

/** Retry user fetch for failed groups/departments */
export function useRetryUserFetch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => suiteAwmService.retryUserFetch(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: CAMPAIGN_KEYS.campaign(id) });
    },
  });
}
/** Get campaign leaderboard with user statistics */
export function useCampaignLeaderboard(campaignId: number, enabled = true) {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.leaderboard(campaignId),
    queryFn: () => suiteAwmService.getCampaignLeaderboard(campaignId),
    enabled: enabled && !!campaignId,
  });
}