import type { JnrResponseBody } from "./jnrResponse";
import { normalizeJnrResponse } from "./jnrResponse";
import { jnrClient, API_BASE } from "./httpClient";

export interface CreateFamilyBatchPayload {
  name: string;
  group_ids: number[];
  department_ids: number[];
  notes?: string;
}

export async function createFamilyBatch(payload: CreateFamilyBatchPayload) {
  const { data } = await jnrClient.post<JnrResponseBody>(`${API_BASE}/families/batches`, payload);
  const n = normalizeJnrResponse(data);
  if (!n.success) throw new Error(n.message ?? "Failed to create batch");
  return n.data;
}

export async function listFamilyBatches(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const { data } = await jnrClient.get<JnrResponseBody>(`${API_BASE}/families/batches${suffix}`);
  const n = normalizeJnrResponse(data);
  if (!n.success) throw new Error(n.message ?? "Failed to list batches");
  return n.data;
}

export async function sendBatchInvitations(batchId: number) {
  const { data } = await jnrClient.post<JnrResponseBody>(
    `${API_BASE}/families/batches/${batchId}/send-invitations`,
    {}
  );
  const n = normalizeJnrResponse(data);
  if (!n.success) throw new Error(n.message ?? "Failed to queue invitations");
  return n.data;
}

export const familyBatchService = {
  createBatch: createFamilyBatch,
  listBatches: listFamilyBatches,
  sendInvitations: sendBatchInvitations,
};
