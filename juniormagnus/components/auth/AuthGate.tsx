"use client";

import { useEffect, useState } from "react";

import { useAuthStore, useAuthRehydratedStore } from "@/hooks/useAuthStore";
import { authService } from "@/services/authService";
import { setAuthTokenCookie } from "@/services/httpClient";

const HASH_TOKEN_KEY = "token";

/**
 * Processes URL hash (#token=...) after rehydration so the token is in the store
 * and cookie before any child component mounts and fires API requests.
 * Renders children only after this, so the /dashboard/users (and all) requests
 * always have the Bearer token.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasRehydrated = useAuthRehydratedStore((s) => s.hasRehydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasRehydrated) return;

    if (typeof window !== "undefined") {
      const hash = window.location.hash?.replace(/^#/, "").trim() || "";
      const prefix = HASH_TOKEN_KEY + "=";

      if (hash.startsWith(prefix)) {
        const token = hash.slice(prefix.length);
        const auth = authService.parseTokenForAuth(token);

        if (auth) {
          useAuthStore.getState().setUser(auth.user);
          useAuthStore.getState().setToken(auth.token);
          setAuthTokenCookie(auth.token);
        }
        const cleanUrl = window.location.pathname + (window.location.search || "");

        window.history.replaceState(null, "", cleanUrl);
      }
    }

    setReady(true);
  }, [hasRehydrated]);

  if (!hasRehydrated || !ready) {
    return null;
  }

  return <>{children}</>;
}
