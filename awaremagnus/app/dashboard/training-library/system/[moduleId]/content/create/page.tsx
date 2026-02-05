"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import {
  CreateContentForm,
  type CreateContentFormProps,
} from "@/components/modules/content/create-content-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";

export default function SystemLibraryModuleContentCreatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard");

  const moduleId = String(params.moduleId ?? "");
  const typeParam = searchParams.get("type");
  const initialContentTypeId = typeParam ? Number(typeParam) : undefined;

  const basePath = "/dashboard/training-library/system";
  const breadcrumbLinks: CreateContentFormProps["breadcrumbLinks"] = [
    { label: t("menu.systemLibrary"), href: basePath },
    {
      label: `Module ${moduleId}`,
      href: `${basePath}/${moduleId}`,
    },
  ];
  const returnHref = `${basePath}/${moduleId}`;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CreateContentForm
          breadcrumbLinks={breadcrumbLinks}
          initialContentTypeId={initialContentTypeId}
          initialModuleId={moduleId}
          returnHref={returnHref}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
