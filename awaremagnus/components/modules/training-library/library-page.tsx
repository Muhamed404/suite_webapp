"use client";

import type { Module } from "@/types/quiz";

import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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
import { useModules } from "@/hooks/useQuiz";
import { SUPPORTED_LANGUAGES, getLanguageFlag } from "@/utils/supportedLanguages";
import { EmptyState } from "@/components/ui/empty-state";
import { LibraryPageSkeleton } from "@/components/ui/skeletons";
import {
  inputClassNames,
  selectClassNames,
  primaryButtonClassName,
  cardClassName,
  pageTitleClassName,
  pageSubtitleClassName,
} from "./shared-styles";

export type LibraryType = "system" | "my";

function moduleCode(m: Module): string {
  return m.code ?? `Module ${m.id}`;
}

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function moduleDescription(m: Module): string {
  return m.description ?? m.translations?.[0]?.description ?? "";
}

function moduleLanguageIds(m: Module): number[] {
  const ids = m.translations?.map((t) => t.language_id) ?? [];
  const seen = new Set<number>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

interface LibraryPageProps {
  libraryType: LibraryType;
  title: string;
}

export function LibraryPage({ libraryType, title }: LibraryPageProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const basePath = `/dashboard/training-library/${libraryType}`;
  const createModulePath = `${basePath}/module/create`;

  const [filterType, setFilterType] = useState<"all" | "modules">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: modulesRes, isLoading } = useModules({
    status: 1,
    category_id: categoryFilter ? Number(categoryFilter) : undefined,
    lang_id: languageFilter ? Number(languageFilter) : undefined,
  });
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];

  const filteredModules = searchQuery.trim()
    ? modules.filter(
        (m) =>
          moduleCode(m).toLowerCase().includes(searchQuery.toLowerCase()) ||
          moduleName(m).toLowerCase().includes(searchQuery.toLowerCase()) ||
          moduleDescription(m).toLowerCase().includes(searchQuery.toLowerCase()),
      )
  : modules;

  const categories = Array.from(
    new Map(
      modules
        .filter((m) => m.category)
        .map((m) => [m.category!.id, m.category!]),
    ).values(),
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-4 sm:p-6 max-w-7xl mx-auto w-full min-w-0", isRtl && "text-right")}>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <h1 className={pageTitleClassName}>{title}</h1>
              <p className={clsx(pageSubtitleClassName, "mt-1")}>
                {t("library.description")}
              </p>
            </div>

            <div
              className={clsx(
                "flex flex-wrap items-center gap-3 sm:gap-4",
                isRtl && "flex-row-reverse",
              )}
            >
              <div className="flex rounded-full border border-[var(--strokeGray)] bg-white p-0.5 shrink-0">
                <Button
                  size="sm"
                  radius="full"
                  variant={filterType === "all" ? "solid" : "light"}
                  className={
                    filterType === "all"
                      ? "bg-[var(--blue)] text-white min-w-20"
                      : "min-w-20"
                  }
                  onPress={() => setFilterType("all")}
                >
                  {t("library.filterAll")}
                </Button>
                <Button
                  size="sm"
                  radius="full"
                  variant={filterType === "modules" ? "solid" : "light"}
                  className={
                    filterType === "modules"
                      ? "bg-[var(--blue)] text-white min-w-20"
                      : "min-w-20"
                  }
                  onPress={() => setFilterType("modules")}
                >
                  {t("library.filterModules")}
                </Button>
              </div>
              <Input
                classNames={{
                  ...inputClassNames,
                  base: "w-full min-w-0 sm:max-w-64",
                }}
                placeholder={t("library.searchPlaceholder") ?? "Search here..."}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <Select
                className="w-full min-w-0 sm:max-w-44"
                classNames={selectClassNames}
                aria-label={t("library.category")}
                placeholder={t("library.allCategories")}
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                onSelectionChange={(keys) => {
                  const v = Array.from(keys as Set<string>)[0] ?? "";
                  setCategoryFilter(v);
                }}
              >
                {categories.map((cat) => (
                  <SelectItem key={String(cat.id)} textValue={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </Select>
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
              <div
                className={clsx(
                  "flex items-center gap-2 w-full sm:w-auto sm:ml-auto",
                  isRtl && "sm:ml-0 sm:mr-auto",
                )}
              >
                <span className="text-sm text-[var(--darkgray)] shrink-0">Views</span>
                <div className="flex rounded-full border border-[var(--strokeGray)] bg-white p-0.5">
                  <Button
                    size="sm"
                    radius="full"
                    variant={viewMode === "list" ? "solid" : "light"}
                    className={
                      viewMode === "list"
                        ? "bg-[var(--blue)] text-white min-w-24"
                        : "min-w-24"
                    }
                    onPress={() => setViewMode("list")}
                  >
                    {t("library.viewList")}
                  </Button>
                  <Button
                    size="sm"
                    radius="full"
                    variant={viewMode === "grid" ? "solid" : "light"}
                    className={
                      viewMode === "grid"
                        ? "bg-[var(--blue)] text-white min-w-24"
                        : "min-w-24"
                    }
                    onPress={() => setViewMode("grid")}
                  >
                    {t("library.viewGrid")}
                  </Button>
                </div>
              </div>
              <Button
                as={Link}
                className={clsx(primaryButtonClassName, "w-full sm:w-auto shrink-0")}
                href={createModulePath}
                radius="full"
                size="md"
              >
                {t("library.addNew")}
              </Button>
            </div>

            {isLoading ? (
              <LibraryPageSkeleton viewMode={viewMode} />
            ) : filteredModules.length === 0 ? (
              <EmptyState
                title={t("library.emptyTitle")}
                description={t("library.emptyDescription")}
                action={
                  <Button
                    as={Link}
                    className={primaryButtonClassName}
                    href={createModulePath}
                    radius="full"
                    size="md"
                  >
                    {t("library.addNew")}
                  </Button>
                }
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredModules.map((item: Module) => (
                  <Card key={item.id} className={cardClassName}>
                    <CardBody className="p-5">
                      <div className="aspect-square bg-[var(--gray)] rounded-2xl flex items-center justify-center text-[var(--darkgray)] text-sm mb-4">
                        LOGO
                      </div>
                      <h3 className="font-semibold text-[var(--mainblue)] truncate">
                        {moduleCode(item)}
                      </h3>
                      {item.category?.name && (
                        <p className="text-sm text-[var(--darkgray)] mt-1 truncate">
                          {item.category.name}
                        </p>
                      )}
                      <div
                        className={clsx(
                          "flex flex-wrap gap-1 mt-2",
                          isRtl && "flex-row-reverse",
                        )}
                        aria-label={t("library.language")}
                      >
                        {moduleLanguageIds(item).map((langId) => (
                          <span key={langId} className="text-lg leading-none" title={getLanguageFlag(langId)}>
                            {getLanguageFlag(langId)}
                          </span>
                        ))}
                      </div>
                      <div
                        className={clsx(
                          "flex gap-2 mt-4",
                          isRtl && "flex-row-reverse",
                        )}
                      >
                        <Button
                          as={Link}
                          className="text-[var(--blue)]"
                          href={`${basePath}/${item.id}`}
                          radius="full"
                          size="sm"
                          variant="flat"
                        >
                          {t("library.viewDetails")}
                        </Button>
                        <Button
                          as={Link}
                          href={`${basePath}/${item.id}`}
                          radius="full"
                          size="sm"
                          variant="bordered"
                          className="border-[var(--strokeGray)]"
                        >
                          {t("library.edit")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={cardClassName}>
                <CardBody className="p-0 overflow-x-auto">
                  <Table removeWrapper aria-label="Modules" className="min-w-[640px]">
                    <TableHeader>
                      <TableColumn key="#">#</TableColumn>
                      <TableColumn key="name">{t("library.moduleName")}</TableColumn>
                      <TableColumn key="description">Description</TableColumn>
                      <TableColumn key="category">{t("library.category")}</TableColumn>
                      <TableColumn key="language">{t("library.language")}</TableColumn>
                      <TableColumn key="thumbnail">{t("library.thumbnail")}</TableColumn>
                      <TableColumn key="contents">{t("library.contents")}</TableColumn>
                      <TableColumn key="change">{t("library.change")}</TableColumn>
                    </TableHeader>
                    <TableBody items={filteredModules}>
                      {(item: Module) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-[var(--darkgray)]">
                            {filteredModules.indexOf(item) + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              className="text-[var(--blue)] hover:underline font-medium text-sm"
                              href={`${basePath}/${item.id}`}
                            >
                              {moduleCode(item)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[var(--darkgray)] line-clamp-2 max-w-xs">
                              {moduleDescription(item) || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[var(--darkgray)]">
                              {item.category?.name ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm flex flex-wrap gap-0.5">
                              {moduleLanguageIds(item).map((langId) => (
                                <span key={langId} className="leading-none" title={getLanguageFlag(langId)}>
                                  {getLanguageFlag(langId)}
                                </span>
                              ))}
                              {moduleLanguageIds(item).length === 0 && "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[var(--darkgray)]">—</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              as={Link}
                              href={`${basePath}/${item.id}`}
                              radius="full"
                              size="sm"
                              variant="light"
                            >
                              {t("library.viewDetails")}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              as={Link}
                              href={`${basePath}/${item.id}`}
                              radius="full"
                              size="sm"
                              variant="light"
                            >
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

            {filteredModules.length > 0 && (
              <p className={clsx(pageSubtitleClassName, "text-center")}>
                {t("library.pagination")} 1 ... 10
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
