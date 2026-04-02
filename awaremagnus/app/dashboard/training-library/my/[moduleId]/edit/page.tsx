"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { EditModuleForm } from "@/components/modules/module/edit-module-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";

export default function MyLibraryEditModulePage() {
  const params = useParams();
  const t = useTranslations("module");
  const tDashboard = useTranslations("dashboard");

  if (!params) return null;

  const moduleId = Number(params.moduleId);

  if (!moduleId || Number.isNaN(moduleId)) return null;

  const backHref = `/dashboard/training-library/my/${moduleId}`;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col p-3 w-full">
          <div className="bg-[#F3F7FA] min-h-screen">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center text-xs text-gray-500 mb-6 gap-1.5"
            >
              <Link
                className="hover:text-gray-700 transition"
                href="/dashboard/training-library/my"
              >
                {tDashboard("menu.trainingLibrary")}
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                className="hover:text-gray-700 transition"
                href="/dashboard/training-library/my"
              >
                {tDashboard("menu.myLibrary") ?? "My Library"}
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                className="hover:text-gray-700 transition"
                href={backHref}
              >
                {t("moduleDetails.module") ?? "Module"}
              </Link>
              <span className="text-gray-400">›</span>
              <span className="font-semibold text-gray-900">
                {t("editModuleTitle") ?? "Edit Module"}
              </span>
            </nav>
            <EditModuleForm backHref={backHref} moduleId={moduleId} />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
