"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuthStore, useAuthRehydratedStore } from "@/hooks/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login", "/health"];

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasRehydrated = useAuthRehydratedStore((s) => s.hasRehydrated);
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!hasRehydrated) return;

    const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

    if (!isPublic && !isLoading && !isAuthenticated) {
      router.replace("/login");
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
