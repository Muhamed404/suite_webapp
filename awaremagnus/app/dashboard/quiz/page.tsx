"use client";

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
import {
  useQuizzes,
  useQuizzesByContent,
  useModules,
  useContentsByModule,
  useDeleteQuiz,
} from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Module, ModuleContent, Quiz } from "@/types/quiz";

const QUIZ_TYPE_LABELS: Record<number, string> = {
  1: "Single Choice",
  2: "Multiple Choice",
  3: "True/False",
};

function moduleName(m: Module): string {
  const t = m.translations?.[0];
  return t?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  const t = c.translations?.[0];
  return t?.title ?? `Content ${c.id}`;
}

export default function QuizListPage() {
  const t = useTranslations("quiz");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [contentFilter, setContentFilter] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("");
  const [listError, setListError] = useState<string | null>(null);

  const { data: modulesRes } = useModules({ status: 1 });
  const modules = modulesRes?.success ? modulesRes.data ?? [] : [];

  const { data: contentsRes } = useContentsByModule(
    moduleId ? Number(moduleId) : 0,
    !!moduleId
  );
  const contents = contentsRes?.success ? contentsRes.data ?? [] : [];

  const allQuizzes = useQuizzes(
    contentFilter ? { contentId: Number(contentFilter) } : undefined
  );
  const byContent = useQuizzesByContent(
    contentFilter ? Number(contentFilter) : 0,
    !!contentFilter
  );

  const quizzesQuery = contentFilter ? byContent : allQuizzes;
  const quizzes: Quiz[] =
    quizzesQuery.data?.success && Array.isArray(quizzesQuery.data?.data)
      ? (quizzesQuery.data.data as Quiz[])
      : [];

  const deleteQuiz = useDeleteQuiz();

  const handleModuleChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
    setModuleId(v);
    setContentFilter("");
  };

  const handleContentChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys
        ? ""
        : (Array.from(keys as Iterable<string>)[0] as string) ?? "";
    setContentFilter(v);
  };

  const handleDelete = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm(t("deleteConfirm")))
      return;
    setListError(null);
    try {
      await deleteQuiz.mutateAsync(id);
    } catch (err) {
      setListError(
        getApiErrorMessage(err, tCommon, {
          defaultValue: t("deleteError"),
        })
      );
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6", isRtl && "text-right")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--mainblue)]">
                  {t("listTitle")}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t("listSubtitle")}
                </p>
              </div>
              <Button
                as={Link}
                href="/dashboard/quiz/create"
                className="px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
              >
                {t("createNew")}
              </Button>
            </div>

            <Card className="rounded-2xl shadow-none">
              <CardBody className="p-5 flex flex-col gap-4">
                <div
                  className={clsx(
                    "flex flex-wrap items-center gap-3",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {t("filterByContent")}
                  </span>
                  <Select
                    placeholder={t("modulePlaceholder")}
                    selectedKeys={moduleId ? [moduleId] : []}
                    onSelectionChange={handleModuleChange}
                    className="w-48"
                    classNames={{
                      trigger:
                        "h-10 min-h-10 rounded-lg border border-gray-300 text-sm",
                    }}
                  >
                    {modules.map((m) => (
                      <SelectItem key={String(m.id)} textValue={moduleName(m)}>
                        {moduleName(m)}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    placeholder={t("contentPlaceholder")}
                    selectedKeys={contentFilter ? [contentFilter] : []}
                    onSelectionChange={handleContentChange}
                    isDisabled={!moduleId}
                    className="w-56"
                    classNames={{
                      trigger:
                        "h-10 min-h-10 rounded-lg border border-gray-300 text-sm",
                    }}
                  >
                    {contents.map((c) => (
                      <SelectItem key={String(c.id)} textValue={contentTitle(c)}>
                        {contentTitle(c)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {listError && (
                  <p className="text-sm text-red-500" role="alert">
                    {listError}
                  </p>
                )}

                {quizzesQuery.isLoading ? (
                  <p className="text-sm text-gray-500 py-8">{t("loading")}</p>
                ) : quizzes.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-base font-medium text-gray-700">
                      {t("noQuizzes")}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("noQuizzesHint")}
                    </p>
                    <Button
                      as={Link}
                      href="/dashboard/quiz/create"
                      className="mt-4 px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
                    >
                      {t("createNew")}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table aria-label="Quizzes" removeWrapper>
                      <TableHeader>
                        <TableColumn key="question" className="text-sm">
                          Question
                        </TableColumn>
                        <TableColumn key="type" className="text-sm">
                          Type
                        </TableColumn>
                        <TableColumn key="content" className="text-sm">
                          Content ID
                        </TableColumn>
                        <TableColumn key="actions" className="text-sm w-24">
                          Actions
                        </TableColumn>
                      </TableHeader>
                      <TableBody items={quizzes}>
                        {(item: Quiz) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                                {item.question || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {QUIZ_TYPE_LABELS[item.quiz_type_id] ??
                                  `Type ${item.quiz_type_id}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">
                                {item.mod_content_id}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDelete(item.id)}
                                isLoading={
                                  deleteQuiz.isPending &&
                                  deleteQuiz.variables === item.id
                                }
                                className="text-sm"
                              >
                                {t("delete")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
