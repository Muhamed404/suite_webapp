"use client";

import { usePathname } from "next/navigation";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/login");
  const isDashboardPage = pathname?.startsWith("/dashboard");

  // Dashboard pages handle their own layout
  if (isDashboardPage || isLoginPage) {
    return <>{children}</>;
  }

  // Default layout for other pages
  return <>{children}</>;
};
