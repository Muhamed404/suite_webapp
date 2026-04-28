import type {
  InvitationListParams,
  InvitationListResponse,
  ReminderQueueResponse,
} from "@/types/invitation";
import type { AWMResponseBody } from "./awmResponse";

import { normalizeAWMResponse } from "./awmResponse";
import { awmClient, API_BASE } from "./httpClient";

async function awmGet<T>(path: string): Promise<T> {
  const { data } = await awmClient.get<AWMResponseBody>(path);
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success || normalized.data == null) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data;
}

async function awmPost<T>(path: string): Promise<T> {
  const { data } = await awmClient.post<AWMResponseBody>(path, {});
  const normalized = normalizeAWMResponse<T>(data);

  if (!normalized.success || normalized.data == null) {
    throw new Error(normalized.message ?? "Request failed");
  }

  return normalized.data;
}

function toQuery(params?: InvitationListParams): string {
  if (!params) return "";

  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: String(value),
        }),
        {} as Record<string, string>
      )
  );

  return queryParams.toString() ? `?${queryParams.toString()}` : "";
}

export const invitationService = {
  getInvitations: (params?: InvitationListParams) =>
    awmGet<InvitationListResponse>(`${API_BASE}/invitations${toQuery(params)}`),

  getCampaignInvitations: (campaignId: number, params?: { page?: number; limit?: number }) =>
    awmGet<InvitationListResponse>(
      `${API_BASE}/invitations/campaign/${campaignId}${toQuery(params)}`
    ),

  getSurveyInvitations: (surveyId: number, params?: { page?: number; limit?: number }) =>
    awmGet<InvitationListResponse>(`${API_BASE}/invitations/survey/${surveyId}${toQuery(params)}`),

  sendCampaignReminders: (campaignId: number) =>
    awmPost<ReminderQueueResponse>(`${API_BASE}/invitations/campaign/${campaignId}/reminder/send`),

  sendCampaignUserReminder: (campaignId: number, userId: number) =>
    awmPost<ReminderQueueResponse>(
      `${API_BASE}/invitations/campaign/${campaignId}/user/${userId}/reminder/send`
    ),

  sendSurveyReminders: (surveyId: number) =>
    awmPost<ReminderQueueResponse>(`${API_BASE}/invitations/survey/${surveyId}/reminder/send`),

  sendSurveyUserReminder: (surveyId: number, userId: number) =>
    awmPost<ReminderQueueResponse>(
      `${API_BASE}/invitations/survey/${surveyId}/user/${userId}/reminder/send`
    ),
};
