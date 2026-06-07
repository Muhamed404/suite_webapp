"use client";

import {
  registerAuthTokenGetter,
  registerOnUnauthorizedHandler,
  clearAuthTokenCookie,
} from "./httpClient";

import { useAuthStore } from "@/hooks/useAuthStore";

/**
 * Registers the auth token getter with the HTTP client so every request
 * (jnrClient/suiteClient) gets the Bearer token from the store (or cookie fallback).
 * Hash token is processed in TokenFromHashHandler after rehydration so persist
 * does not overwrite it. Must run once on client - import from LayoutWrapper.
 */
function runAuthBootstrap() {
  if (typeof window === "undefined") return;

  registerAuthTokenGetter(() => useAuthStore.getState().token);
  registerOnUnauthorizedHandler(() => {
    clearAuthTokenCookie();
    useAuthStore.getState().reset();
  });
}

runAuthBootstrap();
