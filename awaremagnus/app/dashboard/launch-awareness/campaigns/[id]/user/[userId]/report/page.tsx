"use client";

import { useParams } from "next/navigation";

import { ReportCardPage } from "@/components/modules/campaign";

export default function UserReportCardRoute() {
  const params = useParams();
  const userId = params?.userId ? Number(params.userId) : 0;

  // Render the report card page with the specific user ID
  return <ReportCardPage userId={userId} />;
}
