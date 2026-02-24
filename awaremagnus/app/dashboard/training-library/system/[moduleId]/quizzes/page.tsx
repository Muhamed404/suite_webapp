"use client";

import { useParams } from "next/navigation";

import { QuizListPage } from "@/components/modules/training-library/quiz-list-page";

export default function SystemLibraryModuleQuizzesPage() {
  const params = useParams();
  const moduleId = params?.moduleId ? Number(params.moduleId) : 0;

  if (!moduleId || Number.isNaN(moduleId)) return null;

  return <QuizListPage libraryType="system" moduleId={moduleId} />;
}
