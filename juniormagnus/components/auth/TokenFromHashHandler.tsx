"use client";

import { useEffect, useRef } from "react";

import { useAuthStore, useAuthRehydratedStore } from "@/hooks/useAuthStore";
import { authService } from "@/services/authService";
import { setAuthTokenCookie } from "@/services/httpClient";

const HASH_TOKEN_KEY = "token";

/**
 * Reads token from URL hash (e.g. from suite redirect: /dashboard#token=...)
 * after the auth store has rehydrated, so persist does not overwrite it.
 * Stores in auth state + cookie and removes the hash from the URL.
 */
export function TokenFromHashHandler() {
  const hasRehydrated = useAuthRehydratedStore((s) => s.hasRehydrated);
  const { setUser, setToken } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (!hasRehydrated || typeof window === "undefined" || handled.current) return;
    const hash = window.location.hash?.replace(/^#/, "").trim() || "";
    const prefix = HASH_TOKEN_KEY + "=";
    const token = hash.startsWith(prefix) ? hash.slice(prefix.length) : null;

    if (!token) return;

    handled.current = true;
    const auth = authService.parseTokenForAuth(token);

    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
      setAuthTokenCookie(auth.token);
    }
    const cleanUrl = window.location.pathname + (window.location.search || "");

    window.history.replaceState(null, "", cleanUrl);
  }, [hasRehydrated, setUser, setToken]);

  return null;
}
