"use client";

import { useParams } from "next/navigation";
import { QuizListPage } from "@/components/modules/training-library/quiz-list-page";

export default function SystemLibraryModuleQuizzesPage() {
  const params = useParams();
  const moduleId = Number(params.moduleId);

  if (!moduleId || Number.isNaN(moduleId)) return null;

  return (
    <QuizListPage moduleId={moduleId} libraryType="system" />
  );
}
