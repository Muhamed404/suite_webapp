"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuthStore } from "@/hooks/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login", "/health"];

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

    if (!isPublic && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // could render a spinner here; for now keep it minimal
    return null;
  }

  return <>{children}</>;
};




