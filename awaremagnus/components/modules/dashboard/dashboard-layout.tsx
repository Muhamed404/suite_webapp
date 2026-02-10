"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { DashboardSidebar } from "./dashboard-sidebar";

import { SidebarPrimaryMenu } from "@/components/ui/sidebar-primary-menu";
import { useI18n } from "@/i18n/I18nProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { dir } = useI18n();
  const pathname = usePathname();
  const isRtl = dir === "rtl";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Primary (suite) sidebar collapsed = icon-only. When true, sub (AWM) sidebar is expanded (PhishMagnus behavior). */
  const [primaryCollapsed, setPrimaryCollapsed] = useState(true);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleBackdropClick = () => setSidebarOpen(false);

  return (
    <div
      className={clsx(
        "relative flex h-screen bg-black overflow-hidden",
        isRtl && "flex-row-reverse"
      )}
    >
      {/* Sidebar Backdrop for mobile - visible when sidebar open */}
      <button
        aria-label="Close menu"
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        type="button"
        onClick={handleBackdropClick}
      />

      {/* Primary sidebar (suite links) - no radius, matches HTML modules page */}
      <SidebarPrimaryMenu
        isCollapsed={primaryCollapsed}
        onToggle={() => setPrimaryCollapsed((v) => !v)}
      />

      {/* Secondary sidebar (AWM) - curved left, mt-2 h-[98vh] */}
      <DashboardSidebar
        isCollapsed={!primaryCollapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content – curved right, margin, no header (matches HTML layout) */}
      <div
        className={clsx(
          "flex-1 flex flex-col h-[98vh] max-sm:h-full min-h-0 bg-[#F1F5F8] overflow-hidden",
          "lg:m-2 lg:ml-0 lg:rounded-r-3xl",
          isRtl && "lg:rounded-r-none lg:rounded-l-3xl"
        )}
      >
        {/* Mobile-only: hamburger to open sidebar (no full header) */}
        <div className="flex lg:hidden items-center gap-3 px-4 py-3 bg-white border-b border-[var(--strokeGray)] shrink-0">
          <button
            aria-label="Menu"
            className="p-2 rounded-lg hover:bg-[var(--gray)]"
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};
