import { useQuery } from "@tanstack/react-query";

import { reportCardService } from "@/services/reportCardService";

export const REPORT_CARD_KEYS = {
  myReportCard: ["report-card", "me"] as const,
  userReportCard: (userId: number) => ["report-card", "user", userId] as const,
};

/** Fetch the current user's report card result */
export function useMyReportCard(enabled = true) {
  return useQuery({
    queryKey: REPORT_CARD_KEYS.myReportCard,
    queryFn: reportCardService.getMyReportCard,
    enabled,
  });
}

/** Fetch a specific user's report card result by user ID */
export function useUserReportCard(userId: number, enabled = true) {
  return useQuery({
    queryKey: REPORT_CARD_KEYS.userReportCard(userId),
    queryFn: () => reportCardService.getUserReportCard(userId),
    enabled: enabled && !!userId,
  });
}
