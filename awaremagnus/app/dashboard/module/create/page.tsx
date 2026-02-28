"use client";

import Link from "next/link";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateModuleForm } from "@/components/modules/module/create-module-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";

export default function CreateModulePage() {
  const t = useTranslations("module");

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col p-3 w-full">
          <div className="bg-[#F3F7FA] min-h-screen">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center text-xs text-gray-500 mb-6 gap-1.5"
            >
              <Link className="hover:text-gray-700 transition" href="/dashboard/module">
                Awareness Library
              </Link>
              <span className="text-gray-400">›</span>
              <span className="font-semibold text-gray-900">{t("breadcrumbCurrent")}</span>
            </nav>
            <CreateModuleForm />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
