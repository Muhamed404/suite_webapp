import { redirect } from "next/navigation";

export default async function LegacyDoubleSlugSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ surveyId: string; invitationId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { surveyId, invitationId } = await params;
  const qp = await searchParams;

  const surveyCodeParam = qp.survey_code;
  const surveyCode =
    typeof surveyCodeParam === "string" ? surveyCodeParam : "";

  const target = `/survey/${surveyId}?invitation_id=${encodeURIComponent(
    invitationId,
  )}${surveyCode ? `&survey_code=${encodeURIComponent(surveyCode)}` : ""}`;

  redirect(target);
}
