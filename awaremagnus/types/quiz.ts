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
  logo_banner_url?: string | null;
}

export interface Module {
  id: number;
  category_id: number;
  code: string;
  difficulty?: number;
  status?: number;
  status_id?: number;
  org_id: number;
  creation_date?: string;
  created_at?: string;
  updated_at?: string;
  is_global?: boolean;
  /** From API list/detail (single language or default) */
  title?: string;
  description?: string;
  category?: { id: number; name: string };
  translations?: ModuleTranslation[];
  assignments?: { campaign_id: number; status: number }[];
}

// types returned by the report endpoints
export interface ReportModule {
  id: number;
  report_campaign_id: number;
  module_id: number;
  status_id: number;
  progress_percentage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportContent {
  id: number;
  report_module_id: number;
  content_id: number;
  status_id: number;
  progress_percentage: string;
  reportModule?: ReportModule;
  content?: { id: number; name?: string };
  status?: { id: number; name: string };
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
  mod_id?: number;
  module_id?: number;
  content_type_id: number;
  content_type?: string;
  order: number;
  duration?: number;
  status?: number;
  org_id?: number;
  logo_path?: string;
  logo_url?: string;
  source_path?: string;
  source_url?: string;
  content_data?: string;
  /** Alias for content_data or source_url in some contexts */
  content_id?: number | string;
  description?: string;
  is_mandatory?: boolean;
  /** From API (single language or default) */
  title?: string;
  /** Language from API (e.g. { id, name }) */
  language?: { id: number; name?: string };
  language_id?: number;
  translations?: ContentTranslation[];
  /** Set from API creation_date / createdAt when normalizing list/detail */
  created_at?: string;
  created_date?: string;
  quizzes?: { total_count: number };
  user_completion_status?: string;
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
  mod_content_id?: number;
  content_id?: number;
  quiz_type_id: number;
  question: string;
  explanation?: string;
  difficulty?: number;
  time_limit?: number;
  status?: number;
  org_id?: number;
  is_mandatory?: boolean;
  order?: number;
  /** From API (e.g. { id, name }) for display */
  quizType?: { id: number; name?: string };
  answers?: QuizAnswer[];
}

export interface CreateQuizPayload {
  quiz: {
    con_id: number;
    qtype_id: number;
    question: string;
    description?: string; // Sometimes used as explanation
    difficulty?: number;
    org_id?: number;
  };
  answers: Array<{
    answer: string;
    validity: boolean;
    feedback?: string;
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
    /** Template name / display name of the module */
    name?: string;
    difficulty: number;
    org_id?: number;
    /** API: status_id (default 1) */
    status_id?: number;
    /** API: is_global (default false) */
    is_global?: boolean;
  };
  translations: Array<{
    language_id: number;
    name: string;
    description?: string;
    /** Optional logo banner image file for this translation (logo_banner_N) */
    logo_banner?: File;
  }>;
}

export interface UpdateModulePayload {
  category_id?: number;
  code?: string;
  difficulty?: number;
  status_id?: number;
  is_global?: boolean;
}

export interface AddModuleTranslationPayload {
  language_id: number;
  title: string;
  description?: string;
  /** Legacy: some backends use name */
  name?: string;
}

export interface CreateContentPayload {
  mod_id: number;
  /** Sent as contype_id in form */
  content_type_id: number;
  /** Primary language id; sent as lang_id in form */
  lang_id: number;
  /** Primary content name; sent as name in form */
  name: string;
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
