import type { InvitationListParams, InvitationListResponse, ReminderQueueResponse } from "@/types/invitation";
import type { JnrResponseBody } from "./jnrResponse";
import { normalizeJnrResponse } from "./jnrResponse";
import { jnrClient, API_BASE } from "./httpClient";

async function jnrGet<T>(path: string): Promise<T> {
  const { data } = await jnrClient.get<JnrResponseBody>(path);
  const normalized = normalizeJnrResponse<T>(data);
  if (!normalized.success || normalized.data == null) {
    throw new Error(normalized.message ?? "Request failed");
  }
  return normalized.data;
}

async function jnrPost<T>(path: string): Promise<T> {
  const { data } = await jnrClient.post<JnrResponseBody>(path, {});
  const normalized = normalizeJnrResponse<T>(data);
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
      .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {} as Record<string, string>)
  );
  return queryParams.toString() ? `?${queryParams.toString()}` : "";
}

export const invitationService = {
  getInvitations: (params?: InvitationListParams) =>
    jnrGet<InvitationListResponse>(`${API_BASE}/invitations${toQuery(params)}`),

  getBatchInvitations: (batchId: number, params?: { page?: number; limit?: number }) =>
    jnrGet<InvitationListResponse>(`${API_BASE}/invitations/batch/${batchId}${toQuery(params)}`),

  sendBatchReminders: (batchId: number) =>
    jnrPost<ReminderQueueResponse>(`${API_BASE}/invitations/batch/${batchId}/reminder/send`),

  sendBatchUserReminder: (batchId: number, userId: number) =>
    jnrPost<ReminderQueueResponse>(`${API_BASE}/invitations/batch/${batchId}/user/${userId}/reminder/send`),
};
