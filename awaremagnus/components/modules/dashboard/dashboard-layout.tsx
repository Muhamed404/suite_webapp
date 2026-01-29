"use client";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import clsx from "clsx";

import { useI18n } from "@/i18n/I18nProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  return (
    <div className={clsx("relative flex h-screen bg-black overflow-hidden", isRtl && "flex-row-reverse")}>
      {/* Sidebar Backdrop for mobile */}
      <div
        id="sidebar-backdrop"
        className="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
      />

      <DashboardSidebar />

      {/* Main Content */}
      <div
        className={clsx(
          "flex-1 flex flex-col h-[98vh] bg-[#F1F5F8] lg:m-2 overflow-hidden",
          isRtl ? "lg:mr-0 lg:rounded-l-3xl" : "lg:ml-0 lg:rounded-r-3xl"
        )}
      >
        <DashboardHeader />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

