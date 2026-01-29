export interface SystemDashboardOverview {
  success: boolean;
  message: string;
  data: {
    total_organizations: number;
    total_campaigns: number;
    total_employees_modules_enrolled: number;
    total_completed_employees_modules: number;
    quizzes_accuracy_percent: number;
    weekly_progress_percent: number;
    global_org_progress_percent: number;
    global_xp_total_tokens: number;
    total_compliance_score: number;
    total_compliance_percent: number;
    maximum_compliance_score: number;
    compliance_score_grade: string;
    total_achievements_completed: number;
    system_risk_level: string;
    system_risk_level_id: number;
    system_risk_percentage: number;
    total_low_risk_employees: number;
    total_medium_risk_employees: number;
    total_high_risk_employees: number;
    total_certified_employees: number;
    total_uncertified_employees: number;
    total_active_learner: number;
    training_completion_rate: number;
    top_struggling_modules: Array<{
      module_id: number;
      module_name: string;
      average_quiz_score: number;
      failure_rate: number;
      total_attempts: number;
      total_failed_attempts: number;
      total_users_attempted: number;
    }>;
  };
}

export interface MonthlyCompletionData {
  month: string;
  month_name: string;
  users_completed: number;
  modules_completed: number;
}

export interface SystemMonthlyCompletion {
  success: boolean;
  message: string;
  data: {
    org_id: number;
    campaign_id: number | null;
    monthly_data: MonthlyCompletionData[];
  };
}

export interface StrugglingModule {
  module_id: number;
  module_name: string;
  average_quiz_score: number;
  failure_rate: number;
  total_attempts: number;
  total_failed_attempts: number;
  total_users_attempted: number;
}

export interface SystemStrugglingModules {
  success: boolean;
  message: string;
  data: {
    struggling_modules: StrugglingModule[];
    total_count: number;
  };
}

export interface OrganizationLeadership {
  org_id: number;
  modules_completed: number;
  achievement_count: number;
  avatar_highest_level: number;
  risk_level: string;
  compliance_score: number;
  total_xp_tokens: number;
  global_progress: number;
}

export interface SystemLeaderboard {
  success: boolean;
  message: string;
  data: {
    top_low_risk_organizations: OrganizationLeadership[];
    top_high_risk_organizations: OrganizationLeadership[];
  };
}

export interface OrganizationDashboardMetrics {
    id: number;
    org_id: number;
    total_campaigns: number;
    total_employees_modules_enrolled: number;
    total_completed_employees_modules: number;
    quizzes_accuracy_percent: number;
    weekly_progress_percent: number;
    global_org_progress_percent: number;
    global_xp_total_tokens: number;
    total_compliance_score: number;
    total_compliance_percent: number;
    maximum_compliance_score: number;
    compliance_score_grade: string;
    total_achievements_completed: number;
    organization_risk_level: string;
    total_low_risk_employees: number;
    total_medium_risk_employees: number;
    total_high_risk_employees: number;
    total_certified_employees: number;
    total_uncertified_employees: number;
    total_active_learner: number;
    training_completion_rate: number;
    top_struggling_modules: StrugglingModule[];
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationDashboardsResponse {
  success: boolean;
  message: string;
  data: {
    dashboardOrganizations: OrganizationDashboardMetrics[];
    count: number;
  };
}

export interface OrganizationMonthlyCompletion {
  success: boolean;
  message: string;
  data: {
    org_id: number;
    campaign_id: number | null;
    monthly_data: MonthlyCompletionData[];
  };
}

export interface OrganizationStrugglingModulesResponse {
    success: boolean;
    message: string;
    data: {
        org_id: number;
        struggling_modules: StrugglingModule[];
        total_count: number;
    }
}

export interface EmployeeLeaderboard {
    user_id: number;
    modules_completed: number;
    achievement_count: number;
    avatar_current_level: number;
    risk_level: string;
    compliance_score: number;
    total_xp_tokens: number;
    global_progress: number;
}

export interface OrganizationLeaderboardResponse {
    success: boolean;
    message: string;
    data: {
        top_low_risk_employees: EmployeeLeaderboard[];
        top_high_risk_employees: EmployeeLeaderboard[];
    }
}

export interface UserDashboardMetrics {
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
    global_progress_percent: number;
    level_number: number;
    xp_total_tokens: number;
    total_compliance_score: number;
    total_compliance_percent: number;
    total_achievements_completed: number;
    user_risk_level: string;
    quizzes_accuracy_percent: number;
    weekly_progress_percent: number;
    learning_velocity: number;
    best_module_attempted: string;
    streak_day: number;
    total_study_time: number;
    createdAt: string;
    updatedAt: string;
}

export interface UserDashboardsResponse {
    success: boolean;
    message: string;
    data: {
        dashboardUsers: UserDashboardMetrics[];
        count: number;
    }
}

export interface AchievementStat {
    achievement_id: number;
    achievement_name: string;
    achievement_description: string;
    achievement_category: string;
    image_small_url: string;
    employee_count: number;
}

export interface AchievementStatisticsResponse {
    success: boolean;
    message: string;
    data: {
        total_achievements: number;
        total_unique_achievements_unlocked: number;
        total_unique_achievements_locked: number;
        achievement_statistics: AchievementStat[];
    }
}

export interface Achievement {
    id: number;
    name: string;
    formula: string;
    description: string;
    image_small_url: string;
    image_big_url: string;
    createdAt: string;
    updatedAt: string;
}

export interface AchievementsResponse {
    success: boolean;
    message: string;
    data: {
        achievements: Achievement[];
        count: number;
    }
}

export interface AvatarStat {
    level_number: number;
    level_name: string;
    min_score_or_percentage: number;
    max_score_or_percentage: number;
    image_small_url: string;
    employee_count: number;
}

export interface AvatarStatisticsResponse {
    success: boolean;
    message: string;
    data: {
        total_avatars: number;
        total_unique_avatars_unlocked: number;
        total_unique_avatars_locked: number;
        avatar_statistics: AvatarStat[];
    }
}

export interface ScoreType {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScoreTypesResponse {
    success: boolean;
    message: string;
    data: {
        scoreTypes: ScoreType[];
        count: number;
    }
}

export interface ScoreLevel {
    id: number;
    score_type_id: number;
    level_number: number;
    level_name: string;
    min_score_or_percentage: number;
    max_score_or_percentage: number;
    image_small_url: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScoreLevelsResponse {
    success: boolean;
    message: string;
    data: {
        scoreLevels: ScoreLevel[];
        count: number;
    }
}
