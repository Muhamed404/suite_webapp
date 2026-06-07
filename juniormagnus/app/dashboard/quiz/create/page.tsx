"use client";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateQuizForm } from "@/components/modules/quiz/create-quiz-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CreateQuizPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateQuizForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
