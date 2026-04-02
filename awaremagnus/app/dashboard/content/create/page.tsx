"use client";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateContentForm } from "@/components/modules/content/create-content-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CreateContentPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateContentForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
