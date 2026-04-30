"use client";

import { useSearchParams } from "next/navigation";

import { ReportCardPage } from "@/components/modules/campaign";

export default function MyReportCardRoute() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams?.get("userId");
  const parsedUserId = userIdParam ? Number(userIdParam) : undefined;
  const userId = parsedUserId && !Number.isNaN(parsedUserId) ? parsedUserId : undefined;

  return <ReportCardPage userId={userId} />;
}
