"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateModuleForm } from "@/components/modules/module/create-module-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";

export default function TrainingLibrarySystemCreateModulePage() {
  const t = useTranslations("module");
  const tDashboard = useTranslations("dashboard");

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 w-full">
          <nav
            className="flex items-center gap-1.5 text-sm text-[var(--darkgray)] mb-4"
            aria-label="Breadcrumb"
          >
            <Link
              className="hover:text-[var(--mainblue)] transition-colors"
              href="/dashboard/training-library/system"
            >
              {tDashboard("menu.trainingLibrary")}
            </Link>
            <span aria-hidden>›</span>
            <Link
              className="hover:text-[var(--mainblue)] transition-colors"
              href="/dashboard/training-library/system"
            >
              {tDashboard("menu.systemLibrary")}
            </Link>
            <span aria-hidden>›</span>
            <span className="font-medium text-[var(--mainblue)]">
              {t("breadcrumbCurrent")}
            </span>
          </nav>
          <CreateModuleForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
