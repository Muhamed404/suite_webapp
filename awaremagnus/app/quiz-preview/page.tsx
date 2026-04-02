"use client";

import { CreateQuizForm } from "@/components/modules/quiz/create-quiz-form";

/**
 * Preview route for Create Quiz form (no auth).
 * Access at /quiz-preview. Main flow: /dashboard/quiz/create (protected).
 */
export default function QuizPreviewPage() {
  return (
    <div className="min-h-screen bg-[#F1F5F8]">
      <CreateQuizForm />
    </div>
  );
}
