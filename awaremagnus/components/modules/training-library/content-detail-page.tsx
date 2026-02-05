"use client";

import type { Module, ModuleContent } from "@/types/quiz";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContent } from "@/hooks/useQuiz";
import { useContentTypes } from "@/hooks/useSuiteAwm";
import { AuthImage } from "@/components/ui/auth-image";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { getContentTypeIcon } from "@/utils/contentTypeIcons";
import type { LibraryType } from "./library-page";
import { breadcrumbLinkClassName, cardClassName } from "./shared-styles";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "youtu.be";
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

interface ContentDetailPageProps {
  moduleId: number;
  contentTypeId: number;
  contentId: number;
  libraryType: LibraryType;
}

export function ContentDetailPage({
  moduleId,
  contentTypeId,
  contentId,
  libraryType,
}: ContentDetailPageProps) {
  const t = useTranslations("module");
  const tContent = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const libraryLabel = libraryType === "system" ? "System Library" : "My Library";
  const listHref = `${basePath}/${moduleId}/content/${contentTypeId}`;

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentRes, isLoading } = useContent(contentId, !!contentId);
  const { data: contentTypesList } = useContentTypes(!!moduleId);

  const module = moduleRes?.success ? moduleRes.data : null;
  const rawContent = contentRes?.success ? contentRes.data : null;
  const content = rawContent as ModuleContent | null;
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const typeLabel = contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? `Type ${contentTypeId}`;

  if (!module) return null;

  const moduleTitle = moduleName(module);
  const logoUrl = content?.logo_url ?? content?.logo_path;
  const fallbackIcon = getContentTypeIcon(typeLabel ?? "");
  const sourceUrl = content?.source_url ?? (content as { source_path?: string })?.source_path;
  const fullSourceUrl = sourceUrl?.trim()
    ? (sourceUrl.startsWith("http") ? sourceUrl : getContentAssetUrl(sourceUrl))
    : null;
  const embedUrl = fullSourceUrl && isYouTubeUrl(fullSourceUrl) ? youtubeEmbedUrl(fullSourceUrl) : null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-4xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          <nav
            className={clsx(
              "flex flex-wrap items-center gap-1.5 text-sm mb-4 sm:mb-5 overflow-x-auto",
              isRtl && "flex-row-reverse",
            )}
          >
            <Link className={breadcrumbLinkClassName} href={basePath}>
              {libraryLabel}
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
          </nav>

          {isLoading ? (
            <div className="animate-pulse rounded-2xl border border-[var(--strokeGray)] bg-[var(--gray)]/20 h-64" />
          ) : !content ? (
            <Card className={cardClassName}>
              <CardBody className="p-6">
                <p className="text-[var(--darkgray)]">Content not found.</p>
                <Button as={Link} href={listHref} radius="full" size="sm" variant="flat" className="mt-3">
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
                      <AuthImage
                        alt=""
                        src={logoUrl}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[var(--gray)]/30 flex items-center justify-center shrink-0">
                      <Image
                        alt=""
                        src={fallbackIcon}
                        width={40}
                        height={40}
                        className="object-contain opacity-70"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold text-[var(--mainblue)]">
                      {contentTitle(content)}
                    </h1>
                    {content.language?.name && (
                      <p className="text-sm text-[var(--darkgray)] mt-0.5">{content.language.name}</p>
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
                      href={fullSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--blue)] hover:underline break-all block"
                    >
                      {fullSourceUrl}
                    </a>
                    <Button
                      as="a"
                      href={fullSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      radius="full"
                      size="sm"
                      variant="flat"
                      className="text-[var(--blue)]"
                    >
                      {t("library.openLink")}
                    </Button>
                    {embedUrl && (
                      <div className="rounded-xl overflow-hidden bg-black/5 aspect-video max-w-2xl">
                        <iframe
                          title={contentTitle(content)}
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button as={Link} href={listHref} radius="full" size="sm" variant="bordered">
                    Back to list
                  </Button>
                  <Button radius="full" size="sm" variant="flat" className="text-[var(--blue)]">
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
