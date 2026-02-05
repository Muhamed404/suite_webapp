"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { EditQuizForm } from "@/components/modules/quiz/edit-quiz-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SystemLibraryModuleQuizEditPage() {
  const params = useParams();
  const moduleId = String(params.moduleId ?? "");
  const quizId = String(params.quizId ?? "");
  const basePath = "/dashboard/training-library/system";
  const returnHref = `${basePath}/${moduleId}/quizzes`;

  if (!quizId || quizId === "undefined") return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <EditQuizForm
          quizId={Number(quizId)}
          initialModuleId={moduleId}
          returnHref={returnHref}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
