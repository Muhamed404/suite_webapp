import type { AwarenessReportResponse, AwarenessReportParams } from "@/types/certificationReport";

import { jnrClient, API_BASE } from "./httpClient";

export const certificationReportService = {
  /**
   * Get awareness report users (paginated, searchable, sortable).
   * API: GET /api/jnr/report/users/awareness-report
   */
  getAwarenessReportUsers: async (
    params: AwarenessReportParams = {}
  ): Promise<{
    success: boolean;
    data: AwarenessReportResponse | null;
    message?: string;
  }> => {
    try {
      const { data } = await jnrClient.get<{
        message?: string;
        statusCode?: number;
        alertType?: string;
        object?: AwarenessReportResponse;
      }>(`${API_BASE}/report/users/awareness-report`, { params });

      const success =
        data.statusCode != null && data.statusCode >= 200 && data.statusCode < 300;

      return {
        success,
        data: data.object ?? null,
        message: data.message,
      };
    } catch (error: any) {
      console.error("Failed to fetch awareness report users:", error);

      return {
        success: false,
        data: null,
        message: error?.response?.data?.message || error?.message || "Unknown error",
      };
    }
  },
};
