"use client";

import { useParams, useSearchParams } from "next/navigation";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import {
  CreateContentForm,
  type CreateContentFormProps,
} from "@/components/modules/content/create-content-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";

export default function MyLibraryModuleContentCreatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard");

  const moduleId = String(params?.moduleId ?? "");
  const typeParam = searchParams?.get("type");
  const initialContentTypeId = typeParam ? Number(typeParam) : undefined;

  const basePath = "/dashboard/training-library/my";
  const breadcrumbLinks: CreateContentFormProps["breadcrumbLinks"] = [
    { label: t("menu.myLibrary"), href: basePath },
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
