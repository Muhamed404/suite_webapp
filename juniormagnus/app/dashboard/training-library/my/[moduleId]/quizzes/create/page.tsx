"use client";

import { useParams } from "next/navigation";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { CreateQuizForm } from "@/components/modules/quiz/create-quiz-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyLibraryModuleQuizCreatePage() {
  const params = useParams();
  const moduleId = String(params?.moduleId ?? "");
  const basePath = "/dashboard/training-library/my";
  const returnHref = `${basePath}/${moduleId}/quizzes`;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateQuizForm initialModuleId={moduleId} returnHref={returnHref} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
