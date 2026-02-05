"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

import { useI18n } from "@/i18n/I18nProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { dir } = useI18n();
  const pathname = usePathname();
  const isRtl = dir === "rtl";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleBackdropClick = () => setSidebarOpen(false);

  return (
    <div
      className={clsx(
        "relative flex h-screen bg-[#F1F5F8] overflow-hidden",
        isRtl && "flex-row-reverse",
      )}
    >
      {/* Sidebar Backdrop for mobile - visible when sidebar open */}
      <button
        type="button"
        aria-label="Close menu"
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleBackdropClick}
      />

      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={clsx(
          "flex-1 flex flex-col min-h-0 bg-[#F1F5F8] m-1 sm:m-2 overflow-hidden",
          isRtl ? "rounded-l-2xl sm:rounded-l-3xl" : "rounded-r-2xl sm:rounded-r-3xl",
        )}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen((v) => !v)} />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
