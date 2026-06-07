import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invitationService } from "@/services/invitationService";
import type { InvitationListParams } from "@/types/invitation";

export const INVITATION_KEYS = {
  list: (params?: InvitationListParams) => ["invitations", "list", params] as const,
  batch: (batchId: number, params?: { page?: number; limit?: number }) =>
    ["invitations", "batch", batchId, params] as const,
};

export function useInvitations(params?: InvitationListParams, enabled = true) {
  return useQuery({
    queryKey: INVITATION_KEYS.list(params),
    queryFn: () => invitationService.getInvitations(params),
    enabled,
  });
}

export function useBatchInvitations(
  batchId: number,
  params?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: INVITATION_KEYS.batch(batchId, params),
    queryFn: () => invitationService.getBatchInvitations(batchId, params),
    enabled: enabled && !!batchId,
  });
}

export function useSendBatchReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: number) => invitationService.sendBatchReminders(batchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}

export function useSendBatchUserReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, userId }: { batchId: number; userId: number }) =>
      invitationService.sendBatchUserReminder(batchId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
