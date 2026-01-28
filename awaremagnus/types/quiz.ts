/** API types for Quiz module - aligned with AWM backend */

export interface QuizType {
  id: number;
  name?: string;
}

export interface ModuleTranslation {
  id: number;
  language_id: number;
  name: string;
  description?: string;
}

export interface Module {
  id: number;
  category_id: number;
  code: string;
  difficulty: number;
  status: number;
  org_id: number;
  creation_date?: string;
  category?: { id: number; name: string };
  translations?: ModuleTranslation[];
}

export interface ContentTranslation {
  id: number;
  language_id: number;
  title: string;
  content?: string;
  summary?: string;
}

export interface ModuleContent {
  id: number;
  mod_id: number;
  content_type_id: number;
  order: number;
  duration?: number;
  status: number;
  org_id: number;
  logo_path?: string;
  source_path?: string;
  translations?: ContentTranslation[];
}

export interface QuizAnswer {
  id?: number;
  quiz_id?: number;
  answer_text: string;
  is_correct: boolean;
  order: number;
}

export interface Quiz {
  id: number;
  mod_content_id: number;
  quiz_type_id: number;
  question: string;
  explanation?: string;
  difficulty?: number;
  time_limit?: number;
  status: number;
  org_id: number;
  answers?: QuizAnswer[];
}

export interface CreateQuizPayload {
  quiz: {
    mod_content_id: number;
    quiz_type_id: number;
    question: string;
    explanation?: string;
    difficulty?: number;
    time_limit?: number;
    org_id?: number;
  };
  answers: Array<{
    answer_text: string;
    is_correct: boolean;
    order: number;
  }>;
}

export interface UpdateQuizPayload {
  quiz_type_id?: number;
  question?: string;
  explanation?: string;
  difficulty?: number;
  time_limit?: number;
}

export interface CreateModulePayload {
  module: {
    category_id: number;
    code: string;
    difficulty: number;
    org_id?: number;
  };
  translations: Array<{
    language_id: number;
    name: string;
    description?: string;
  }>;
}

export interface UpdateModulePayload {
  category_id?: number;
  code?: string;
  difficulty?: number;
}

export interface AddModuleTranslationPayload {
  language_id: number;
  name: string;
  description?: string;
}

export interface CreateContentPayload {
  mod_id: number;
  content_type_id: number;
  order: number;
  duration?: number;
  org_id?: number;
  logo?: File;
  source?: File;
  source_url?: string;
  translations: Array<{
    language_id: number;
    title: string;
    content?: string;
    summary?: string;
  }>;
}

export interface UpdateContentPayload {
  content_type_id?: number;
  order?: number;
  duration?: number;
  logo?: File;
  source?: File;
  source_url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  statusCode?: number;
}
