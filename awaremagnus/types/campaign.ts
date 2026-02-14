/** Campaign Type Definitions */

export interface Campaign {
  id: number;
  org_id: number;
  status_id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  // Content type flags
  enable_gamification: boolean;
  enable_quiz: boolean;
  enable_certificate: boolean;
  enable_games: boolean;
  enable_misc_items: boolean;
  enable_motion_videos: boolean;
  enable_interactive_ispring: boolean;
  enable_documents: boolean;
  // Weight configuration
  interactive_content_weight: number;
  motion_video_weight: number;
  brochure_weight: number;
  poster_weight: number;
  screensaver_weight: number;
  game_weight: number;
  document_weight: number;
  misc_weight: number;
  vr_game_weight: number;
  quiz_progress_weight: number;
  // Quiz settings
  quiz_passing_threhold_percentage?: number;
  quiz_retry_threshold: number;
  total_number_of_quizzes_per_module?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignStatus {
  id: number;
  name: string;
}

export interface CampaignModule {
  id: number;
  campaign_id: number;
  module_id: number;
  module?: {
    id: number;
    code: string;
    name?: string;
    title?: string;
    category_id?: number;
    status?: number;
    org_id?: number;
  };
}

export interface CampaignTarget {
  id: number;
  campaign_id: number;
  group_id?: number;
  department_id?: number;
  user_id?: number;
  status_id: number;
}

export interface CampaignSchedule {
  id: number;
  campaign_id: number;
  module_id: number;
  start_date: string;
  status_id: number;
  module?: {
    id: number;
    code: string;
    name?: string;
  };
}

export interface CampaignStatistics {
  total_modules: number;
  total_enrolled_users: number;
  campaign_completion_percentage: number;
  total_completed_certifications: number;
}

export interface CampaignWithDetails extends Campaign {
  status?: CampaignStatus;
  modules: CampaignModule[];
  groups: CampaignTarget[];
  departments: CampaignTarget[];
  invitees: CampaignTarget[];
  moduleSchedules: CampaignSchedule[];
  statistics?: CampaignStatistics;
}

export interface CampaignMetaStatistics {
  total_campaigns: number;
  total_modules_all: number;
  total_enrolled_users_all: number;
  average_completion_percentage_all: number;
  total_completed_certifications_all: number;
}

export interface CampaignListResponse {
  message: string;
  statusCode: number;
  alertType: string;
  object: {
    meta_statistics: CampaignMetaStatistics;
    campaigns: CampaignWithDetails[];
    count: number;
  };
}

export interface CampaignCreatePayload {
  campaign: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status_id?: number;
    enable_gamification?: boolean;
    enable_quiz?: boolean;
    enable_certificate?: boolean;
    enable_games?: boolean;
    enable_misc_items?: boolean;
    enable_motion_videos?: boolean;
    enable_interactive_ispring?: boolean;
    enable_documents?: boolean;
    interactive_content_weight?: number;
    motion_video_weight?: number;
    brochure_weight?: number;
    poster_weight?: number;
    screensaver_weight?: number;
    game_weight?: number;
    document_weight?: number;
    misc_weight?: number;
    vr_game_weight?: number;
    quiz_progress_weight?: number;
    quiz_passing_threhold_percentage?: number;
    quiz_retry_threshold?: number;
    total_number_of_quizzes_per_module?: number;
    org_id?: number;
  };
  modules: number[];
  groups?: number[];
  departments?: number[];
  invitees?: number[];
  schedules?: Array<{
    module_id: number;
    start_date: string;
  }>;
}

export interface CampaignUpdatePayload {
  campaign?: {
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status_id?: number;
    enable_gamification?: boolean;
    enable_quiz?: boolean;
    enable_certificate?: boolean;
    enable_games?: boolean;
    enable_misc_items?: boolean;
    enable_motion_videos?: boolean;
    enable_interactive_ispring?: boolean;
    enable_documents?: boolean;
    interactive_content_weight?: number;
    motion_video_weight?: number;
    brochure_weight?: number;
    poster_weight?: number;
    screensaver_weight?: number;
    game_weight?: number;
    document_weight?: number;
    misc_weight?: number;
    vr_game_weight?: number;
    quiz_progress_weight?: number;
    quiz_passing_threhold_percentage?: number;
    quiz_retry_threshold?: number;
    total_number_of_quizzes_per_module?: number;
    org_id?: number;
  };
  modules?: number[];
  groups?: number[];
  departments?: number[];
  invitees?: number[];
  schedules?: Array<{
    module_id: number;
    start_date: string;
  }>;
}

export interface CampaignQueryParams {
  status_id?: number;
  start_date?: string;
  end_date?: string;
  org_id?: number;
}

export interface CampaignFormData {
  campaign: Partial<Campaign>;
  modules: number[];
  groups: number[];
  departments: number[];
  invitees: number[];
  schedules: Array<{
    module_id: number;
    start_date: string;
  }>;
}
