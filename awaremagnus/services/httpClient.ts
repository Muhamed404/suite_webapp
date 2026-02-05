import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";

const SERVICE_AWM_URL =
  process.env.NEXT_PUBLIC_SERVICE_AWM_URL ??
  "https://bd7416c47afa.ngrok-free.app";

/** API path prefix per AWM docs: {BASE_URL}/api. Set NEXT_PUBLIC_AWM_API_BASE=/api/awm if your backend is mounted there. */
export const API_BASE =
  process.env.NEXT_PUBLIC_AWM_API_BASE ?? "/api/awm";

const SERVICE_SUITE_URL =
  process.env.NEXT_PUBLIC_SERVICE_SUITE_URL ??
  "https://f64975b41a9a.ngrok-free.app";

/**
 * Optional test token sent to all API requests when set.
 * Set NEXT_PUBLIC_AWM_TEST_TOKEN in .env.local for local testing (do not commit secrets).
 */
const TEST_TOKEN =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_AWM_TEST_TOKEN ?? null)
    : null;

// Simple in-memory auth token accessor so interceptors don't import Zustand directly
let authTokenGetter: (() => string | null) | null = null;
let onUnauthorizedHandler: (() => void) | null = null;

export const registerAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
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
        TEST_TOKEN ?? (authTokenGetter ? authTokenGetter() : null);

      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      return config;
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        if (onUnauthorizedHandler) {
          onUnauthorizedHandler();
        }
      }

      return Promise.reject(error);
    },
  );
};

export const awmClient = axios.create({
  baseURL: SERVICE_AWM_URL,
  withCredentials: true,
});

export const suiteClient = axios.create({
  baseURL: SERVICE_SUITE_URL,
  withCredentials: true,
});

setupInterceptors(awmClient);
setupInterceptors(suiteClient);

// Backward compatibility (default to suite for now or just export both)
export const httpClient = suiteClient;
