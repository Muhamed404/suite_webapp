import { useQuery } from "@tanstack/react-query";

import type { AwarenessReportParams } from "@/types/certificationReport";

import { certificationReportService } from "@/services/certificationReportService";

export const CERTIFICATION_REPORT_KEYS = {
  awarenessReport: (params: AwarenessReportParams) =>
    ["certification-report", "awareness-report", params] as const,
};

/**
 * Fetch awareness report users with pagination, search, and sort.
 * Server-side pagination: page, limit, search, sort_by, sort_order are sent to the API.
 */
export function useAwarenessReportUsers(
  params: AwarenessReportParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: CERTIFICATION_REPORT_KEYS.awarenessReport(params),
    queryFn: () => certificationReportService.getAwarenessReportUsers(params),
    enabled,
    // Keep previous data while fetching new page to avoid flickering
    placeholderData: (previousData) => previousData,
  });
}
