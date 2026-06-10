/** Survey Type Definitions */

export interface SurveyStatus {
  id: number;
  name: string;
}

export interface SurveyCategory {
  id: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface SurveyGroup {
  id: number;
  group_id: number;
  group_name?: string;
  status_id: number;
}

export interface SurveyDepartment {
  id: number;
  department_id: number;
  department_name?: string;
  status_id: number;
}

export interface SurveyInvitation {
  id: number;
  user_id: number;
  group_id?: number;
  department_id?: number;
  firstname: string;
  lastname: string;
  email: string;
  invite_date: string;
}

export interface SurveyStats {
  id: number;
  total_invited: number;
  total_submitted: number;
  response_rate: number;
}

export interface Survey {
  id: number;
  org_id: number;
  lang_id: number;
  name: string;
  description?: string;
  ques_type_id?: number;
  status_id: number;
  deadline?: string;
  start_date?: string;
  creation_date?: string;
  survey_unique_code: string;
  max_questions?: number;
  status?: SurveyStatus;
  stats?: SurveyStats;
  selectedCategories?: SurveyCategory[];
  selectedGroups?: SurveyGroup[];
  selectedDepartments?: SurveyDepartment[];
  invitations?: SurveyInvitation[];
}

export interface SurveyMetaStatistics {
  total_surveys_sent: number;
  total_users_invited: number;
  total_users_submissions: number;
  total_users_ignored_submission: number;
  response_rate: number;
}

export interface SurveyListItem {
  survey_id: number;
  survey_name: string;
  total_invited: number;
  total_submitted: number;
  issue_date: string;
  deadline_date: string;
  progress_percentage: number;
  status: SurveyStatus;
}

export interface SurveyListResponse {
  meta_statistics: SurveyMetaStatistics;
  surveys: SurveyListItem[];
}

// Survey Statistics by ID
export interface SurveySummary {
  total_surveys_sent: number;
  total_surveys_submitted: number;
  total_unsubmitted: number;
}

export interface ResponseChart {
  total_correct_answers: number;
  total_incorrect_answers: number;
  total_not_submitted: number;
}

export interface DepartmentRisk {
  department_id: number;
  department_name?: string;
  number_of_risky_employees: number;
  total_employees: number;
}

export interface GroupRisk {
  group_id: number;
  group_name?: string;
  number_of_risky_employees: number;
  total_employees: number;
}

export interface SubmissionTimeline {
  date: string;
  total_submitted: number;
}

export interface OverallRiskLevel {
  total_overall_risky_employees: number;
  total_overall_nonrisky_employees: number;
  total_overall_non_submitted_employees: number;
}

export interface SurveyStatistics {
  survey_id: number;
  survey_name: string;
  survey_summary: SurveySummary;
  response_chart: ResponseChart;
  department_risk: DepartmentRisk[];
  group_risk: GroupRisk[];
  submission_timeline: SubmissionTimeline[];
  overall_risk_level: OverallRiskLevel;
}

// Survey Users
export interface SurveyUser {
  invite_id: number;
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  group_id?: number;
  group_name?: string;
  department_id?: number;
  department_name?: string;
  invite_date: string;
  submission_date?: string | null;
  correct_answers?: number | null;
  incorrect_answers?: number | null;
  skipped_answers?: number | null;
  risk_level_id?: number | null;
  risk_level_name?: string | null;
  is_risky: boolean;
}

export interface SurveyUserListResponse {
  survey: {
    id: number;
    name: string;
    status_id: number;
  };
  users: SurveyUser[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  filters: {
    departments: Array<{ id: number; name: string | null }>;
    groups: Array<{ id: number; name: string | null }>;
    risk_levels?: Array<{ id: number; name: string }>;
  };
}

// Survey User Answers
export interface SurveyUserAnswer {
  answer_id: number;
  question_id: number;
  question_description: string;
  question_type: string;
  selected_answer_id?: number;
  selected_answer_description?: string;
  correct_answer_id: number;
  correct_answer_description: string;
  is_correct: boolean;
  is_skipped: boolean;
  submission_date?: string;
}

export interface SurveyUserAnswersResponse {
  user: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    department_id?: number;
    department_name?: string;
    group_id?: number;
    group_name?: string;
  };
  survey: {
    id: number;
    name: string;
    status_id: number;
  };
  statistics: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    skipped_answers: number;
    accuracy_percentage: number;
    risk_level_id?: number;
    risk_level_name?: string;
    is_risky: boolean;
    submission_date?: string;
  };
  answers: SurveyUserAnswer[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

// Survey Create Payload
export interface SurveyCreatePayload {
  survey: {
    name: string;
    description?: string;
    lang_id: number;
    ques_type_id?: number;
    start_date?: string;
    deadline?: string;
    max_questions?: number;
  };
  category_ids: number[];
  groups?: number[];
  departments?: number[];
  invitees?: number[];
}

// Survey Question Types
export interface SurveyQuestionAnswer {
  id?: number;
  answer: string;
  validity: boolean;
}

export interface SurveyQuestion {
  id: number;
  ques_type_id: number;
  category_id?: number;
  org_id: number;
  question: string;
  createdAt?: string;
  updatedAt?: string;
  questType?: {
    id: number;
    name: string;
    description?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  answers: SurveyQuestionAnswer[];
}

export interface SurveyQuestionCreatePayload {
  question: {
    ques_type_id: number;
    category_id?: number;
    org_id?: number;
    question: string;
  };
  answers: Array<{
    answer: string;
    validity: boolean;
  }>;
}

export interface SurveyQuestionUpdatePayload {
  question?: {
    question?: string;
    category_id?: number;
    ques_type_id?: number;
  };
  answers?: Array<{
    answer: string;
    validity: boolean;
  }>;
}

// ─── Public Survey Types ─────────────────────────────────────

export interface PublicSurveyQuestion {
  question_id: number;
  question_text: string;
  question_type: string;
  answers: Array<{
    answer_id: number;
    answer_text: string;
  }>;
}

export interface PublicSurveyData {
  survey: {
    id: number;
    title: string;
    description?: string;
    status: "active" | "expired" | "closed" | "not_started";
    total_questions: number;
  };
  completion_status: "filled" | "not_filled";
  questions: PublicSurveyQuestion[];
}

export type PublicSurveyStatusValue =
  | "completed"
  | "active"
  | "expired"
  | "closed"
  | "not_started"
  | "invalid_link";

export interface PublicSurveyStatusResponse {
  status: PublicSurveyStatusValue;
}

export interface PublicSurveySubmissionAnswer {
  question_id: number;
  selected_answer_id?: number;
  selected_answer_ids?: number[];
}

export interface PublicSurveySubmissionPayload {
  survey_id: number;
  user_type: "public" | "org_user";
  answers: PublicSurveySubmissionAnswer[];
}

export interface PublicSurveySubmissionResponse {
  survey_id: number;
  invitation_id: number;
  user_type: string;
  user_identifier?: string;
  statistics: {
    correct_answers: number;
    incorrect_answers: number;
    skipped_answers: number;
    accuracy: number;
  };
}

// ─── Org User Pending Surveys ─────────────────────────────────

/** Pending survey item for an org user, derived from user invitations */
export interface PendingUserSurvey {
  survey_id: number;
  survey_name: string;
  invite_id: number;
  survey_unique_code: string;
  start_date?: string | null;
  deadline_date?: string | null;
  status: "active" | "expired" | "closed" | "not_started" | "completed";
}
