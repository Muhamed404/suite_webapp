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
   * API: GET /api/awm/report/campaigns?userId={userId}
   */
  getAssignedCampaigns: async (userId: number) => {
    const response = await request<any>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/report/campaigns`, {
        params: { userId },
      })
    );
    if (response.success && response.data?.reportCampaigns) {
      const campaigns: CampaignAssignment[] = response.data.reportCampaigns.map((item: any) => ({
        id: item.campaign.id,
        name: item.campaign.name,
        description: item.campaign.description,
        status: item.status.name,
        start_date: item.campaign.start_date,
        end_date: item.campaign.end_date,
        org_id: item.campaign.org_id,
        progress_percent: parseFloat(item.progress_percentage),
        createdAt: item.campaign.createdAt,
        updatedAt: item.campaign.updatedAt,
      }));
      return {
        ...response,
        data: campaigns,
      };
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
   * Download a certificate by ID.
   * API: GET /certificate/download?id={certificateId}
   */
  downloadCertificate: async (certificateId: number) => {
    const response = await awmClient.get(`${API_BASE}/certificate/download`, {
      params: { id: certificateId },
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate_${certificateId}.pdf`); // Assuming PDF, adjust if needed
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
