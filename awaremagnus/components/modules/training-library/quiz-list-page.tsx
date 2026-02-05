"use client";

import type { Module, Quiz } from "@/types/quiz";

import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useState } from "react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useQuizzesByModule, useQuizTypes } from "@/hooks/useQuiz";
import type { LibraryType } from "./library-page";
import { EmptyState } from "@/components/ui/empty-state";
import { QuizListSkeleton } from "@/components/ui/skeletons";
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

interface QuizListPageProps {
  moduleId: number;
  libraryType: LibraryType;
}

export function QuizListPage({ moduleId, libraryType }: QuizListPageProps) {
  const t = useTranslations("quiz");
  const tModule = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const libraryLabel =
    libraryType === "system" ? "System Library" : "My Library";
  const createPath = `${basePath}/${moduleId}/quizzes/create`;

  const [quizTypeFilter, setQuizTypeFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");

  const { data: moduleRes } = useModule(moduleId, !!moduleId);
  const { data: quizzesRes, isLoading } = useQuizzesByModule(
    moduleId,
    !!moduleId,
  );
  const { data: quizTypesRes } = useQuizTypes();

  const module = moduleRes?.success ? moduleRes.data : null;
  const allQuizzes: Quiz[] =
    quizzesRes?.success && Array.isArray(quizzesRes.data)
      ? (quizzesRes.data as Quiz[])
      : [];
  const quizTypes = quizTypesRes?.success ? (quizTypesRes.data ?? []) : [];
  const quizzes =
    quizTypeFilter && quizTypeFilter !== "all"
      ? allQuizzes.filter(
          (q) =>
            String(q.quiz_type_id ?? (q as { qtype_id?: number }).qtype_id) === quizTypeFilter,
        )
      : allQuizzes;

  if (!module) return null;

  const moduleTitle = moduleName(module);

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
            <Link className={breadcrumbLinkClassName} href={`${basePath}/${moduleId}`}>
              {moduleTitle}
            </Link>
            <span className="text-[var(--darkgray)]">›</span>
            <span className="font-medium text-[var(--mainblue)]">{t("listTitle")}</span>
          </nav>

          <h1 className={clsx(pageTitleClassName, "mb-5")}>{t("listTitle")}</h1>

          <div
            className={clsx(
              "flex flex-wrap items-center gap-3 sm:gap-4 mb-5",
              isRtl && "flex-row-reverse",
            )}
          >
            <span className="text-sm font-medium text-[var(--mainblue)] w-full sm:w-auto">
              Filter by Quiz Type
            </span>
            <Select
              className="w-full min-w-0 sm:max-w-44"
              classNames={selectClassNames}
              placeholder="All"
              selectedKeys={quizTypeFilter === "" ? ["all"] : [quizTypeFilter]}
              onSelectionChange={(keys) => {
                const v = Array.from(keys as Set<string>)[0] ?? "all";
                setQuizTypeFilter(v === "all" ? "" : v);
              }}
            >
              <SelectItem key="all" textValue="All">
                All
              </SelectItem>
              {quizTypes.map((qt) => (
                <SelectItem key={String(qt.id)} textValue={qt.name ?? ""}>
                  {qt.name ?? `Type ${qt.id}`}
                </SelectItem>
              ))}
            </Select>
            <Button
              as={Link}
              className={clsx(primaryButtonClassName, "w-full sm:w-auto shrink-0")}
              href={createPath}
              radius="full"
              size="md"
            >
              {t("createNew")}
            </Button>
          </div>

          {isLoading ? (
            <QuizListSkeleton />
          ) : quizzes.length === 0 ? (
            <EmptyState
              title={t("noQuizzes")}
              description={t("noQuizzesHint")}
              action={
                <Button
                  as={Link}
                  className={primaryButtonClassName}
                  href={createPath}
                  radius="full"
                  size="md"
                >
                  {t("createNew")}
                </Button>
              }
            />
          ) : (
            <Card className={cardClassName}>
              <CardBody className="p-0 overflow-x-auto">
                <Table removeWrapper aria-label="Quizzes" className="min-w-[520px]">
                  <TableHeader>
                    <TableColumn key="#">#</TableColumn>
                    <TableColumn key="type">Quiz Type</TableColumn>
                    <TableColumn key="language">Language</TableColumn>
                    <TableColumn key="question">Question</TableColumn>
                    <TableColumn key="actions">Actions</TableColumn>
                  </TableHeader>
                  <TableBody items={quizzes}>
                    {(item: Quiz) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-[var(--darkgray)]">{quizzes.indexOf(item) + 1}</TableCell>
                        <TableCell>
                          <span className="text-sm text-[var(--darkgray)]">
                            {item.quizType?.name ??
                              quizTypes.find(
                                (qt) => qt.id === (item.quiz_type_id ?? (item as { qtype_id?: number }).qtype_id),
                              )?.name ??
                              "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-[var(--darkgray)]">EN</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-[var(--mainblue)] line-clamp-2 max-w-md">
                            {item.question || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            as={Link}
                            href={`${basePath}/${moduleId}/quizzes/${item.id}/edit`}
                            radius="full"
                            size="sm"
                            variant="flat"
                            className="text-[var(--blue)]"
                          >
                            {tModule("library.edit")}
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
