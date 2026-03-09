import type {
  SurveyCreatePayload,
  SurveyQuestionCreatePayload,
  SurveyQuestionUpdatePayload,
} from "@/types/survey";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { surveyService } from "@/services/surveyService";

export const SURVEY_KEYS = {
  all: ["surveys"] as const,
  lists: ["surveys", "lists"] as const,
  detail: (id: number) => ["surveys", id] as const,
  statistics: (id: number) => ["surveys", id, "statistics"] as const,
  users: (id: number, params?: Record<string, any>) => ["surveys", id, "users", params] as const,
  userAnswers: (surveyId: number, userId: number) =>
    ["surveys", surveyId, "users", userId, "answers"] as const,
  questions: (params?: Record<string, any>) => ["survey-questions", params] as const,
  question: (id: number) => ["survey-questions", id] as const,
};

// ─── Survey List with Stats ──────────────────────────────────

/** Fetch survey list with meta statistics */
export function useSurveyListAndStats(enabled = true) {
  return useQuery({
    queryKey: SURVEY_KEYS.lists,
    queryFn: () => surveyService.getSurveyListAndStats(),
    enabled,
  });
}

// ─── Survey CRUD ─────────────────────────────────────────────

/** Get all surveys */
export function useSurveys(
  params?: { status_id?: number; start_date?: string; deadline?: string },
  enabled = true
) {
  return useQuery({
    queryKey: [...SURVEY_KEYS.all, params],
    queryFn: () => surveyService.getAllSurveys(params),
    enabled,
  });
}

/** Get survey by ID */
export function useSurvey(id: number, enabled = true) {
  return useQuery({
    queryKey: SURVEY_KEYS.detail(id),
    queryFn: () => surveyService.getSurveyById(id),
    enabled: enabled && !!id,
  });
}

/** Create survey */
export function useCreateSurvey() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SurveyCreatePayload) => surveyService.createSurvey(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.lists });
    },
  });
}

/** Update survey status */
export function useUpdateSurveyStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status_id }: { id: number; status_id: number }) =>
      surveyService.updateSurveyStatus(id, status_id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.lists });
    },
  });
}

/** Retry user fetch for failed groups/departments */
export function useRetrySurveyUserFetch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => surveyService.retryUserFetch(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.detail(id) });
    },
  });
}

// ─── Survey Statistics ───────────────────────────────────────

/** Get detailed statistics for a survey */
export function useSurveyStatistics(id: number, enabled = true) {
  return useQuery({
    queryKey: SURVEY_KEYS.statistics(id),
    queryFn: () => surveyService.getSurveyStatistics(id),
    enabled: enabled && !!id,
  });
}

// ─── Survey Users ────────────────────────────────────────────

/** Get paginated survey users */
export function useSurveyUsers(
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
  },
  enabled = true
) {
  return useQuery({
    queryKey: SURVEY_KEYS.users(id, params),
    queryFn: () => surveyService.getSurveyUsers(id, params),
    enabled: enabled && !!id,
  });
}

/** Get user answers for a survey */
export function useSurveyUserAnswers(
  surveyId: number,
  userId: number,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    result_filter?: string;
  },
  enabled = true
) {
  return useQuery({
    queryKey: [...SURVEY_KEYS.userAnswers(surveyId, userId), params],
    queryFn: () => surveyService.getSurveyUserAnswers(surveyId, userId, params),
    enabled: enabled && !!surveyId && !!userId,
  });
}

// ─── Survey Questions ────────────────────────────────────────

/** Get all survey questions */
export function useSurveyQuestions(
  params?: { category_id?: number; ques_type_id?: number; org_id?: number },
  enabled = true
) {
  return useQuery({
    queryKey: SURVEY_KEYS.questions(params),
    queryFn: () => surveyService.getSurveyQuestions(params),
    enabled,
  });
}

/** Get survey question by ID */
export function useSurveyQuestion(id: number, enabled = true) {
  return useQuery({
    queryKey: SURVEY_KEYS.question(id),
    queryFn: () => surveyService.getSurveyQuestionById(id),
    enabled: enabled && !!id,
  });
}

/** Create survey question */
export function useCreateSurveyQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SurveyQuestionCreatePayload) =>
      surveyService.createSurveyQuestion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["survey-questions"] });
    },
  });
}

/** Update survey question */
export function useUpdateSurveyQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SurveyQuestionUpdatePayload }) =>
      surveyService.updateSurveyQuestion(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: SURVEY_KEYS.question(id) });
      qc.invalidateQueries({ queryKey: ["survey-questions"] });
    },
  });
}

/** Delete survey question */
export function useDeleteSurveyQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => surveyService.deleteSurveyQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["survey-questions"] });
    },
  });
}

/** Import survey questions from CSV */
export function useImportSurveyQuestions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => surveyService.importSurveyQuestions(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["survey-questions"] });
    },
  });
}
