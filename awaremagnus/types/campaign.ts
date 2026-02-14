/** Types for Campaign Assignments (Org User / end-user view) */

export interface CampaignAssignment {
  id: number;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  org_id?: number;
  total_modules?: number;
  completed_modules?: number;
  progress_percent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignModule {
  id: number;
  campaign_id: number;
  module_id: number;
  title?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: string;
  progress_percent?: number;
  total_contents?: number;
  completed_contents?: number;
  category?: { id: number; name: string };
  createdAt?: string;
}

export interface Certificate {
  id: number;
  user_id?: number;
  campaign_id?: number;
  module_id?: number;
  certificate_name?: string;
  name?: string;
  title?: string;
  description?: string;
  issued_date?: string;
  certificate_issue_date?: string;
  expiry_date?: string;
  certificate_url?: string;
  download_url?: string;
  status?: string;
  campaign_name?: string;
  module_name?: string;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
}
