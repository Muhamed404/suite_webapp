/**
 * AWM API returns: { message, statusCode, alertType, object }.
 * We normalize to { success, data, message } for consistent consumption.
 */

export interface AWMResponseBody<T = unknown> {
  message?: string;
  statusCode?: number;
  alertType?: string;
  object?: T;
}

/** Success = 2xx */
function isSuccessStatus(statusCode: number | undefined): boolean {
  return statusCode != null && statusCode >= 200 && statusCode < 300;
}

export interface NormalizedAWMResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  count?: number;
}

/**
 * Normalize AWM response to { success, data, message, count? }.
 * Handles object being a wrapper ({ modules }, { contents }, { certificates }, etc.) or direct data.
 * Preserves count for paginated/list responses per API docs.
 */
export function normalizeAWMResponse<T>(raw: AWMResponseBody<unknown>): NormalizedAWMResponse<T> {
  const success = isSuccessStatus(raw.statusCode);
  const message = raw.message;

  const obj = raw.object as Record<string, unknown> | T | undefined;
  if (obj == null) {
    return { success, data: undefined, message, statusCode: raw.statusCode };
  }

  // Wrapped list responses (API docs). Also handle backend sending { object: [...] }.
  if (typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    const count = typeof o.count === "number" ? o.count : undefined;
    if (Array.isArray(o.modules)) {
      return { success, data: o.modules as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.contents)) {
      return { success, data: o.contents as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.quizzes)) {
      return { success, data: o.quizzes as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.dashboardUsers)) {
      return { success, data: o.dashboardUsers as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.certificates)) {
      return { success, data: o.certificates as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.items)) {
      return { success, data: o.items as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.quizTypes)) {
      return { success, data: o.quizTypes as T, message, statusCode: raw.statusCode, count };
    }
    if (Array.isArray(o.object)) {
      return { success, data: o.object as T, message, statusCode: raw.statusCode, count };
    }
  }

  // Direct entity or array
  return {
    success,
    data: obj as T,
    message,
    statusCode: raw.statusCode,
  };
}
