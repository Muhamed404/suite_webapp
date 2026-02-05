"use client";

import type { Module, ModuleContent } from "@/types/quiz";

import Image from "next/image";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useState, useMemo } from "react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import {
  useModule,
  useContentsByModule,
  useQuizzesByModule,
} from "@/hooks/useQuiz";
import { useContentTypes } from "@/hooks/useSuiteAwm";
import { SUPPORTED_LANGUAGES } from "@/utils/supportedLanguages";
import { getLanguageFlag } from "@/utils/supportedLanguages";
import { getContentTypeIcon } from "@/utils/contentTypeIcons";
import type { LibraryType } from "./library-page";
import { ModuleDetailsSkeleton } from "@/components/ui/skeletons";
import {
  selectClassNames,
  primaryButtonClassName,
  cardClassName,
  pageTitleClassName,
  pageSubtitleClassName,
  breadcrumbLinkClassName,
} from "./shared-styles";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

/** Unique language ids from contents (API: language.id or lang_id or translations) */
function getUniqueLanguageIds(contents: ModuleContent[]): number[] {
  const ids = new Set<number>();
  contents.forEach((c) => {
    if (c.language?.id != null) ids.add(c.language.id);
    const raw = c as unknown as { lang_id?: number };
    if (raw.lang_id != null) ids.add(raw.lang_id);
    c.translations?.forEach((t) => ids.add(t.language_id));
  });
  return Array.from(ids);
}

interface ModuleDetailsPageProps {
  moduleId: number;
  libraryType: LibraryType;
}

export function ModuleDetailsPage({
  moduleId,
  libraryType,
}: ModuleDetailsPageProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const libraryLabel =
    libraryType === "system" ? "System Library" : "My Library";

  const [languageFilter, setLanguageFilter] = useState<string>("");

  const { data: moduleRes, isLoading: moduleLoading } = useModule(
    moduleId,
    !!moduleId,
  );
  const { data: contentsRes, isLoading: contentsLoading } = useContentsByModule(
    moduleId,
    {
      enabled: !!moduleId,
      lang_id: languageFilter ? Number(languageFilter) : undefined,
    },
  );
  const { data: quizzesRes } = useQuizzesByModule(moduleId, !!moduleId);
  const { data: contentTypesList } = useContentTypes();

  const module = moduleRes?.success ? moduleRes.data : null;
  const contents = contentsRes?.success ? (contentsRes.data ?? []) : [];
  const quizzes =
    quizzesRes?.success && Array.isArray(quizzesRes.data) ? quizzesRes.data : [];
  const contentTypes = Array.isArray(contentTypesList) ? contentTypesList : [];

  const contentsByType = useMemo(() => {
    const map = new Map<number, ModuleContent[]>();
    contents.forEach((c) => {
      const list = map.get(c.content_type_id) ?? [];
      list.push(c);
      map.set(c.content_type_id, list);
    });
    return map;
  }, [contents]);

  const isLoading = moduleLoading || contentsLoading;

  if (isLoading || !module) {
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

  const moduleTitle = moduleName(module);
  const moduleDesc =
    module.description ?? module.translations?.[0]?.description ?? t("moduleDetails.description");

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-5xl mx-auto w-full min-w-0", isRtl && "text-right")}>
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
            <span className="font-medium text-[var(--mainblue)]">{moduleTitle}</span>
          </nav>

          <h1 className={pageTitleClassName}>
            {t("moduleDetails.title")} : {moduleTitle}
          </h1>
          <p className={clsx(pageSubtitleClassName, "mt-1 mb-6")}>{moduleDesc}</p>

          <div
            className={clsx(
              "flex flex-wrap items-center gap-3 sm:gap-4 mb-6",
              isRtl && "flex-row-reverse",
            )}
          >
            <Select
              className="w-full min-w-0 sm:max-w-44"
              classNames={selectClassNames}
              aria-label={t("moduleDetails.languageFilter")}
              placeholder={t("moduleDetails.languageFilter")}
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
          </div>

          <div className="flex flex-col gap-4">
            {contentTypes.map((contentType) => {
              const typeId = contentType.id;
              const items = contentsByType.get(typeId) ?? [];
              const singular = contentType.name.toLowerCase();
              const count = items.length;
              const languageIds = getUniqueLanguageIds(items);
              const contentPath = `${basePath}/${moduleId}/content/${typeId}`;
              const createPath = `${basePath}/${moduleId}/content/create?type=${typeId}`;
              const iconPath = getContentTypeIcon(contentType.name ?? "");

              return (
                <Card key={typeId} className={cardClassName}>
                  <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 sm:gap-5">
                    <div className="aspect-square w-20 h-20 bg-[var(--gray)] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                      <Image
                        alt=""
                        src={iconPath}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--mainblue)]">
                        {contentType.name}
                      </p>
                      <p className="text-xs text-[var(--darkgray)] mt-2 flex items-center gap-1.5 flex-wrap">
                        <span>{t("moduleDetails.supportedLanguages")}</span>
                        {languageIds.length ? (
                          <span className="inline-flex items-center gap-0.5" title={languageIds.map((id) => getLanguageFlag(id)).join(" ")}>
                            {languageIds.map((id) => (
                              <span key={id} className="text-base leading-none" aria-hidden>
                                {getLanguageFlag(id)}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span>{t("moduleDetails.noLanguages")}</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--darkgray)] mt-1">
                        {count} {singular}
                        {count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className={clsx("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
                      <Button
                        as={Link}
                        href={contentPath}
                        radius="full"
                        size="sm"
                        variant="flat"
                        className="text-[var(--blue)]"
                      >
                        {t("moduleDetails.open")}
                      </Button>
                      <Button
                        as={Link}
                        className={primaryButtonClassName}
                        href={createPath}
                        radius="full"
                        size="sm"
                      >
                        {t("moduleDetails.add")}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            <Card className={cardClassName}>
              <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 sm:gap-5">
                <div className="aspect-square w-20 h-20 bg-[var(--gray)] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  <Image
                    alt=""
                    src={getContentTypeIcon("Quiz")}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--mainblue)]">
                    {t("moduleDetails.quizzes")}
                  </p>
                  <p className="text-xs text-[var(--darkgray)] mt-2">
                    {t("moduleDetails.supportedLanguages")} —
                  </p>
                  <p className="text-xs text-[var(--darkgray)] mt-1">
                    {quizzes.length} {t("moduleDetails.quizzesCount")}
                  </p>
                </div>
                <div className={clsx("flex flex-wrap gap-2", isRtl && "flex-row-reverse")}>
                  <Button
                    as={Link}
                    href={`${basePath}/${moduleId}/quizzes`}
                    radius="full"
                    size="sm"
                    variant="flat"
                    className="text-[var(--blue)]"
                  >
                    {t("moduleDetails.open")}
                  </Button>
                  <Button
                    as={Link}
                    className={primaryButtonClassName}
                    href={`${basePath}/${moduleId}/quizzes/create`}
                    radius="full"
                    size="sm"
                  >
                    {t("moduleDetails.add")}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
