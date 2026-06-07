import type { ReportCardResult } from "@/types/reportCard";
import type { jnrResponseBody } from "./jnrResponse";
import type { ApiResponse } from "@/types/quiz";

import { normalizejnrResponse } from "./jnrResponse";
import { jnrClient, API_BASE } from "./httpClient";

async function request<T>(fn: () => Promise<{ data: jnrResponseBody }>): Promise<ApiResponse<T>> {
  const { data } = await fn();
  const normalized = normalizejnrResponse<T>(data);

  return {
    success: normalized.success,
    data: normalized.data,
    message: normalized.message,
    statusCode: normalized.statusCode,
    count: normalized.count,
  };
}

export const reportCardService = {
  /**
   * Get the current user's report card (completed campaigns + meta statistics).
   * API: GET /api/jnr/useraction/result/me
   */
  getMyReportCard: async (): Promise<ApiResponse<ReportCardResult>> => {
    return request<ReportCardResult>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/useraction/result/me`)
    );
  },

  /**
   * Get a specific user's report card by user ID (Admin only).
   * API: GET /api/jnr/useraction/result?userId={userId}
   */
  getUserReportCard: async (userId: number): Promise<ApiResponse<ReportCardResult>> => {
    return request<ReportCardResult>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/useraction/result?userId=${userId}`)
    );
  },
};
