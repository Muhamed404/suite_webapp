import type { CampaignAssignment, CampaignModule, Certificate } from "@/types/campaign";
import type { Module } from "@/types/quiz";
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

export const campaignService = {
  /**
   * Get campaigns assigned to the current user (Org User).
   * API: GET /api/awm/campaign/assignments
   */
  getAssignedCampaigns: async (userId: number, campaignId?: string) => {
    const params: Record<string, any> = {};
    if (campaignId && campaignId !== 'all') {
      params.campaign_id = campaignId;
    }
    const response = await request<any>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/campaign/assignments`, { params })
    );
    const raw = response.data as any;
    if (response.success && raw?.assignments) {
      const campaigns: CampaignAssignment[] = raw.assignments.map((item: any) => ({
        id: item.module_id,
        campaign_id: item.campaign_id,
        name: item.module_name,
        campaign_name: item.campaign_name,
        description: item.description,
        status: item.status.name,
        start_date: item.start_date,
        end_date: item.end_date,
        progress_percent: item.progress_percentage,
      }));
      // preserve user_summary from the original payload so callers can access metrics
      return {
        ...response,
        data: campaigns,
        user_summary: raw.user_summary ?? undefined,
      } as any;
    }
    return response as ApiResponse<CampaignAssignment[]>;
  },

  /**
   * Get modules for a specific campaign assignment.
   * API: GET /module?campaign_id=X&assigned_only=true
   * Falls back to /campaign/:id/modules if available.
   */
  getCampaignModules: async (campaignId: number) => {
    return request<Module[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module`, {
        params: { campaign_id: campaignId, assigned_only: true },
      })
    );
  },

  /**
   * Get certificates earned by the current user.
   * API: GET /certificate/user/my-certificates  (uses token to identify user)
   */
  getUserCertificates: async () => {
    return request<Certificate[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/certificate/user/my-certificates`)
    );
  },

  /**
   * Download a certificate by ID. Optionally include module_id as query param.
   * API: GET /certificate/download?id={certificateId}&module_id={moduleId}
   */
  downloadCertificate: async (certificateId: number, moduleId?: number | null) => {
    const params: Record<string, any> = { id: certificateId };
    if (moduleId != null) params.module_id = moduleId;

    const response = await awmClient.get(`${API_BASE}/certificate/download`, {
      params,
      responseType: 'blob',
    });

    // Create a download link
    const filename = moduleId ? `certificate_${certificateId}_module_${moduleId}.pdf` : `certificate_${certificateId}.pdf`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Begin a campaign for the current user.
   * API: POST /report-actions/begin-campaign
   */
  beginCampaign: async (campaignId: number) => {
    return request<unknown>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/report-actions/begin-campaign`, {
        campaign_id: campaignId,
      })
    );
  },

  /**
   * Begin a specific module within a campaign for the current user.
   * API: POST /useraction/report-actions/begin-module
   */
  beginModule: async (campaignId: number, moduleId: number) => {
    return request<unknown>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/useraction/report-actions/begin-module`, {
        campaign_id: campaignId,
        module_id: moduleId,
      })
    );
  },

  /**
   * Fetch module report (no mapping done yet).
   * API: GET /report/modules/:id
   */
  getModuleReport: async (moduleId: number) => {
    return request<unknown>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/report/modules/${moduleId}`)
    );
  },
};
