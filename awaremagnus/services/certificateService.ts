import type { ApiResponse } from "@/types/quiz";

import { awmClient, API_BASE } from "./httpClient";
import { normalizeAWMResponse, type AWMResponseBody } from "./awmResponse";

export interface CertificateTemplate {
  id?: number;
  lang_id: number;
  org_id?: number;
  template_text: string;
  bg_color?: string;
  bottom_logo_url?: string;
  top_logo_url?: string;
  border_image_url?: string;
  bg_watermark_url?: string;
  stamp_logo_url?: string;
  sign_image_url?: string;
  language?: {
    id: number;
    name: string;
    code: string;
  };
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

export const certificateService = {
  /**
   * Get all certificate templates.
   * API: GET /api/awm/certificate
   */
  getCertificates: async (params?: { lang_id?: number; org_id?: number; filter?: string }) => {
    return request<CertificateTemplate[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/certificate`, { params })
    );
  },

  /**
   * Get certificate template by ID.
   * API: GET /api/awm/certificate/:id
   */
  getCertificateById: async (id: number) => {
    return request<CertificateTemplate>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/certificate/${id}`)
    );
  },

  /**
   * Create a new certificate template.
   * API: POST /api/awm/certificate
   */
  createCertificate: async (formData: FormData, orgId?: number) => {
    return request<CertificateTemplate>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/certificate`, formData, {
        params: orgId !== undefined ? { org_id: orgId } : {},
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  /**
   * Update an existing certificate template.
   * API: PUT /api/awm/certificate/:id
   */
  updateCertificate: async (id: number, formData: FormData, orgId?: number) => {
    return request<CertificateTemplate>(() =>
      awmClient.put<AWMResponseBody>(`${API_BASE}/certificate/${id}`, formData, {
        params: orgId !== undefined ? { org_id: orgId } : {},
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  /**
   * Delete a certificate template.
   * API: DELETE /api/awm/certificate/:id
   */
  deleteCertificate: async (id: number) => {
    return request<null>(() => awmClient.delete<AWMResponseBody>(`${API_BASE}/certificate/${id}`));
  },

  /**
   * Download certificate template record.
   * API: GET /api/awm/certificate/download
   */
  downloadTemplate: async (moduleId: number, langId?: number) => {
    return request<CertificateTemplate>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/certificate/download`, {
        params: { module_id: moduleId, lang_id: langId },
      })
    );
  },
};
