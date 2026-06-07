/**
 * JNR API returns: { message, statusCode, alertType, object }.
 */

export interface JnrResponseBody<T = unknown> {
  message?: string;
  statusCode?: number;
  alertType?: string;
  object?: T;
}

function isSuccessStatus(statusCode: number | undefined): boolean {
  return statusCode != null && statusCode >= 200 && statusCode < 300;
}

export interface NormalizedJnrResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  count?: number;
}

export function normalizeJnrResponse<T>(raw: JnrResponseBody<unknown>): NormalizedJnrResponse<T> {
  const success = isSuccessStatus(raw.statusCode);
  const message = raw.message;
  const rawPayload =
    (raw as Record<string, unknown>).object ?? (raw as Record<string, unknown>).data;
  const obj = rawPayload as Record<string, unknown> | T | undefined;

  if (obj == null) {
    return { success, data: undefined, message, statusCode: raw.statusCode };
  }

  if (typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const count = typeof o.count === "number" ? o.count : undefined;
    if (Array.isArray(o.rows)) {
      return { success, data: o as T, message, statusCode: raw.statusCode, count };
    }
    if (typeof o.id === "number" || typeof o.org_id === "number") {
      return { success, data: obj as T, message, statusCode: raw.statusCode };
    }
    if (Array.isArray(o.data)) {
      return { success, data: o.data as T, message, statusCode: raw.statusCode, count };
    }
  }

  return { success, data: obj as T, message, statusCode: raw.statusCode };
}

/** Backward-compatible aliases for legacy imports */
export type jnrResponseBody<T = unknown> = JnrResponseBody<T>;
export const normalizejnrResponse = normalizeJnrResponse;
