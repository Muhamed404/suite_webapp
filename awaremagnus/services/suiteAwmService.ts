import type {
  SuiteCategory,
  SuiteContentType,
  SuiteResponse,
} from "@/types/suiteAwm";
import { suiteClient } from "./httpClient";

const AWM = "/awm";

/** Suite may return payload in `data` or in `message` (AWM-style). */
type SuiteListResponse<T> = SuiteResponse<T> | {
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

export const suiteAwmService = {
  /** GET /awm/categories */
  getCategories: () => get<SuiteCategory[]>(`${AWM}/categories`),

  /** GET /awm/categories/:id */
  getCategoryById: (id: number) => get<SuiteCategory>(`${AWM}/categories/${id}`),

  /** POST /awm/categories */
  createCategory: (payload: {
    name: string;
    code: string;
    description?: string;
    status?: boolean;
  }) => post<SuiteCategory>(`${AWM}/categories`, payload),

  /** PUT /awm/categories/:id */
  updateCategory: (
    id: number,
    payload: { name?: string; code?: string; description?: string; status?: boolean },
  ) => put<number>(`${AWM}/categories/${id}`, payload),

  /** DELETE /awm/categories/:id */
  deleteCategory: (id: number) => del<number>(`${AWM}/categories/${id}`),

  /** GET /awm/content-types */
  getContentTypes: () => get<SuiteContentType[]>(`${AWM}/content-types`),

  /** GET /awm/content-types/:id */
  getContentTypeById: (id: number) =>
    get<SuiteContentType>(`${AWM}/content-types/${id}`),

  /** POST /awm/content-types */
  createContentType: (payload: { name: string }) =>
    post<SuiteContentType>(`${AWM}/content-types`, payload),

  /** PUT /awm/content-types/:id */
  updateContentType: (id: number, payload: { name?: string }) =>
    put<number>(`${AWM}/content-types/${id}`, payload),

  /** DELETE /awm/content-types/:id */
  deleteContentType: (id: number) => del<number>(`${AWM}/content-types/${id}`),
};
