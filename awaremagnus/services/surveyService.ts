import type {
  Survey,
  SurveyListResponse,
  SurveyStatistics,
  SurveyUserListResponse,
  SurveyUserAnswersResponse,
  SurveyCreatePayload,
  SurveyQuestion,
  SurveyQuestionCreatePayload,
  SurveyQuestionUpdatePayload,
} from "@/types/survey";
import type { AWMResponseBody } from "./awmResponse";

import { normalizeAWMResponse } from "./awmResponse";
import { awmClient, API_BASE } from "./httpClient";

/** Helper: unwrap AWM response to typed data, throw on failure */
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

async function awmPatch<T>(path: string, body: unknown): Promise<T> {
  const { data } = await awmClient.patch<AWMResponseBody>(path, body);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data as T;
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

/** Raw GET without normalizing – used when API shape wraps surveys differently */
async function rawGet<T>(path: string): Promise<T> {
  const { data } = await awmClient.get<any>(path);

  // The lists endpoint returns { success, data: { meta_statistics, surveys } }
  if (data?.success && data?.data) return data.data as T;
  if (data?.object) return data.object as T;
  if (data?.data) return data.data as T;

  return data as T;
}

export const surveyService = {
  // ─── Survey CRUD ────────────────────────────────────────────

  /** POST /api/awm/survey – Create a new survey */
  createSurvey: (payload: SurveyCreatePayload) => awmPost<any>(`${API_BASE}/survey`, payload),

  /** GET /api/awm/survey – Get all surveys */
  getAllSurveys: (params?: { status_id?: number; start_date?: string; deadline?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
        )}`
      : "";

    return awmGet<Survey[]>(`${API_BASE}/survey${query}`);
  },

  /** GET /api/awm/survey/:id – Get survey by ID */
  getSurveyById: (id: number) => awmGet<Survey>(`${API_BASE}/survey/${id}`),

  /** PATCH /api/awm/survey/:id/status – Update survey status */
  updateSurveyStatus: (id: number, status_id: number) =>
    awmPatch<Survey>(`${API_BASE}/survey/${id}/status`, { status_id }),

  /** POST /api/awm/survey/:id/retry-user-fetch – Retry user fetch */
  retryUserFetch: (id: number) =>
    awmPost<{ pending_groups: number; pending_departments: number }>(
      `${API_BASE}/survey/${id}/retry-user-fetch`,
      {}
    ),

  // ─── Survey Statistics ──────────────────────────────────────

  /** GET /api/awm/survey/lists – Survey list with meta stats */
  getSurveyListAndStats: () => rawGet<SurveyListResponse>(`${API_BASE}/survey/lists`),

  /** GET /api/awm/survey/:id/statistics – Detailed stats for a survey */
  getSurveyStatistics: (id: number) =>
    rawGet<SurveyStatistics>(`${API_BASE}/survey/${id}/statistics`),

  // ─── Survey Users ───────────────────────────────────────────

  /** GET /api/awm/survey/:id/users – Paginated user list */
  getSurveyUsers: (
    id: number,
    params?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
      search?: string;
      risk_level_id?: number;
      department_id?: number;
      group_id?: number;
      submission_status?: string;
    }
  ) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
        )}`
      : "";

    return rawGet<SurveyUserListResponse>(`${API_BASE}/survey/${id}/users${query}`);
  },

  /** GET /api/awm/survey/:surveyId/users/:userId/answers – User answers */
  getSurveyUserAnswers: (
    surveyId: number,
    userId: number,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      result_filter?: string;
    }
  ) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
        )}`
      : "";

    return rawGet<SurveyUserAnswersResponse>(
      `${API_BASE}/survey/${surveyId}/users/${userId}/answers${query}`
    );
  },

  // ─── Survey Questions ───────────────────────────────────────

  /** POST /api/awm/survey-question – Create survey question */
  createSurveyQuestion: (payload: SurveyQuestionCreatePayload) =>
    awmPost<SurveyQuestion>(`${API_BASE}/survey-question`, payload),

  /** GET /api/awm/survey-question – Get all survey questions */
  getSurveyQuestions: (params?: {
    category_id?: number;
    ques_type_id?: number;
    org_id?: number;
  }) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
        )}`
      : "";

    return awmGet<SurveyQuestion[]>(`${API_BASE}/survey-question${query}`);
  },

  /** GET /api/awm/survey-question/:id – Get question by ID */
  getSurveyQuestionById: (id: number) =>
    awmGet<SurveyQuestion>(`${API_BASE}/survey-question/${id}`),

  /** PUT /api/awm/survey-question/:id – Update question */
  updateSurveyQuestion: (id: number, payload: SurveyQuestionUpdatePayload) =>
    awmPut<SurveyQuestion>(`${API_BASE}/survey-question/${id}`, payload),

  /** DELETE /api/awm/survey-question/:id – Delete question */
  deleteSurveyQuestion: (id: number) => awmDel<null>(`${API_BASE}/survey-question/${id}`),

  /** POST /api/awm/survey-question/import – Bulk import (CSV) */
  importSurveyQuestions: (formData: FormData) => {
    return awmClient.post(`${API_BASE}/survey-question/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** POST /api/awm/survey/:id/submit - Submit survey answers */
  submitSurveyAnswers: (id: number, payload: any) =>
    awmPost<any>(`${API_BASE}/survey/${id}/submit`, payload),
};
