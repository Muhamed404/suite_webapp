"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { NewSurveyForm } from "@/components/modules/campaign/new-survey-form";
import { useAuthStore } from "@/hooks/useAuthStore";
import { canManageSurveys } from "@/utils/roles";

export default function NewSurveyRoute() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canCreateSurvey = canManageSurveys(user?.role_id);

  useEffect(() => {
    if (user && !canCreateSurvey) {
      router.replace("/dashboard/survey");
    }
  }, [user, canCreateSurvey, router]);

  if (user && !canCreateSurvey) {
    return null;
  }

  return <NewSurveyForm />;
}
