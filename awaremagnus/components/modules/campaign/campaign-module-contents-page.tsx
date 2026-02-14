"use client";

import type { Module, ModuleContent } from "@/types/quiz";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useState, useMemo } from "react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContentsByModule } from "@/hooks/useQuiz";
import { useContentTypes } from "@/hooks/useSuiteAwm";
import { getContentTypeIconFor } from "@/utils/contentTypeIcons";
import { EmptyState } from "@/components/ui/empty-state";
import { ModuleDetailsSkeleton } from "@/components/ui/skeletons";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? c.translations?.[0]?.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function getIconBgClass(typeName: string): string {
  const n = (typeName ?? "").toLowerCase();

  if (n.includes("interactive") || n === "ispring") return "bg-sky-100";
  if (n.includes("quiz")) return "bg-amber-100";
  if (n.includes("poster")) return "bg-orange-100";
  if (n.includes("video") || n.includes("motion")) return "bg-blue-100";
  if (n.includes("document") || n.includes("pdf") || n.includes("brochure")) return "bg-gray-100";

  return "bg-gray-100";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface CampaignModuleContentsPageProps {
  campaignId: number;
  moduleId: number;
}

export function CampaignModuleContentsPage({
  campaignId,
  moduleId,
}: CampaignModuleContentsPageProps) {
  const t = useTranslations("campaign");
  const tModule = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const { data: moduleRes, isLoading: moduleLoading } = useModule(moduleId, !!moduleId);
  const { data: contentsRes, isLoading: contentsLoading } = useContentsByModule(moduleId, {
    enabled: !!moduleId,
  });
  const { data: contentTypesList } = useContentTypes();

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const contents = contentsRes?.success ? (contentsRes.data ?? []) : [];
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];

  const typeNameById = useMemo(() => {
    const map = new Map<number, string>();

    contentTypes.forEach((ct) => map.set(ct.id, ct.name ?? ""));

    return map;
  }, [contentTypes]);

  const isLoading = moduleLoading || contentsLoading;

  if (isLoading || !moduleData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className={clsx("p-4 sm:p-6 max-w-5xl mx-auto w-full min-w-0", isRtl && "text-right")}>
            <ModuleDetailsSkeleton />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const moduleTitle = moduleName(moduleData);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-5xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-6 gap-1.5 flex-wrap",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
              {t("breadcrumb.dashboard")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href="/dashboard/campaign-assignments"
            >
              {t("title")}
            </Link>
            <span className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href={`/dashboard/campaign-assignments/${campaignId}/modules`}
            >
              {t("modulesTitle")}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{moduleTitle}</span>
          </nav>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[var(--mainblue)]">{moduleTitle}</h1>
            {moduleData.description && (
              <p className="text-xs text-gray-500 mt-1">{moduleData.description}</p>
            )}
          </div>

          {/* Empty */}
          {contents.length === 0 && (
            <EmptyState
              description={t("emptyContentsDescription")}
              title={t("emptyContentsTitle")}
              action={
                <Button
                  as={Link}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold px-5"
                  href={`/dashboard/campaign-assignments/${campaignId}/modules`}
                  size="sm"
                >
                  {t("backToModules")}
                </Button>
              }
            />
          )}

          {/* Content List */}
          {contents.length > 0 && (
            <div className="space-y-3">
              {contents.map((content) => {
                const typeName = typeNameById.get(content.content_type_id) ?? "";
                const iconPath = getContentTypeIconFor(content.content_type_id, typeName);
                const detailHref = `/dashboard/campaign-assignments/${campaignId}/modules/${moduleId}/content/${content.id}`;

                return (
                  <Card
                    key={content.id}
                    className="rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none hover:shadow-md transition-shadow"
                  >
                    <CardBody className={clsx("p-4 flex flex-row items-center gap-3", isRtl && "flex-row-reverse")}>
                      {/* Icon */}
                      <div
                        className={clsx(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                          getIconBgClass(typeName)
                        )}
                      >
                        <Image
                          alt=""
                          className="object-contain"
                          height={24}
                          src={iconPath}
                          width={24}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{contentTitle(content)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {typeName && <span className="capitalize">{typeName}</span>}
                          {content.created_at && (
                            <span className="ml-2">
                              {tModule("moduleDetails.created")} {formatDate(content.created_at)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action */}
                      <Button
                        as={Link}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold min-w-[88px] px-5"
                        href={detailHref}
                        size="sm"
                      >
                        {tModule("moduleDetails.start")}
                      </Button>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
