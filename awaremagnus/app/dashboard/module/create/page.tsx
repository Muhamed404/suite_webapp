"use client";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateModuleForm } from "@/components/modules/module/create-module-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CreateModulePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateModuleForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
