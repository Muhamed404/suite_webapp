/** Report Card Type Definitions */

export interface ReportCardModuleResult {
  module_id: number;
  module_name: string;
  status: string;
  maximum_xp_tokens: number;
  achieved_xp_tokens: number;
  maximum_compliance_score: number;
  achieved_compliance_score: number;
  total_attempted_quizzes: number;
  total_correct_answers: number;
  achievements_unlocked_in_module: number;
  certificate_issued: string;
  module_completion_date: string | null;
  quiz_percentage?: number;
  /** Optional: duration in minutes (frontend-derived or extended field) */
  duration_minutes?: number;
}

export interface ReportCardCampaignResult {
  campaign_name: string;
  completed_modules: ReportCardModuleResult[];
}

export interface ReportCardMetaStatistics {
  quizzes_accuracy_percent: number;
  xp_total_tokens: number;
  total_study_time: number;
  total_modules_completed: number;
  total_completed_certificates: number;
  user_avatar_level: number;
  user_risk_level: string | null;
  global_progress_percentage: number;
  leaderboard_rank: number | null;
}

export interface ReportCardResult {
  meta_statistics: ReportCardMetaStatistics;
  campaigns: ReportCardCampaignResult[];
}
