"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuthStore, useAuthRehydratedStore } from "@/hooks/useAuthStore";
import { authService } from "@/services/authService";
import { setAuthTokenCookie } from "@/services/httpClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login", "/health"];
const HASH_TOKEN_KEY = "token";

/** If URL has #token=..., parse it and set auth store + cookie. Returns true if token was set. */
function tryRestoreAuthFromHash(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash?.replace(/^#/, "").trim() || "";
  const prefix = HASH_TOKEN_KEY + "=";

  if (!hash.startsWith(prefix)) return false;
  const token = hash.slice(prefix.length);
  const auth = authService.parseTokenForAuth(token);

  if (!auth) return false;
  useAuthStore.getState().setUser(auth.user);
  useAuthStore.getState().setToken(auth.token);
  setAuthTokenCookie(auth.token);
  const cleanUrl = window.location.pathname + (window.location.search || "");

  window.history.replaceState(null, "", cleanUrl);

  return true;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasRehydrated = useAuthRehydratedStore((s) => s.hasRehydrated);
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!hasRehydrated) return;

    const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

    if (!isPublic && !isLoading && !isAuthenticated) {
      if (tryRestoreAuthFromHash()) return;
      const timeoutId = setTimeout(() => {
        if (!useAuthStore.getState().token) router.replace("/login");
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, isAuthenticated, isLoading, hasRehydrated, router]);

  const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublic) {
    return <>{children}</>;
  }

  if (!hasRehydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
