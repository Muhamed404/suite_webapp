"use client";

import { useParams } from "next/navigation";
import { ModuleDetailsPage } from "@/components/modules/training-library/module-details-page";

export default function MyLibraryModuleDetailsPage() {
  const params = useParams();
  const moduleId = Number(params.moduleId);

  if (!moduleId || Number.isNaN(moduleId)) {
    return null;
  }

  return (
    <ModuleDetailsPage moduleId={moduleId} libraryType="my" />
  );
}
