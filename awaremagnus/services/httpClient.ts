import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";

const SERVICE_AWM_URL =
  process.env.SERVICE_AWM_URL || process.env.NEXT_PUBLIC_SERVICE_AWM_URL || "http://localhost:3002";

/** API path prefix per AWM docs: {BASE_URL}/api. Set NEXT_PUBLIC_AWM_API_BASE=/api/awm if your backend is mounted there. */
export const API_BASE =
  process.env.AWM_API_BASE || process.env.NEXT_PUBLIC_AWM_API_BASE || "/api/awm";

const SERVICE_SUITE_URL =
  process.env.SERVICE_SUITE_URL ||
  process.env.NEXT_PUBLIC_SERVICE_SUITE_URL ||
  "http://localhost:3000";

/**
 * Optional test token sent to all API requests when set.
 * Set NEXT_PUBLIC_AWM_TEST_TOKEN in .env.local for local testing (do not commit secrets).
 */
const TEST_TOKEN =
  typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_AWM_TEST_TOKEN ?? null) : null;

// Simple in-memory auth token accessor so interceptors don't import Zustand directly
let authTokenGetter: (() => string | null) | null = null;
let onUnauthorizedHandler: (() => void) | null = null;

/** Cookie name for AWM token (fallback when store not ready); also sent with requests if backend expects it. */
export const AWM_TOKEN_COOKIE = "awm_session";

/** Read token from cookie (document.cookie) if present. Only works in browser. */
function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + AWM_TOKEN_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );

  return match ? decodeURIComponent(match[1]) : null;
}

/** Set AWM token cookie so backend and getter fallback can use it. MaxAge 1 day. */
export function setAuthTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24;

  document.cookie = `${AWM_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Clear AWM token cookie on logout. */
export function clearAuthTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AWM_TOKEN_COOKIE}=; path=/; max-age=0`;
}

export const registerAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = () => getter() ?? getTokenFromCookie();
};

export const registerOnUnauthorizedHandler = (handler: () => void) => {
  onUnauthorizedHandler = handler;
};

const setupInterceptors = (instance: ReturnType<typeof axios.create>) => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      if (!config.headers) {
        config.headers = {} as any;
      }
      (config.headers as any)["ngrok-skip-browser-warning"] = "true";

      const token =
        TEST_TOKEN ??
        (authTokenGetter ? authTokenGetter() : null) ??
        (typeof document !== "undefined" ? getTokenFromCookie() : null);

      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      return config;
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error?.response?.status;

      // Only 401 = unauthenticated; 403 = forbidden (e.g. missing param) - do not clear auth
      if (status === 401 && onUnauthorizedHandler) {
        onUnauthorizedHandler();
      }

      return Promise.reject(error);
    }
  );
};

export const awmClient = axios.create({
  // When on client, we want usage like awmClient.get(API_BASE + "/...") to map to /awm/api/awm/...
  // Since API_BASE is /api/awm, we just need the basepath /awm as the baseURL.
  // But wait, if we set baseURL to "/awm", then get("/api/awm/...") becomes "/awm/api/awm/...". Correct.
  baseURL: typeof window === "undefined" ? SERVICE_AWM_URL : "/awm",
  withCredentials: true,
});

export const suiteClient = axios.create({
  // Suite calls are like post("/login"). We want them to go to /awm/api/suite/login.
  baseURL: typeof window === "undefined" ? SERVICE_SUITE_URL : "/awm/api/suite",
  withCredentials: true,
});

setupInterceptors(awmClient);
setupInterceptors(suiteClient);

// Backward compatibility (default to suite for now or just export both)
export const httpClient = suiteClient;
