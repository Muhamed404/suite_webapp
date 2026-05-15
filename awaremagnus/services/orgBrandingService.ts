import type { ApiResponse } from "@/types/quiz";

import { awmClient, API_BASE } from "./httpClient";
import { normalizeAWMResponse, type AWMResponseBody } from "./awmResponse";

export interface OrgBrandingData {
  org_id: number;
  logo_url: string | null;
}

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

export const orgBrandingService = {
  /**
   * Get the current organization's logo.
   * API: GET /api/awm/branding/logo
   */
  getOrgLogo: async () => {
    return request<OrgBrandingData>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/branding/logo`)
    );
  },

  /**
   * Get logo for a specific org by org_id.
   * API: GET /api/awm/branding/logo/:orgId
   */
  getOrgLogoByOrgId: async (orgId: number) => {
    return request<OrgBrandingData>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/branding/logo/${orgId}`)
    );
  },

  /**
   * Upload or replace the organization logo.
   * API: POST /api/awm/branding/logo
   */
  uploadOrgLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);

    return request<OrgBrandingData>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/branding/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  /**
   * Remove the organization logo (revert to default branding).
   * API: DELETE /api/awm/branding/logo
   */
  removeOrgLogo: async () => {
    return request<OrgBrandingData>(() =>
      awmClient.delete<AWMResponseBody>(`${API_BASE}/branding/logo`)
    );
  },
};
