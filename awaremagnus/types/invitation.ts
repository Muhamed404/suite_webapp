export interface InvitationStatus {
  id: number;
  name: string;
}

export interface InvitationCampaignRef {
  id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface InvitationSurveyRef {
  id: number;
  name: string;
}

export interface InvitationInvitee {
  id: number;
  user_id: number;
  email: string;
  firstname: string;
  lastname: string;
}

export interface InvitationLogItem {
  id: number;
  invitee_id: number;
  campaign_id?: number | null;
  survey_id?: number | null;
  user_id: number;
  status_id: number;
  invitation_type: "campaign" | "survey" | string;
  attempt_count: number;
  last_attempt_at?: string | null;
  next_retry_at?: string | null;
  last_error?: string | null;
  is_reminder: boolean;
  invitation_time?: string | null;
  createdAt?: string;
  updatedAt?: string;
  campaign?: InvitationCampaignRef;
  survey?: InvitationSurveyRef;
  invitee?: InvitationInvitee;
  status?: InvitationStatus;
}

export interface InvitationListResponse {
  rows: InvitationLogItem[];
  count: number;
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface ReminderQueueResponse {
  campaign_id?: number;
  survey_id?: number;
  user_id?: number;
  reminders_enqueued: number;
}

export interface InvitationListParams {
  page?: number;
  limit?: number;
  campaign_id?: number;
  user_id?: number;
  status_id?: number;
  invitation_type?: "campaign" | "survey";
  is_reminder?: boolean;
}
