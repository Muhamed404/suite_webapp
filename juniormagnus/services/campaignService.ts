import type { CampaignAssignment, Certificate } from "@/types/campaign";
import type { Module } from "@/types/quiz";
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

export const campaignService = {
  /**
   * Get campaigns assigned to the current user (Org User).
   * API: GET /api/jnr/campaign/assignments
   */
  getAssignedCampaigns: async (userId: number, campaignId?: string) => {
    const params: Record<string, any> = {};

    if (campaignId && campaignId !== "all") {
      params.campaign_id = campaignId;
    }
    const response = await request<any>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/campaign/assignments`, { params })
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
      jnrClient.get<jnrResponseBody>(`${API_BASE}/module`, {
        params: { campaign_id: campaignId, assigned_only: true },
      })
    );
  },

  /**
   * Get certificates earned by the current user.
   * API: GET /certificate/user/my-certificates  (uses token to identify user)
   */
  getUserCertificates: async (languageId?: string) => {
    return request<Certificate[]>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/certificate/user/my-certificates`, {
        params: { lang_id: languageId || "1" },
      })
    );
  },

  /**
   * Download a certificate by ID. Optionally include module_id as query param.
   * API: GET /certificate/download?id={certificateId}&module_id={moduleId}
   */
  downloadCertificate: async (certificateId: number, moduleId?: number | null) => {
    const params: Record<string, any> = { id: certificateId };

    if (moduleId != null) params.module_id = moduleId;

    const response = await jnrClient.get(`${API_BASE}/certificate/download`, {
      params,
      responseType: "arraybuffer",
      headers: {
        Accept: "application/pdf",
      },
    });

    const contentType: string =
      (response.headers && (response.headers["content-type"] as string)) || "";
      
    if (contentType.includes("application/json")) {
      const text = new TextDecoder().decode(response.data as ArrayBuffer);
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
      throw new Error(
        `certificate download failed: ${body?.message || "unknown error"}`
      );
    }

    // create a proper PDF blob so the OS knows how to handle it
    const blob = new Blob([response.data], { type: "application/pdf" });

    // build the filename the same way we did before
    const filename = moduleId
      ? `certificate_${certificateId}_module_${moduleId}.pdf`
      : `certificate_${certificateId}.pdf`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Begin a campaign for the current user.
   * API: POST /useraction/report-actions/begin-campaign
   */
  beginCampaign: async (campaignId: number) => {
    return request<unknown>(() =>
      jnrClient.post<jnrResponseBody>(`${API_BASE}/useraction/report-actions/begin-campaign`, {
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
      jnrClient.post<jnrResponseBody>(`${API_BASE}/useraction/report-actions/begin-module`, {
        campaign_id: campaignId,
        module_id: moduleId,
      })
    );
  },

  /**
   * Begin a specific content item within a module/campaign for the current user.
   * API: POST /api/jnr/useraction/report-actions/begin-content
   */
  beginContent: async (campaignId: number, moduleId: number, contentId: number) => {
    return request<unknown>(() =>
      jnrClient.post<jnrResponseBody>(
        `${API_BASE}/useraction/report-actions/begin-content`,
        {
          campaign_id: campaignId,
          module_id: moduleId,
          content_id: contentId,
        }
      )
    );
  },

  /**
   * Fetch module report (no mapping done yet).
   * API: GET /report/modules/:id
   */
  getModuleReport: async (moduleId: number) => {
    return request<unknown>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/report/modules/${moduleId}`)
    );
  },
};
