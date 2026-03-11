import type { ReportCardResult } from "@/types/reportCard";
import type { AWMResponseBody } from "./awmResponse";
import type { ApiResponse } from "@/types/quiz";

import { normalizeAWMResponse } from "./awmResponse";
import { awmClient, API_BASE } from "./httpClient";

async function request<T>(fn: () => Promise<{ data: AWMResponseBody }>): Promise<ApiResponse<T>> {
  const { data } = await fn();
  const normalized = normalizeAWMResponse<T>(data);

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
   * API: GET /api/awm/useraction/result/me
   */
  getMyReportCard: async (): Promise<ApiResponse<ReportCardResult>> => {
    return request<ReportCardResult>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/useraction/result/me`)
    );
  },

  /**
   * Get a specific user's report card by user ID (Admin only).
   * API: GET /api/awm/useraction/result?userId={userId}
   */
  getUserReportCard: async (userId: number): Promise<ApiResponse<ReportCardResult>> => {
    return request<ReportCardResult>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/useraction/result?userId=${userId}`)
    );
  },
};
