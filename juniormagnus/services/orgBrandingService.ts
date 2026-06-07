import type { ApiResponse } from "@/types/quiz";

import { jnrClient, API_BASE } from "./httpClient";
import { normalizejnrResponse, type jnrResponseBody } from "./jnrResponse";

export interface OrgBrandingData {
  org_id: number;
  logo_url: string | null;
}

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

export const orgBrandingService = {
  /**
   * Get the current organization's logo.
   * API: GET /api/jnr/branding/logo
   */
  getOrgLogo: async () => {
    return request<OrgBrandingData>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/branding/logo`)
    );
  },

  /**
   * Get logo for a specific org by org_id.
   * API: GET /api/jnr/branding/logo/:orgId
   */
  getOrgLogoByOrgId: async (orgId: number) => {
    return request<OrgBrandingData>(() =>
      jnrClient.get<jnrResponseBody>(`${API_BASE}/branding/logo/${orgId}`)
    );
  },

  /**
   * Upload or replace the organization logo.
   * API: POST /api/jnr/branding/logo
   */
  uploadOrgLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);

    return request<OrgBrandingData>(() =>
      jnrClient.post<jnrResponseBody>(`${API_BASE}/branding/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  /**
   * Remove the organization logo (revert to default branding).
   * API: DELETE /api/jnr/branding/logo
   */
  removeOrgLogo: async () => {
    return request<OrgBrandingData>(() =>
      jnrClient.delete<jnrResponseBody>(`${API_BASE}/branding/logo`)
    );
  },
};
