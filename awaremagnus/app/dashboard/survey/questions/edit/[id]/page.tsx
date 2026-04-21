"use client";

import { use } from "react";
import { CreateSurveyQuestionForm } from "@/components/modules/campaign/create-survey-question-form";

export default function EditSurveyQuestionRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <CreateSurveyQuestionForm questionId={Number(id)} />;
}
