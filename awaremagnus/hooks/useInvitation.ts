import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invitationService } from "@/services/invitationService";
import type { InvitationListParams } from "@/types/invitation";

export const INVITATION_KEYS = {
  list: (params?: InvitationListParams) => ["invitations", "list", params] as const,
  campaign: (campaignId: number, params?: { page?: number; limit?: number }) =>
    ["invitations", "campaign", campaignId, params] as const,
  survey: (surveyId: number, params?: { page?: number; limit?: number }) =>
    ["invitations", "survey", surveyId, params] as const,
};

export function useInvitations(params?: InvitationListParams, enabled = true) {
  return useQuery({
    queryKey: INVITATION_KEYS.list(params),
    queryFn: () => invitationService.getInvitations(params),
    enabled,
  });
}

export function useCampaignInvitations(
  campaignId: number,
  params?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: INVITATION_KEYS.campaign(campaignId, params),
    queryFn: () => invitationService.getCampaignInvitations(campaignId, params),
    enabled: enabled && !!campaignId,
  });
}

export function useSurveyInvitations(
  surveyId: number,
  params?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: INVITATION_KEYS.survey(surveyId, params),
    queryFn: () => invitationService.getSurveyInvitations(surveyId, params),
    enabled: enabled && !!surveyId,
  });
}

export function useSendCampaignReminders() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: number) => invitationService.sendCampaignReminders(campaignId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useSendCampaignUserReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, userId }: { campaignId: number; userId: number }) =>
      invitationService.sendCampaignUserReminder(campaignId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useSendSurveyReminders() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: number) => invitationService.sendSurveyReminders(surveyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useSendSurveyUserReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, userId }: { surveyId: number; userId: number }) =>
      invitationService.sendSurveyUserReminder(surveyId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}
