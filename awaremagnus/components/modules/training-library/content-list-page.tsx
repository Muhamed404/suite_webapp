"use client";

import type { Module, ModuleContent } from "@/types/quiz";

import Link from "next/link";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContentsByModule } from "@/hooks/useQuiz";
import { useContentTypes } from "@/hooks/useSuiteAwm";
import { SUPPORTED_LANGUAGES } from "@/utils/supportedLanguages";
import { AuthImage } from "@/components/ui/auth-image";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { getContentTypeIcon } from "@/utils/contentTypeIcons";
import type { LibraryType } from "./library-page";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentListSkeleton } from "@/components/ui/skeletons";
import {
  inputClassNames,
  selectClassNames,
  primaryButtonClassName,
  cardClassName,
  pageTitleClassName,
  pageSubtitleClassName,
  breadcrumbLinkClassName,
} from "./shared-styles";
import { Input } from "@heroui/input";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return c.title ?? c.translations?.[0]?.title ?? (c as { name?: string }).name ?? `Content ${c.id}`;
}

function languageName(c: ModuleContent): string {
  const lang = c.language;
  if (lang?.name) return lang.name;
  if (c.translations?.[0]) {
    const lid = c.translations[0].language_id;
    return SUPPORTED_LANGUAGES.find((l) => l.id === lid)?.name ?? `Lang ${lid}`;
  }
  return "—";
}

/** Returns true if URL is a YouTube watch or embed URL */
function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "youtu.be";
  } catch {
    return false;
  }
}

/** Converts YouTube watch URL to embed URL for iframe */
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

type ViewMode = "grid" | "table";

interface ContentListPageProps {
  moduleId: number;
  contentTypeId: number;
  libraryType: LibraryType;
}

export function ContentListPage({
  moduleId,
  contentTypeId,
  libraryType,
}: ContentListPageProps) {
  const t = useTranslations("module");
  const tContent = useTranslations("content");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const libraryLabel =
    libraryType === "system" ? "System Library" : "My Library";
  const createPath = `${basePath}/${moduleId}/content/create?type=${contentTypeId}`;

  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: contentsRes, isLoading } = useContentsByModule(moduleId, {
    enabled: !!moduleId,
    lang_id: languageFilter ? Number(languageFilter) : undefined,
  });
  const { data: contentTypesList } = useContentTypes(!!moduleId);

  const module = moduleRes?.success ? moduleRes.data : null;
  const allContents = contentsRes?.success ? (contentsRes.data ?? []) : [];
  const contents = allContents.filter(
    (c: ModuleContent) => c.content_type_id === contentTypeId,
  );
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];
  const typeLabel =
    contentTypes.find((ct) => ct.id === contentTypeId)?.name ?? `Type ${contentTypeId}`;

  if (!module) {
    return null;
  }

  const moduleTitle = moduleName(module);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-6xl mx-auto w-full min-w-0", isRtl && "text-right")}>
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
            <span className="font-medium text-[var(--mainblue)]">{typeLabel}</span>
          </nav>

          <h1 className={pageTitleClassName}>{typeLabel}</h1>
          <p className={clsx(pageSubtitleClassName, "mt-1 mb-5")}>
            {t("library.description")}
          </p>

          <div
            className={clsx(
              "flex flex-wrap items-center gap-3 sm:gap-4 mb-5",
              isRtl && "flex-row-reverse",
            )}
          >
            <Input
              classNames={{ ...inputClassNames, base: "w-full min-w-0 sm:max-w-64" }}
              placeholder={t("library.searchPlaceholder")}
              type="text"
            />
            <Select
              className="w-full min-w-0 sm:max-w-44"
              classNames={selectClassNames}
              aria-label={t("library.language")}
              placeholder={t("library.allLanguages")}
              selectedKeys={languageFilter ? [languageFilter] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys as Set<string>)[0] ?? "";
                setLanguageFilter(v);
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={String(lang.id)} textValue={lang.name}>
                  {lang.name}
                </SelectItem>
              ))}
            </Select>
            <div className="flex rounded-full border border-[var(--strokeGray)] p-0.5 bg-[var(--gray)]/30">
              <button
                type="button"
                aria-label={t("library.viewGrid")}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-white text-[var(--mainblue)] shadow-sm"
                    : "text-[var(--darkgray)] hover:text-[var(--mainblue)]",
                )}
                onClick={() => setViewMode("grid")}
              >
                {t("library.viewGrid")}
              </button>
              <button
                type="button"
                aria-label={t("library.viewList")}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-white text-[var(--mainblue)] shadow-sm"
                    : "text-[var(--darkgray)] hover:text-[var(--mainblue)]",
                )}
                onClick={() => setViewMode("table")}
              >
                {t("library.viewList")}
              </button>
            </div>
            <Button
              as={Link}
              className={clsx(primaryButtonClassName, "w-full sm:w-auto shrink-0")}
              href={createPath}
              radius="full"
              size="md"
            >
              {t("library.addNew")}
            </Button>
          </div>

          {isLoading ? (
            <ContentListSkeleton />
          ) : contents.length === 0 ? (
            <EmptyState
              title={t("library.emptyContentTitle")}
              description={t("library.emptyContentDescription")}
              action={
                <Button
                  as={Link}
                  className={primaryButtonClassName}
                  href={createPath}
                  radius="full"
                  size="md"
                >
                  {t("library.addNew")}
                </Button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(contents as ModuleContent[]).map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  basePath={basePath}
                  moduleId={moduleId}
                  typeLabel={typeLabel}
                  t={t}
                  tContent={tContent}
                />
              ))}
            </div>
          ) : (
            <Card className={cardClassName}>
              <CardBody className="p-0 overflow-x-auto">
                <Table removeWrapper aria-label="Content" className="min-w-[640px]">
                  <TableHeader>
                    <TableColumn key="#">#</TableColumn>
                    <TableColumn key="thumbnail">{t("library.thumbnail")}</TableColumn>
                    <TableColumn key="name">{tContent("contentTitle") ?? "Content Name"}</TableColumn>
                    <TableColumn key="description">{t("library.description")}</TableColumn>
                    <TableColumn key="language">{t("library.language")}</TableColumn>
                    <TableColumn key="contents">{t("library.contents")}</TableColumn>
                    <TableColumn key="change">{t("library.change")}</TableColumn>
                  </TableHeader>
                  <TableBody items={contents}>
                    {(item: ModuleContent) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-[var(--darkgray)]">
                          {(contents as ModuleContent[]).indexOf(item) + 1}
                        </TableCell>
                        <TableCell>
                          <ContentThumbnail item={item} typeLabel={typeLabel} />
                        </TableCell>
                        <TableCell>
                          <Link
                            className="text-[var(--blue)] hover:underline font-medium text-sm"
                            href={`${basePath}/${moduleId}/content/${contentTypeId}/${item.id}`}
                          >
                            {contentTitle(item)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-[var(--darkgray)] line-clamp-2 max-w-[200px]">
                            {item.description ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-[var(--darkgray)]">
                            {languageName(item)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <SourceCell item={item} t={t} />
                        </TableCell>
                        <TableCell>
                          <Button
                            as={Link}
                            href={`${basePath}/${moduleId}/content/${contentTypeId}/${item.id}`}
                            radius="full"
                            size="sm"
                            variant="light"
                          >
                            {t("library.viewDetails")}
                          </Button>
                          <Button radius="full" size="sm" variant="light">
                            {t("library.edit")}
                          </Button>
                          <Button
                            color="danger"
                            radius="full"
                            size="sm"
                            variant="light"
                            className={isRtl ? "mr-1" : "ml-1"}
                          >
                            {t("library.delete")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ContentThumbnail({
  item,
  typeLabel,
}: {
  item: ModuleContent;
  typeLabel: string;
}) {
  const logoUrl = item.logo_url ?? item.logo_path;
  const fallbackIcon = getContentTypeIcon(typeLabel ?? "");

  if (logoUrl) {
    return (
      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--gray)]/30 shrink-0">
        <AuthImage
          alt=""
          src={logoUrl}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }
  return (
    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--gray)]/30 flex items-center justify-center shrink-0">
      <Image
        alt=""
        src={fallbackIcon}
        width={24}
        height={24}
        className="object-contain opacity-70"
      />
    </div>
  );
}

function SourceCell({
  item,
  t,
}: {
  item: ModuleContent;
  t: (key: string) => string;
}) {
  const sourceUrl = item.source_url ?? (item as { source_path?: string }).source_path;
  if (!sourceUrl?.trim()) {
    return <span className="text-sm text-[var(--darkgray)]">—</span>;
  }
  const fullUrl = sourceUrl.startsWith("http") ? sourceUrl : getContentAssetUrl(sourceUrl);
  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-[var(--blue)] hover:underline truncate max-w-[180px] block"
      title={fullUrl}
    >
      {t("library.openLink")}
    </a>
  );
}

function ContentCard({
  item,
  basePath,
  moduleId,
  typeLabel,
  t,
  tContent,
}: {
  item: ModuleContent;
  basePath: string;
  moduleId: number;
  typeLabel: string;
  t: (key: string) => string;
  tContent: (key: string) => string;
}) {
  const contentTypeId = item.content_type_id;
  const detailHref = `${basePath}/${moduleId}/content/${contentTypeId}/${item.id}`;
  const logoUrl = item.logo_url ?? item.logo_path;
  const fallbackIcon = getContentTypeIcon(typeLabel ?? "");
  const sourceUrl = item.source_url ?? (item as { source_path?: string }).source_path;
  const fullSourceUrl = sourceUrl?.trim() ? (sourceUrl.startsWith("http") ? sourceUrl : getContentAssetUrl(sourceUrl)) : null;
  const embedUrl = fullSourceUrl && isYouTubeUrl(fullSourceUrl) ? youtubeEmbedUrl(fullSourceUrl) : null;

  return (
    <Card className={cardClassName + " h-full flex flex-col"}>
      <CardBody className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex gap-3">
          {logoUrl ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[var(--gray)]/30 shrink-0">
              <AuthImage
                alt=""
                src={logoUrl}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--gray)]/30 flex items-center justify-center shrink-0">
              <Image
                alt=""
                src={fallbackIcon}
                width={28}
                height={28}
                className="object-contain opacity-70"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={detailHref}
              className="font-medium text-[var(--mainblue)] hover:text-[var(--blue)] hover:underline text-sm line-clamp-2"
            >
              {contentTitle(item)}
            </Link>
            <p className="text-xs text-[var(--darkgray)] mt-0.5">
              {languageName(item)}
            </p>
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-[var(--darkgray)] line-clamp-2">
            {item.description}
          </p>
        )}
        {fullSourceUrl && (
          <div className="mt-auto space-y-2">
            <a
              href={fullSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--blue)] hover:underline block truncate"
              title={fullSourceUrl}
            >
              {t("library.viewSource")} ↗
            </a>
            {embedUrl && (
              <div className="rounded-xl overflow-hidden bg-black/5 aspect-video max-h-32">
                <iframe
                  title={contentTitle(item)}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button
            as={Link}
            href={detailHref}
            radius="full"
            size="sm"
            variant="flat"
            className="text-[var(--blue)] text-sm"
          >
            {t("library.viewDetails")}
          </Button>
          <Button radius="full" size="sm" variant="light">
            {t("library.edit")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
