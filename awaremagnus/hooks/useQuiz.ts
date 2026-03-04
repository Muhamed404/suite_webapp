import type {
  CreateQuizPayload,
  UpdateQuizPayload,
  CreateModulePayload,
  UpdateModulePayload,
  AddModuleTranslationPayload,
  CreateContentPayload,
  UpdateContentPayload,
} from "@/types/quiz";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { quizService } from "@/services/quizService";

export const QUIZ_KEYS = {
  modules: ["quiz", "modules"] as const,
  module: (id: number) => ["quiz", "module", id] as const,
  contents: (modId?: number, langId?: number) => ["quiz", "contents", { modId, langId }] as const,
  content: (id: number) => ["quiz", "content", id] as const,
  quizTypes: ["quiz", "quizTypes"] as const,
  quizzes: (params?: { contentId?: number }) => ["quiz", "quizzes", params] as const,
  quiz: (id: number) => ["quiz", "quiz", id] as const,
  quizAnswers: (quizId: number) => ["quiz", "quiz", quizId, "answers"] as const,
};

export function useModules(params?: {
  category_id?: number;
  lang_id?: number;
  status?: number;
  org_id?: number;
  assigned_only?: boolean;
  filter?: string;
}, enabled = true) {
  return useQuery({
    queryKey: [...QUIZ_KEYS.modules, params],
    queryFn: () => quizService.getModules(params),
    enabled,
  });
}

export function useModule(id: number, enabled = true) {
  return useQuery({
    queryKey: QUIZ_KEYS.module(id),
    queryFn: () => quizService.getModuleById(id),
    enabled: enabled && !!id,
  });
}

export function useContents(params?: {
  mod_id?: number;
  content_type_id?: number;
  lang_id?: number;
  status?: number;
}) {
  return useQuery({
    queryKey: QUIZ_KEYS.contents(params?.mod_id, params?.lang_id),
    queryFn: () => quizService.getContents(params),
    enabled: params?.mod_id != null,
  });
}

export function useContentsByModule(
  moduleId: number,
  enabledOrOptions?: boolean | { enabled?: boolean; lang_id?: number }
) {
  const options =
    typeof enabledOrOptions === "boolean"
      ? { enabled: enabledOrOptions }
      : (enabledOrOptions ?? { enabled: true });
  const enabled = options.enabled ?? true;
  const lang_id = options.lang_id;

  return useQuery({
    queryKey: QUIZ_KEYS.contents(moduleId, lang_id),
    queryFn: () =>
      quizService.getContentsByModule(moduleId, lang_id != null ? { lang_id } : undefined),
    enabled: enabled && !!moduleId,
  });
}

export function useContent(id: number, enabled = true) {
  return useQuery({
    queryKey: QUIZ_KEYS.content(id),
    queryFn: () => quizService.getContentById(id),
    enabled: enabled && !!id,
  });
}

export function useQuizTypes() {
  return useQuery({
    queryKey: QUIZ_KEYS.quizTypes,
    queryFn: quizService.getQuizTypes,
  });
}

export function useQuizzes(params?: { contentId?: number; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: QUIZ_KEYS.quizzes(params),
    queryFn: () =>
      quizService.getQuizzes({
        mod_content_id: params?.contentId,
        limit: params?.limit,
        offset: params?.offset,
      }),
  });
}

export function useQuizzesByContent(contentId: number, enabled = true) {
  return useQuery({
    queryKey: QUIZ_KEYS.quizzes({ contentId }),
    queryFn: () => quizService.getQuizzesByContent(contentId),
    enabled: enabled && !!contentId,
  });
}

/** Fetches all quizzes for a module by first getting contents then quizzes per content */
export function useQuizzesByModule(moduleId: number, enabled = true) {
  return useQuery({
    queryKey: [...QUIZ_KEYS.contents(moduleId), "quizzes"],
    queryFn: async () => {
      const contentsRes = await quizService.getContentsByModule(moduleId);
      const contents =
        contentsRes?.success && Array.isArray(contentsRes.data) ? contentsRes.data : [];
      const contentIds = contents.map((c: { id: number }) => c.id);
      const results = await Promise.all(
        contentIds.map((id: number) => quizService.getQuizzesByContent(id))
      );
      const all = results.flatMap((r) => (r?.success && Array.isArray(r?.data) ? r.data : []));

      // Create a map of content_id to content name for category display
      const contentMap: Record<number, string> = {};
      contents.forEach((c: { id: number; title?: string; name?: string }) => {
        contentMap[c.id] = c.title || (c as { name?: string }).name || `Content ${c.id}`;
      });

      return { success: true, data: all, contentMap };
    },
    enabled: enabled && !!moduleId,
  });
}

export function useQuiz(id: number, enabled = true) {
  return useQuery({
    queryKey: QUIZ_KEYS.quiz(id),
    queryFn: () => quizService.getQuizById(id),
    enabled: enabled && !!id,
  });
}

export function useQuizAnswers(quizId: number, enabled = true) {
  return useQuery({
    queryKey: QUIZ_KEYS.quizAnswers(quizId),
    queryFn: () => quizService.getQuizAnswers(quizId),
    enabled: enabled && !!quizId,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuizPayload) => quizService.createQuiz(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz"] });
    },
  });
}

export function useUpdateQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateQuizPayload }) =>
      quizService.updateQuiz(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.quiz(id) });
      qc.invalidateQueries({ queryKey: ["quiz"] });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quizService.deleteQuiz(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz"] });
    },
  });
}

/** Module Mutations */
export function useCreateModule() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModulePayload) => quizService.createModule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.modules });
    },
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateModulePayload }) =>
      quizService.updateModule(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.module(id) });
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.modules });
    },
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quizService.deleteModule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.modules });
    },
  });
}

export function useAddModuleTranslation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      payload,
    }: {
      moduleId: number;
      payload: AddModuleTranslationPayload;
    }) => quizService.addModuleTranslation(moduleId, payload),
    onSuccess: (_, { moduleId }) => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.module(moduleId) });
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.modules });
    },
  });
}

/** Content Mutations */
export function useCreateContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContentPayload) => quizService.createContent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.contents() });
    },
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateContentPayload }) =>
      quizService.updateContent(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.content(id) });
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.contents() });
    },
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quizService.deleteContent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUIZ_KEYS.contents() });
    },
  });
}

export function useContentsWithQuizzes(
  moduleId: number,
  params?: { lang_id?: number; enabled?: boolean }
) {
  const enabled = params?.enabled ?? true;
  return useQuery({
    queryKey: ["quiz", "module", moduleId, "contents-with-quizzes", params?.lang_id],
    queryFn: () => quizService.getContentsWithQuizzes(moduleId, params?.lang_id),
    enabled: enabled && !!moduleId,
  });
}

export function useContentsWithProgress(
  moduleId: number,
  campaignId: number,
  params?: { lang_id?: number; enabled?: boolean }
) {
  const enabled = params?.enabled ?? true;
  return useQuery({
    queryKey: ["quiz", "module", moduleId, "contents-with-progress", campaignId, params?.lang_id],
    queryFn: () => quizService.getContentsWithProgress(moduleId, campaignId, params?.lang_id),
    enabled: enabled && !!moduleId && !!campaignId,
  });
}

export function useModuleReport(moduleId: number, enabled = true) {
  return useQuery({
    queryKey: ["quiz", "module", moduleId, "report"],
    queryFn: () => quizService.getModuleReport(moduleId),
    enabled: enabled && !!moduleId,
  });
}

export function useContentsReport(reportModuleId: number, enabled = true) {
  return useQuery({
    queryKey: ["quiz", "contents-report", reportModuleId],
    queryFn: () => quizService.getContentsReport(reportModuleId),
    enabled: enabled && !!reportModuleId,
  });
}
