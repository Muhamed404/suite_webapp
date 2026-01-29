import axios, {
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";

const SERVICE_AWM_URL =
  process.env.NEXT_PUBLIC_SERVICE_AWM_URL ??
  "https://8efe0376c6f0.ngrok-free.app";

const SERVICE_SUITE_URL =
  process.env.NEXT_PUBLIC_SERVICE_SUITE_URL ??
  "https://c15bc17aed17.ngrok-free.app";

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
      if (authTokenGetter) {
        const token = authTokenGetter();
        if (token) {
          if (!config.headers) {
            config.headers = {} as any;
          }
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
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
