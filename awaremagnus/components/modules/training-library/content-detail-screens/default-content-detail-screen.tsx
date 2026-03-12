"use client";

import type { Module, ModuleContent } from "@/types/quiz";
import type { LibraryType } from "../library-page";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { breadcrumbLinkClassName, cardClassName } from "../shared-styles";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContent } from "@/hooks/useQuiz";
import { CONTENT_TYPES } from "@/constants/content-types";
import { AuthImage } from "@/components/ui/auth-image";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { getContentTypeIconFor } from "@/utils/contentTypeIcons";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);

    return (
      u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];

      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const v = u.searchParams.get("v");

    return v ? `https://www.youtube.com/embed/${v}` : null;
  } catch {
    return null;
  }
}

interface DefaultContentDetailScreenProps {
  moduleId: number;
  contentTypeId: number;
  contentId: number;
  libraryType: LibraryType;
  breadcrumbContext?: "training-library" | "campaign" | "my-assignments";
  campaignId?: number;
}

export function DefaultContentDetailScreen({
  moduleId,
  contentTypeId,
  contentId,
  libraryType,
  breadcrumbContext = "training-library",
  campaignId,
}: DefaultContentDetailScreenProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  console.log(
    "📋 DefaultContentDetailScreen - breadcrumbContext:",
    breadcrumbContext,
    "campaignId:",
    campaignId,
    "libraryType:",
    libraryType
  );

  const basePath =
    breadcrumbContext === "campaign"
      ? `/dashboard/campaign-assignments/${campaignId}`
      : `/dashboard/training-library/${libraryType}`;
  const listHref =
    breadcrumbContext === "campaign"
      ? `${basePath}/modules/${moduleId}/content/${contentTypeId}`
      : `${basePath}/${moduleId}/content/${contentTypeId}`;

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const contentTypesList = CONTENT_TYPES;

  const moduleData = moduleRes?.success ? moduleRes.data : null;
  const rawContent = contentRes?.success ? contentRes.data : null;
  const content = rawContent as ModuleContent | null;
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const typeLabel =
    contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? `Type ${contentTypeId}`;

  if (!moduleData) return null;

  const moduleTitle = moduleName(moduleData);
  const logoUrl = content?.logo_url ?? content?.logo_path;
  const fallbackIcon = getContentTypeIconFor(contentTypeId, typeLabel ?? "");
  const sourceUrl = content?.source_url ?? (content as { source_path?: string })?.source_path;
  // Use local same-origin proxy for generic content
  const fullSourceUrl = sourceUrl?.trim()
    ? sourceUrl.startsWith("http")
      ? sourceUrl
      : sourceUrl.startsWith("/contents/")
        ? `/awm${sourceUrl}`
        : `/awm/contents/${sourceUrl.startsWith("/") ? sourceUrl.slice(1) : sourceUrl}`
    : null;

  const completeImageUrl = logoUrl ? getContentAssetUrl(logoUrl) : null;

  if (content) {
    console.log("COMPLETE IMAGE URL:", completeImageUrl);
    console.log("COMPLETE SOURCE URL:", fullSourceUrl);
  }
  const embedUrl =
    fullSourceUrl && isYouTubeUrl(fullSourceUrl) ? youtubeEmbedUrl(fullSourceUrl) : null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-4xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          <nav
            className={clsx(
              "flex flex-wrap items-center gap-1.5 text-sm mb-4 sm:mb-5 overflow-x-auto",
              isRtl && "flex-row-reverse"
            )}
          >
            {breadcrumbContext === "campaign" ? (
              <>
                <Link className={breadcrumbLinkClassName} href="/dashboard/campaign-assignments">
                  {t("moduleDetails.breadcrumbAwarenessCampaign")}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={basePath}>
                  {t("moduleDetails.breadcrumbCampaign")}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={`${basePath}/modules/${moduleId}`}>
                  {moduleTitle}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={listHref}>
                  {typeLabel}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <span className="font-medium text-[var(--mainblue)]">
                  {content ? contentTitle(content) : `Content ${contentId}`}
                </span>
              </>
            ) : breadcrumbContext === "my-assignments" ? (
              <>
                <Link className={breadcrumbLinkClassName} href="/dashboard/campaign-assignments">
                  {t("moduleDetails.breadcrumbMyAssignments")}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                {campaignId ? (
                  <Link
                    className={breadcrumbLinkClassName}
                    href={`/dashboard/campaign-assignments/${campaignId}/modules/${moduleId}`}
                  >
                    {moduleTitle}
                  </Link>
                ) : (
                  <span>{moduleTitle}</span>
                )}
                <span className="text-[var(--darkgray)]">›</span>
                <span className="font-medium text-[var(--mainblue)]">{typeLabel}</span>
              </>
            ) : (
              <>
                <Link className={breadcrumbLinkClassName} href={basePath}>
                  {t("moduleDetails.breadcrumbTrainingLibrary")}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={basePath}>
                  {libraryType === "system"
                    ? t("moduleDetails.coreModules")
                    : t("moduleDetails.breadcrumbMyLibrary")}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={`${basePath}/${moduleId}`}>
                  {moduleTitle}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <Link className={breadcrumbLinkClassName} href={listHref}>
                  {typeLabel}
                </Link>
                <span className="text-[var(--darkgray)]">›</span>
                <span className="font-medium text-[var(--mainblue)]">
                  {content ? contentTitle(content) : `Content ${contentId}`}
                </span>
              </>
            )}
          </nav>

          {isLoading ? (
            <div className="animate-pulse rounded-2xl border border-[var(--strokeGray)] bg-[var(--gray)]/20 h-64" />
          ) : !content ? (
            <Card className={cardClassName}>
              <CardBody className="p-6">
                <p className="text-[var(--darkgray)]">Content not found.</p>
                <Button
                  as={Link}
                  className="mt-3"
                  href={listHref}
                  radius="full"
                  size="sm"
                  variant="flat"
                >
                  Back to list
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Card className={cardClassName}>
              <CardBody className="p-6 space-y-6">
                <div className="flex gap-4 flex-wrap">
                  {logoUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--gray)]/30 shrink-0">
                      <AuthImage fill alt="" className="object-cover" sizes="80px" src={logoUrl} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[var(--gray)]/30 flex items-center justify-center shrink-0">
                      <Image
                        alt=""
                        className="object-contain opacity-70"
                        height={40}
                        src={fallbackIcon}
                        width={40}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold text-[var(--mainblue)]">
                      {contentTitle(content)}
                    </h1>
                    {content.language?.name && (
                      <p className="text-sm text-[var(--darkgray)] mt-0.5">
                        {content.language.name}
                      </p>
                    )}
                  </div>
                </div>

                {content.description && (
                  <div>
                    <h2 className="text-sm font-medium text-[var(--mainblue)] mb-1">
                      {t("library.description")}
                    </h2>
                    <p className="text-sm text-[var(--darkgray)] whitespace-pre-wrap">
                      {content.description}
                    </p>
                  </div>
                )}

                {fullSourceUrl && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-medium text-[var(--mainblue)]">
                      {t("library.viewSource")}
                    </h2>
                    <a
                      className="text-sm text-[var(--blue)] hover:underline break-all block"
                      href={fullSourceUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {fullSourceUrl}
                    </a>
                    <Button
                      as="a"
                      className="text-[var(--blue)]"
                      href={fullSourceUrl}
                      radius="full"
                      rel="noopener noreferrer"
                      size="sm"
                      target="_blank"
                      variant="flat"
                    >
                      {t("library.openLink")}
                    </Button>
                    {embedUrl && (
                      <div className="rounded-xl overflow-hidden bg-black/5 aspect-video max-w-2xl">
                        <iframe
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          className="w-full h-full"
                          src={embedUrl}
                          title={contentTitle(content)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button as={Link} href={listHref} radius="full" size="sm" variant="bordered">
                    Back to list
                  </Button>
                  <Button className="text-[var(--blue)]" radius="full" size="sm" variant="flat">
                    {t("library.edit")}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
