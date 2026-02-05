import type {
  Module,
  ModuleTranslation,
  ModuleContent,
  QuizType,
  Quiz,
  QuizAnswer,
  CreateQuizPayload,
  UpdateQuizPayload,
  CreateModulePayload,
  UpdateModulePayload,
  AddModuleTranslationPayload,
  CreateContentPayload,
  UpdateContentPayload,
  ApiResponse,
} from "@/types/quiz";

import type { AWMResponseBody } from "./awmResponse";
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

export const quizService = {
  /** Modules - API: GET /module returns object.modules, object.count */
  getModules: async (params?: {
    category_id?: number;
    lang_id?: number;
    status_id?: number;
    status?: number;
    org_id?: number;
    is_global?: boolean;
    assigned_only?: boolean;
    campaign_id?: number;
    module_status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const p = { ...params };
    if (p.status != null && p.status_id == null) {
      p.status_id = p.status;
    }
    return request<Module[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module`, { params: p }),
    );
  },

  getModuleById: async (id: number) => {
    return request<Module>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module/${id}`),
    );
  },

  /** API: POST /module - backend expects { module: { category_id, code, name?, difficulty, org_id }, translations: [ { language_id, name, description }, ... ] } */
  createModule: async (payload: CreateModulePayload) => {
    const moduleData = {
      category_id: payload.module.category_id,
      code: payload.module.code,
      ...(payload.module.name != null && payload.module.name !== "" && { name: payload.module.name.trim() }),
      difficulty: payload.module.difficulty ?? 1,
      org_id: payload.module.org_id ?? 0,
    };
    const translations = (payload.translations ?? []).map((tr) => ({
      language_id: tr.language_id,
      name: tr.name?.trim() ?? "",
      description: tr.description?.trim() ?? "",
    }));
    const body = { module: moduleData, translations };
    return request<Module>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/module`, body),
    );
  },

  updateModule: async (id: number, payload: UpdateModulePayload) => {
    return request<Module>(() =>
      awmClient.put<AWMResponseBody>(`${API_BASE}/module/${id}`, payload),
    );
  },

  deleteModule: async (id: number) => {
    return request<unknown>(() =>
      awmClient.delete<AWMResponseBody>(`${API_BASE}/module/${id}`),
    );
  },

  addModuleTranslation: async (
    moduleId: number,
    payload: AddModuleTranslationPayload,
  ) => {
    const name = payload.name ?? payload.title ?? "";
    const body = {
      language_id: payload.language_id,
      name,
      title: name,
      description: payload.description,
    };
    return request<ModuleTranslation>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/module/${moduleId}/translation`, body),
    );
  },

  /** Module contents - API: GET /module-content?lang_id=1 etc. returns object.contents */
  getContents: async (params?: {
    mod_id?: number;
    module_id?: number;
    content_type_id?: number;
    lang_id?: number;
    status?: number;
  }) => {
    const p = { ...params };
    if (p.mod_id != null && p.module_id == null) p.module_id = p.mod_id;
    return request<ModuleContent[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module-content`, { params: p }),
    );
  },

  getContentsByModule: async (
    moduleId: number,
    params?: { lang_id?: number },
  ) => {
    const res = await request<ModuleContent[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module/${moduleId}/contents`, {
        params: params?.lang_id != null ? { lang_id: params.lang_id } : undefined,
      }),
    );
    if (res.success && Array.isArray(res.data)) {
      res.data = res.data.map((c) => {
        const raw = c as unknown as Record<string, unknown>;
        const contentType = raw.contentType as { id?: number; name?: string } | undefined;
        const language = raw.language as { id?: number; name?: string } | undefined;
        const content_type_id =
          c.content_type_id ??
          (raw.contype_id as number | undefined) ??
          contentType?.id;
        const translations = c.translations ?? (language?.id != null ? [{ language_id: language.id }] : []);
        const nameFromApi = raw.name as string | undefined;
        const logoUrl = (raw.logo_url as string | undefined) ?? c.logo_url;
        const sourceUrl = (raw.source_url as string | undefined) ?? c.source_url;
        const description = (raw.description as string | undefined) ?? c.description;
        return {
          ...c,
          mod_id: c.mod_id ?? (raw.mod_id as number | undefined) ?? moduleId,
          content_type_id: content_type_id ?? 0,
          order: c.order ?? (raw.sequence_no as number | undefined) ?? 0,
          title: c.title ?? nameFromApi,
          logo_url: logoUrl,
          source_url: sourceUrl,
          description: description ?? undefined,
          language: language ? { id: language.id, name: language.name } : c.language,
          translations,
        } as ModuleContent;
      });
    }
    return res;
  },

  getContentById: async (id: number) => {
    const res = await request<ModuleContent>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/module-content/${id}`),
    );
    if (res.success && res.data) {
      const raw = res.data as unknown as Record<string, unknown>;
      const contentType = raw.contentType as { id?: number; name?: string } | undefined;
      const language = raw.language as { id?: number; name?: string } | undefined;
      const nameFromApi = raw.name as string | undefined;
      res.data = {
        ...res.data,
        content_type_id: res.data.content_type_id ?? (raw.contype_id as number) ?? contentType?.id ?? 0,
        title: res.data.title ?? nameFromApi,
        logo_url: (raw.logo_url as string | undefined) ?? res.data.logo_url,
        source_url: (raw.source_url as string | undefined) ?? res.data.source_url,
        description: (raw.description as string | undefined) ?? res.data.description,
        language: language ? { id: language.id, name: language.name } : res.data.language,
      } as ModuleContent;
    }
    return res;
  },

  createContent: async (payload: CreateContentPayload) => {
    const formData = new FormData();
    formData.append("mod_id", String(payload.mod_id));
    formData.append("contype_id", String(payload.content_type_id));
    formData.append("lang_id", String(payload.lang_id));
    formData.append("name", payload.name);
    formData.append("order", String(payload.order));
    if (payload.duration !== undefined && payload.duration !== null) {
      formData.append("duration", String(payload.duration));
    }
    formData.append("org_id", String(payload.org_id ?? 0));
    if (payload.source_url) formData.append("source_url", payload.source_url);
    if (payload.logo) formData.append("logo", payload.logo);
    if (payload.source) formData.append("source", payload.source);
    formData.append("translations", JSON.stringify(payload.translations));

    const { data } = await awmClient.post<AWMResponseBody>(`${API_BASE}/module-content`, formData);
    return normalizeAWMResponse<ModuleContent>(data) as ApiResponse<ModuleContent>;
  },

  updateContent: async (id: number, payload: UpdateContentPayload) => {
    const formData = new FormData();
    if (payload.content_type_id !== undefined) formData.append("content_type_id", String(payload.content_type_id));
    if (payload.order !== undefined) formData.append("order", String(payload.order));
    if (payload.duration !== undefined) formData.append("duration", String(payload.duration));
    if (payload.logo) formData.append("logo", payload.logo);
    if (payload.source) formData.append("source", payload.source);
    if (payload.source_url) formData.append("source_url", payload.source_url);

    const { data } = await awmClient.put<AWMResponseBody>(`${API_BASE}/module-content/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeAWMResponse<ModuleContent>(data) as ApiResponse<ModuleContent>;
  },

  deleteContent: async (id: number) => {
    return request<unknown>(() =>
      awmClient.delete<AWMResponseBody>(`${API_BASE}/module-content/${id}`),
    );
  },

  /** Quiz types - API: GET /quiz-type */
  getQuizTypes: async () => {
    return request<QuizType[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/quiz-type`),
    );
  },

  /** Quizzes - API: GET /quiz params: content_id, quiz_type_id, is_mandatory */
  getQuizzes: async (params?: {
    limit?: number;
    offset?: number;
    mod_content_id?: number;
    content_id?: number;
    quiz_type_id?: number;
    is_mandatory?: boolean;
  }) => {
    const p = params ? { ...params } : {};
    if (p.mod_content_id != null && p.content_id == null) p.content_id = p.mod_content_id;
    const res = await request<Quiz[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/quiz`, { params: p }),
    );
    if (res.success && Array.isArray(res.data)) {
      res.data = res.data.map((q) => {
        const raw = q as unknown as Record<string, unknown>;
        const qtype_id = (raw.qtype_id as number) ?? q.quiz_type_id;
        const quizType = (raw.quizType as { id?: number; name?: string }) ?? q.quizType;
        return {
          ...q,
          quiz_type_id: qtype_id ?? q.quiz_type_id,
          mod_content_id: (raw.con_id as number) ?? q.mod_content_id ?? q.content_id,
          content_id: (raw.con_id as number) ?? q.content_id,
          quizType: quizType ? { id: quizType.id ?? qtype_id ?? 0, name: quizType.name } : q.quizType,
        } as Quiz;
      });
    }
    return res;
  },

  getQuizById: async (id: number) => {
    const res = await request<Quiz | Quiz[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/quiz/${id}`),
    );
    if (!res.success || res.data == null) return res as ApiResponse<Quiz>;
    let raw = res.data;
    if (Array.isArray(raw) && raw.length === 1) raw = raw[0] as Quiz;
    if (Array.isArray(raw)) return res as ApiResponse<Quiz>;
    const q = raw as unknown as Record<string, unknown>;
    const qtype_id = (q.qtype_id as number) ?? (raw as Quiz).quiz_type_id;
    const quizType = (q.quizType as { id?: number; name?: string }) ?? (raw as Quiz).quizType;
    const con_id = q.con_id as number | undefined;
    const apiAnswers = (q.answers as Array<{ id?: number; answer?: string; validity?: boolean }>) ?? (raw as Quiz).answers;
    const answers: QuizAnswer[] = Array.isArray(apiAnswers)
      ? apiAnswers.map((a, i) => ({
          id: a.id,
          answer_text: (a as { answer_text?: string }).answer_text ?? (a.answer ?? ""),
          is_correct: (a as { is_correct?: boolean }).is_correct ?? !!a.validity,
          order: i + 1,
        }))
      : (raw as Quiz).answers ?? [];
    (res as ApiResponse<Quiz>).data = {
      ...(raw as Quiz),
      quiz_type_id: qtype_id ?? (raw as Quiz).quiz_type_id,
      mod_content_id: con_id ?? (raw as Quiz).mod_content_id ?? (raw as Quiz).content_id,
      content_id: con_id ?? (raw as Quiz).content_id,
      quizType: quizType ? { id: quizType.id ?? qtype_id ?? 0, name: quizType.name } : (raw as Quiz).quizType,
      answers,
    } as Quiz;
    return res as ApiResponse<Quiz>;
  },

  /** API: GET /quiz/content/{contentId} */
  getQuizzesByContent: async (contentId: number) => {
    const res = await request<Quiz[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/quiz/content/${contentId}`),
    );
    if (res.success && Array.isArray(res.data)) {
      res.data = res.data.map((q) => {
        const raw = q as unknown as Record<string, unknown>;
        const qtype_id = (raw.qtype_id as number) ?? q.quiz_type_id;
        const quizType = (raw.quizType as { id?: number; name?: string }) ?? q.quizType;
        return {
          ...q,
          quiz_type_id: qtype_id ?? q.quiz_type_id,
          mod_content_id: (raw.con_id as number) ?? q.mod_content_id ?? q.content_id,
          content_id: (raw.con_id as number) ?? q.content_id,
          quizType: quizType ? { id: quizType.id ?? qtype_id ?? 0, name: quizType.name } : q.quizType,
        } as Quiz;
      });
    }
    return res;
  },

  /** API: POST /quiz body: { quiz: { content_id, quiz_type_id, question, ... } }; backend may also accept answers in same payload. Then POST /quiz-answer per answer if not sent. */
  createQuiz: async (payload: CreateQuizPayload) => {
    const q = payload.quiz;
    const contentId = q.mod_content_id ?? (q as { content_id?: number }).content_id ?? 0;
    const quizBody = {
      content_id: contentId,
      quiz_type_id: q.quiz_type_id,
      question: q.question,
      explanation: q.explanation,
      is_mandatory: true,
      order: 1,
    };
    const body: { quiz: typeof quizBody; answers?: typeof payload.answers } = {
      quiz: quizBody,
    };
    if (payload.answers?.length) {
      body.answers = payload.answers;
    }
    const res = await request<Quiz>(() =>
      awmClient.post<AWMResponseBody>(`${API_BASE}/quiz`, body),
    );
    if (!res.success || !res.data?.id || !payload.answers?.length) return res;
    for (const a of payload.answers) {
      await awmClient.post<AWMResponseBody>(`${API_BASE}/quiz-answer`, {
        quiz_id: res.data.id,
        answer_text: a.answer_text,
        is_correct: a.is_correct,
        order: a.order,
      }).catch(() => ({}));
    }
    return res;
  },

  updateQuiz: async (id: number, payload: UpdateQuizPayload) => {
    return request<Quiz>(() =>
      awmClient.put<AWMResponseBody>(`${API_BASE}/quiz/${id}`, payload),
    );
  },

  deleteQuiz: async (id: number) => {
    return request<unknown>(() =>
      awmClient.delete<AWMResponseBody>(`${API_BASE}/quiz/${id}`),
    );
  },

  /** API: GET /quiz/{quizId}/answers */
  getQuizAnswers: async (quizId: number) => {
    return request<QuizAnswer[]>(() =>
      awmClient.get<AWMResponseBody>(`${API_BASE}/quiz/${quizId}/answers`),
    );
  },
};
