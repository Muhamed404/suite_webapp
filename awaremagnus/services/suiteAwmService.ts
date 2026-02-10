import type { SuiteCategory, SuiteContentType, SuiteResponse } from "@/types/suiteAwm";
import type { AWMResponseBody } from "./awmResponse";

import { normalizeAWMResponse } from "./awmResponse";
import { awmClient, API_BASE, suiteClient } from "./httpClient";

const SUITE_AWM = "/awm";

/** Suite may return payload in `data` or in `message` (AWM-style). */
type SuiteListResponse<T> =
  | SuiteResponse<T>
  | {
      message: T;
      statusCode?: number;
      alertType?: string;
    };

function extractPayload<T>(raw: SuiteListResponse<T>): T {
  const r = raw as Record<string, unknown>;

  if (Array.isArray(r.message)) return r.message as T;
  if (r.message != null && typeof r.message === "object") return r.message as T;
  if (r.data != null) return r.data as T;

  return r as T;
}

async function get<T>(path: string): Promise<T> {
  const { data } = await suiteClient.get<SuiteListResponse<T>>(path);

  return extractPayload(data);
}

async function post<T>(path: string, body: unknown): Promise<SuiteResponse<T>["data"]> {
  const { data } = await suiteClient.post<SuiteResponse<T>>(path, body);

  return data.data;
}

async function put<T>(path: string, body: unknown): Promise<SuiteResponse<T>["data"]> {
  const { data } = await suiteClient.put<SuiteResponse<T>>(path, body);

  return data.data;
}

async function del<T>(path: string): Promise<SuiteResponse<T>["data"]> {
  const { data } = await suiteClient.delete<SuiteResponse<T>>(path);

  return data.data;
}

/** AWM backend content-type request helpers */
async function awmGet<T>(path: string): Promise<T> {
  const { data } = await awmClient.get<AWMResponseBody>(path);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success || normalized.data == null) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data;
}

async function awmPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await awmClient.post<AWMResponseBody>(path, body);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success || normalized.data == null) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data;
}

async function awmPut<T>(path: string, body: unknown): Promise<T> {
  const { data } = await awmClient.put<AWMResponseBody>(path, body);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data as T;
}

async function awmDel<T>(path: string): Promise<T> {
  const { data } = await awmClient.delete<AWMResponseBody>(path);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data as T;
}

export const suiteAwmService = {
  /** GET /awm/categories (Service Suite) */
  getCategories: () => get<SuiteCategory[]>(`${SUITE_AWM}/categories`),

  /** GET /awm/categories/:id (Service Suite) */
  getCategoryById: (id: number) => get<SuiteCategory>(`${SUITE_AWM}/categories/${id}`),

  /** POST /awm/categories (Service Suite) */
  createCategory: (payload: {
    name: string;
    code: string;
    description?: string;
    status?: boolean;
  }) => post<SuiteCategory>(`${SUITE_AWM}/categories`, payload),

  /** PUT /awm/categories/:id (Service Suite) */
  updateCategory: (
    id: number,
    payload: { name?: string; code?: string; description?: string; status?: boolean }
  ) => put<number>(`${SUITE_AWM}/categories/${id}`, payload),

  /** DELETE /awm/categories/:id (Service Suite) */
  deleteCategory: (id: number) => del<number>(`${SUITE_AWM}/categories/${id}`),

  /** GET /api/awm/content-types (AWM Backend) */
  getContentTypes: () => awmGet<SuiteContentType[]>(`${API_BASE}/content-types`),

  /** GET /api/awm/content-types/:id (AWM Backend) */
  getContentTypeById: (id: number) => awmGet<SuiteContentType>(`${API_BASE}/content-types/${id}`),

  /** POST /api/awm/content-types (AWM Backend) */
  createContentType: (payload: { name: string }) =>
    awmPost<SuiteContentType>(`${API_BASE}/content-types`, payload),

  /** PUT /api/awm/content-types/:id (AWM Backend) */
  updateContentType: (id: number, payload: { name?: string }) =>
    awmPut<SuiteContentType>(`${API_BASE}/content-types/${id}`, payload),

  /** DELETE /api/awm/content-types/:id (AWM Backend) */
  deleteContentType: (id: number) => awmDel<number>(`${API_BASE}/content-types/${id}`),
};
