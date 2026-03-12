"use client";

import type { Module } from "@/types/quiz";

import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { useState } from "react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ModuleListPageSkeleton } from "@/components/ui/skeletons";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModules, useDeleteModule } from "@/hooks/useQuiz";
import { getApiErrorMessage } from "@/utils/apiError";

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function moduleDescription(m: Module): string {
  return m.description ?? m.translations?.[0]?.description ?? "";
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5",
};

export default function ModuleListPage() {
  const t = useTranslations("module");
  const tCommon = useTranslations("common");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [listError, setListError] = useState<string | null>(null);

  const { data: modulesRes, isLoading } = useModules({
    category_id: categoryFilter ? Number(categoryFilter) : undefined,
  });
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];

  const deleteModule = useDeleteModule();

  const handleCategoryChange = (keys: unknown) => {
    const v =
      keys === "all" || !keys ? "" : ((Array.from(keys as Iterable<string>)[0] as string) ?? "");

    setCategoryFilter(v);
  };

  const handleDelete = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm(t("deleteConfirm"))) return;
    setListError(null);
    try {
      await deleteModule.mutateAsync(id);
    } catch (err) {
      setListError(
        getApiErrorMessage(err, tCommon, {
          defaultValue: t("deleteError"),
        })
      );
    }
  };

  // Get unique categories from modules
  const categories = Array.from(
    new Map(modules.filter((m) => m.category).map((m) => [m.category!.id, m.category!])).values()
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6", isRtl && "text-right")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--mainblue)]">{t("listTitle")}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{t("listSubtitle")}</p>
              </div>
              <Button
                as={Link}
                className="px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
                href="/dashboard/module/create"
              >
                {t("createNew")}
              </Button>
            </div>

            <Card className="rounded-2xl shadow-none">
              <CardBody className="p-5 flex flex-col gap-4">
                <div
                  className={clsx("flex flex-wrap items-center gap-3", isRtl && "flex-row-reverse")}
                >
                  <span className="text-sm font-medium text-gray-700">{t("filterByCategory")}</span>
                  <Select
                    className="w-48"
                    classNames={{
                      trigger: "h-10 min-h-10 rounded-lg border border-gray-300 text-sm",
                    }}
                    placeholder={t("categoryPlaceholder")}
                    selectedKeys={categoryFilter ? [categoryFilter] : []}
                    onSelectionChange={handleCategoryChange}
                  >
                    {categories.map((cat) => (
                      <SelectItem key={String(cat.id)} textValue={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {listError && (
                  <p className="text-sm text-red-500" role="alert">
                    {listError}
                  </p>
                )}

                {isLoading ? (
                  <ModuleListPageSkeleton />
                ) : modules.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-base font-medium text-gray-700">{t("noModules")}</p>
                    <p className="text-sm text-gray-500 mt-1">{t("noModulesHint")}</p>
                    <Button
                      as={Link}
                      className="mt-4 px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
                      href="/dashboard/module/create"
                    >
                      {t("createNew")}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table removeWrapper aria-label="Modules">
                      <TableHeader>
                        <TableColumn key="code" className="text-sm">
                          Code
                        </TableColumn>
                        <TableColumn key="name" className="text-sm">
                          Name
                        </TableColumn>
                        <TableColumn key="category" className="text-sm">
                          Category
                        </TableColumn>
                        <TableColumn key="difficulty" className="text-sm">
                          Difficulty
                        </TableColumn>
                        <TableColumn key="description" className="text-sm">
                          Description
                        </TableColumn>
                        <TableColumn key="actions" className="text-sm w-24">
                          Actions
                        </TableColumn>
                      </TableHeader>
                      <TableBody items={modules}>
                        {(item: Module) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="text-sm text-gray-900 font-mono">{item.code}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-900 font-medium">
                                {moduleName(item)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {item.category?.name ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {item.difficulty != null
                                  ? (DIFFICULTY_LABELS[item.difficulty] ??
                                    `Level ${item.difficulty}`)
                                  : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                                {moduleDescription(item) || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                className="text-sm"
                                color="danger"
                                isLoading={
                                  deleteModule.isPending && deleteModule.variables === item.id
                                }
                                size="sm"
                                variant="light"
                                onPress={() => handleDelete(item.id)}
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
