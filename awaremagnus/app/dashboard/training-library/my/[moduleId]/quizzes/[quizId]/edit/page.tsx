"use client";

import { useParams } from "next/navigation";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { EditQuizForm } from "@/components/modules/quiz/edit-quiz-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyLibraryModuleQuizEditPage() {
  const params = useParams();
  const moduleId = String(params?.moduleId ?? "");
  const quizId = String(params?.quizId ?? "");
  const basePath = "/dashboard/training-library/my";
  const returnHref = `${basePath}/${moduleId}/quizzes`;

  if (!quizId || quizId === "undefined") return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <EditQuizForm initialModuleId={moduleId} quizId={Number(quizId)} returnHref={returnHref} libraryType="my" />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
