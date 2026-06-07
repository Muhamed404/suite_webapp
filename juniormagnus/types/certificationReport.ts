/** Certification Report / Awareness Report Type Definitions */

export interface DashboardUserData {
  id: number;
  org_id: number;
  user_id: number;
  total_campaigns: number;
  total_modules_enrolled: number;
  total_completed_modules: number;
  total_certificates_available: number;
  total_completed_certificates: number;
  total_quizzes_enrolled: number;
  total_quizzes_passed: number;
  total_mvideos_enrolled: number;
  total_mvideos_watched: number;
  global_progress_percent: string | number;
  level_number: number;
  xp_total_tokens: string | number;
  total_compliance_score: string | number;
  total_compliance_percent: string | number;
  total_achievements_completed: number;
  user_risk_level: string | null;
  quizzes_accuracy_percent: string | number;
  weekly_progress_percent: string | number;
  learning_velocity: string | number;
  best_module_attempted: string | null;
  streak_day: number;
  total_study_time: number;
  createdAt: string;
  updatedAt: string;
}

export interface AwarenessReportUser {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  department_id: number | null;
  group_id: number | null;
  dashboard: DashboardUserData | null;
}

export interface AwarenessReportPagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface AwarenessReportResponse {
  users: AwarenessReportUser[];
  pagination: AwarenessReportPagination;
}

export interface AwarenessReportParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: "name" | "email" | "user_id";
  sort_order?: "asc" | "desc";
}
