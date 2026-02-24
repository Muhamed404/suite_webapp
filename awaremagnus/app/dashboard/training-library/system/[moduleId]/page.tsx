"use client";

import { useParams } from "next/navigation";

import { ModuleDetailsPage } from "@/components/modules/training-library/module-details-page";

export default function SystemLibraryModuleDetailsPage() {
  const params = useParams();
  const moduleId = params?.moduleId ? Number(params.moduleId) : 0;

  if (!moduleId || Number.isNaN(moduleId)) {
    return null;
  }

  return <ModuleDetailsPage libraryType="system" moduleId={moduleId} />;
}
