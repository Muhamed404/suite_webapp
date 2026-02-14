"use client";

import type { Module } from "@/types/quiz";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useCampaignModules } from "@/hooks/useCampaign";
import { EmptyState } from "@/components/ui/empty-state";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function moduleDescription(m: Module): string {
  return m.description ?? m.translations?.[0]?.description ?? "";
}

interface CampaignModulesPageProps {
  campaignId: number;
}

export function CampaignModulesPage({ campaignId }: CampaignModulesPageProps) {
  const t = useTranslations("campaign");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const { data: modulesRes, isLoading } = useCampaignModules(campaignId);
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-5xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-6 gap-1.5",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href="/dashboard">
              {t("breadcrumb.dashboard")}
            </Link>
            <span aria-hidden className="text-gray-400">›</span>
            <Link
              className="hover:text-gray-700 transition-colors"
              href="/dashboard/campaign-assignments"
            >
              {t("title")}
            </Link>
            <span aria-hidden className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">{t("modulesTitle")}</span>
          </nav>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[var(--mainblue)]">{t("modulesTitle")}</h1>
            <p className="text-xs text-gray-500 mt-1">{t("modulesDescription")}</p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-24" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && modules.length === 0 && (
            <EmptyState
              description={t("emptyModulesDescription")}
              title={t("emptyModulesTitle")}
              action={
                <Button
                  as={Link}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold px-5"
                  href={`/dashboard/campaign-assignments/${campaignId}`}
                  size="sm"
                >
                  Back to Assignments
                </Button>
              }
            />
          )}

          {/* Module List */}
          {!isLoading && modules.length > 0 && (
            <div className="space-y-3">
              {modules.map((mod) => (
                <Card
                  key={mod.id}
                  className="rounded-2xl border border-[var(--strokeGray)] bg-white shadow-none hover:shadow-md transition-shadow"
                >
                  <CardBody className={clsx("p-4 flex flex-row items-center gap-4", isRtl && "flex-row-reverse")}>
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Image
                        alt=""
                        className="object-contain"
                        height={24}
                        src="/images/Icon_Template.svg"
                        width={24}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{moduleName(mod)}</p>
                      {moduleDescription(mod) && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {moduleDescription(mod)}
                        </p>
                      )}
                      {mod.category && (
                        <span className="inline-block mt-1.5 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {mod.category.name}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <Button
                      as={Link}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold min-w-[88px] px-5"
                      href={`/dashboard/campaign-assignments/${campaignId}/modules/${mod.id}`}
                      size="sm"
                    >
                      {t("viewContents")}
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
