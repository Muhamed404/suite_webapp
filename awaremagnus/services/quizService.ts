import { awmClient } from "./httpClient";
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

const BASE = "/api/awm";

export const quizService = {
  /** Modules */
  getModules: async (params?: {
    category_id?: number;
    status?: number;
    org_id?: number;
  }) => {
    const { data } = await awmClient.get<ApiResponse<Module[]>>(`${BASE}/module`, {
      params,
    });
    return data;
  },

  getModuleById: async (id: number) => {
    const { data } = await awmClient.get<ApiResponse<Module>>(`${BASE}/module/${id}`);
    return data;
  },

  createModule: async (payload: CreateModulePayload) => {
    const { data } = await awmClient.post<ApiResponse<Module>>(`${BASE}/module`, payload);
    return data;
  },

  updateModule: async (id: number, payload: UpdateModulePayload) => {
    const { data } = await awmClient.put<ApiResponse<Module>>(
      `${BASE}/module/${id}`,
      payload
    );
    return data;
  },

  deleteModule: async (id: number) => {
    const { data } = await awmClient.delete<ApiResponse<unknown>>(
      `${BASE}/module/${id}`
    );
    return data;
  },

  addModuleTranslation: async (
    moduleId: number,
    payload: AddModuleTranslationPayload
  ) => {
    const { data } = await awmClient.post<ApiResponse<ModuleTranslation>>(
      `${BASE}/module/${moduleId}/translation`,
      payload
    );
    return data;
  },

  /** Module contents */
  getContents: async (params?: {
    mod_id?: number;
    content_type_id?: number;
    status?: number;
  }) => {
    const { data } = await awmClient.get<ApiResponse<ModuleContent[]>>(
      `${BASE}/module-content`,
      { params }
    );
    return data;
  },

  getContentsByModule: async (moduleId: number) => {
    const { data } = await awmClient.get<ApiResponse<ModuleContent[]>>(
      `${BASE}/module/${moduleId}/contents`
    );
    return data;
  },

  getContentById: async (id: number) => {
    const { data } = await awmClient.get<ApiResponse<ModuleContent>>(
      `${BASE}/module-content/${id}`
    );
    return data;
  },

  createContent: async (payload: CreateContentPayload) => {
    const formData = new FormData();
    formData.append("mod_id", String(payload.mod_id));
    formData.append("content_type_id", String(payload.content_type_id));
    formData.append("order", String(payload.order));
    if (payload.duration) {
      formData.append("duration", String(payload.duration));
    }
    if (payload.org_id !== undefined) {
      formData.append("org_id", String(payload.org_id));
    }
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }
    if (payload.source) {
      formData.append("source", payload.source);
    }
    if (payload.source_url) {
      formData.append("source_url", payload.source_url);
    }
    formData.append("translations", JSON.stringify(payload.translations));

    const { data } = await awmClient.post<ApiResponse<ModuleContent>>(
      `${BASE}/module-content`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  updateContent: async (id: number, payload: UpdateContentPayload) => {
    const formData = new FormData();
    if (payload.content_type_id !== undefined) {
      formData.append("content_type_id", String(payload.content_type_id));
    }
    if (payload.order !== undefined) {
      formData.append("order", String(payload.order));
    }
    if (payload.duration !== undefined) {
      formData.append("duration", String(payload.duration));
    }
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }
    if (payload.source) {
      formData.append("source", payload.source);
    }
    if (payload.source_url) {
      formData.append("source_url", payload.source_url);
    }

    const { data } = await awmClient.put<ApiResponse<ModuleContent>>(
      `${BASE}/module-content/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  deleteContent: async (id: number) => {
    const { data } = await awmClient.delete<ApiResponse<unknown>>(
      `${BASE}/module-content/${id}`
    );
    return data;
  },

  /** Quiz types: 1=Single, 2=Multiple, 3=True/False */
  getQuizTypes: async () => {
    const { data } = await awmClient.get<ApiResponse<QuizType[]>>(
      `${BASE}/quiz-type`
    );
    return data;
  },

  /** Quizzes */
  getQuizzes: async (params?: {
    limit?: number;
    offset?: number;
    mod_content_id?: number;
  }) => {
    const { data } = await awmClient.get<ApiResponse<Quiz[]>>(`${BASE}/quiz`, {
      params,
    });
    return data;
  },

  getQuizById: async (id: number) => {
    const { data } = await awmClient.get<ApiResponse<Quiz>>(`${BASE}/quiz/${id}`);
    return data;
  },

  getQuizzesByContent: async (contentId: number) => {
    const { data } = await awmClient.get<ApiResponse<Quiz[]>>(
      `${BASE}/quiz/content/${contentId}`
    );
    return data;
  },

  createQuiz: async (payload: CreateQuizPayload) => {
    const { data } = await awmClient.post<ApiResponse<Quiz>>(`${BASE}/quiz`, payload);
    return data;
  },

  updateQuiz: async (id: number, payload: UpdateQuizPayload) => {
    const { data } = await awmClient.put<ApiResponse<Quiz>>(
      `${BASE}/quiz/${id}`,
      payload
    );
    return data;
  },

  deleteQuiz: async (id: number) => {
    const { data } = await awmClient.delete<ApiResponse<unknown>>(
      `${BASE}/quiz/${id}`
    );
    return data;
  },

  getQuizAnswers: async (quizId: number) => {
    const { data } = await awmClient.get<ApiResponse<QuizAnswer[]>>(
      `${BASE}/quiz/${quizId}/answers`
    );
    return data;
  },
};
