/** Suite backend AWM endpoints: response shape is { data, status, message } */

export interface SuiteCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status?: boolean;
}

export interface SuiteContentType {
  id: number;
  name: string;
}

export interface SuiteModule {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  difficulty_level?: number;
  status?: boolean;
  creation_date?: string;
}

interface SuiteResponse<T> {
  data: T;
  status: number;
  message: string;
}

export type { SuiteResponse };
