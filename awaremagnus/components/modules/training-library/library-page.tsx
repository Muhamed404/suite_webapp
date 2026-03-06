"use client";

import type { Module } from "@/types/quiz";

import Link from "next/link";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/drawer";

import { inputClassNames, selectClassNames, cardClassName } from "./shared-styles";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModules } from "@/hooks/useQuiz";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isPlatformAdmin } from "@/utils/roles";
import { SUPPORTED_LANGUAGES } from "@/utils/supportedLanguages";
import { useAwmCategories } from "@/hooks/useSuiteAwm";
import { LibraryPageSkeleton } from "@/components/ui/skeletons";
import { getContentAssetUrl, getModuleAssetUrl } from "@/utils/contentAssetUrl";
import {
  SearchIcon,
  PlusIcon,
  LayoutGridIcon,
  ListIcon,
  SearchXIcon,
  FilterIcon,
  EditIcon,
  EyeIcon,
} from "@/components/icons";

export type LibraryType = "system" | "my";

const PAGE_SIZE = 10;

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

function getModuleLogoUrl(module: Module, selectedLanguageId: string | number | null): string {
  const defaultLogo = getContentAssetUrl("/awm/images/Card.png");

  if (!selectedLanguageId) {
    const url = module.translations?.[0]?.logo_banner_url;

    return url ? getModuleAssetUrl(url) : defaultLogo;
  }

  const match = module.translations?.find(
    (t) => String(t.language_id) === String(selectedLanguageId)
  );

  return match?.logo_banner_url ? getModuleAssetUrl(match.logo_banner_url) : defaultLogo;
}

interface LibraryPageProps {
  libraryType: LibraryType;
  title: string;
}

export function LibraryPage({ libraryType, title }: LibraryPageProps) {
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const isPlatform = isPlatformAdmin(user?.role_id);
  const canManage = libraryType === "my" || (libraryType === "system" && isPlatform);

  const basePath = `/dashboard/training-library/${libraryType}`;
  const createModulePath = `${basePath}/module/create`;

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "description" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const pathname = usePathname();
  const filter = pathname?.includes("/training-library/my") ? "my_module" : "global_module";

  const { data: modulesRes, isLoading } = useModules({
    category_id: categoryFilter ? Number(categoryFilter) : undefined,
    lang_id: languageFilter ? Number(languageFilter) : undefined,
    filter,
  });
  const modules = modulesRes?.success ? (modulesRes.data ?? []) : [];
  const { data: categories = [] } = useAwmCategories();

  const filteredModules = useMemo(() => {
    let list = searchQuery.trim()
      ? modules.filter(
          (m) =>
            moduleCode(m).toLowerCase().includes(searchQuery.toLowerCase()) ||
            moduleName(m).toLowerCase().includes(searchQuery.toLowerCase()) ||
            moduleDescription(m).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : modules;

    if (sortField) {
      list = [...list].sort((a, b) => {
        const va = sortField === "name" ? moduleName(a) : moduleDescription(a);
        const vb = sortField === "name" ? moduleName(b) : moduleDescription(b);
        const c = va.localeCompare(vb);

        return sortDir === "asc" ? c : -c;
      });
    }

    return list;
  }, [modules, searchQuery, sortField, sortDir]);

  const totalItems = filteredModules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalItems);
  const paginatedModules = filteredModules.slice(start, end);

  const paginationText =
    totalItems === 0
      ? t("library.paginationShowing", { from: 0, to: 0, total: 0 })
      : t("library.paginationShowing", { from: start + 1, to: end, total: totalItems });

  const handleSort = (field: "name" | "description") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-3 max-w-[1600px] mx-auto w-full min-w-0", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className={clsx(
              "flex items-center text-xs text-gray-500 mb-6 gap-1.5",
              isRtl && "flex-row-reverse"
            )}
          >
            <Link className="hover:text-gray-700 transition-colors" href={basePath}>
              Awareness Library
            </Link>
            <span aria-hidden className="text-gray-400">
              ›
            </span>
            <span className="font-semibold text-gray-900">{title}</span>
          </nav>

          {/* Header: title + Add button */}
          <div className="flex flex-col mb-3">
            <div
              className={clsx(
                "flex items-center justify-between gap-3 flex-wrap",
                isRtl && "flex-row-reverse"
              )}
            >
              <div>
                <h3 className="text-xl font-semibold text-[var(--mainblue)]">{t("listTitle")}</h3>
                <p className="text-xs text-gray-500 mt-1">{t("library.description")}</p>
              </div>
              {canManage && (
                <Button
                  as={Link}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 min-h-0 h-9"
                  href={createModulePath}
                  radius="full"
                >
                  <PlusIcon className="size-3 shrink-0" />
                  <span className="hidden md:inline">{t("library.addNew")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Toolbar: All Modules header (left), Search + Filter + View toggle (right) */}
          <div
            className={clsx(
              "flex flex-wrap items-center justify-between gap-3 p-4 rounded-t-xl bg-white border border-gray-200 border-b-0",
              isRtl && "flex-row-reverse"
            )}
          >
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t("library.allModules")}
            </span>
            <div
              className={clsx(
                "flex flex-wrap gap-2 items-center",
                isRtl ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Search - same as HTML: w-64, rounded-full */}
              <div className="relative w-64 max-w-full">
                <span
                  aria-hidden
                  className={clsx(
                    "absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10",
                    isRtl ? "right-4" : "left-4"
                  )}
                >
                  <SearchIcon className="size-4" />
                </span>
                <Input
                  aria-label={t("library.searchPlaceholder")}
                  classNames={{
                    ...inputClassNames,
                    base: "w-full",
                    inputWrapper: clsx(
                      "rounded-full bg-white border border-gray-200 h-9 min-h-9 data-[focus=true]:border-blue-500",
                      isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                    ),
                    input: "text-xs",
                  }}
                  placeholder={t("library.searchPlaceholder") ?? "Search modules..."}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
              </div>
              {/* Filter icon - opens drawer */}
              <Button
                isIconOnly
                aria-label={t("library.filterDrawerTitle")}
                className="min-w-9 w-9 h-9 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                radius="full"
                size="md"
                variant="flat"
                onPress={() => setFilterDrawerOpen(true)}
              >
                <FilterIcon className="size-4" />
              </Button>
              {/* View toggle: sliding indicator (Grid / Table) */}
              <div
                className={clsx(
                  "flex items-center gap-1 rounded-full bg-[#f1f5f8] px-1 py-1 relative z-40",
                  isRtl && "flex-row-reverse"
                )}
              >
                <div
                  className="absolute rounded-full bg-[var(--mainblue)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] top-1 h-[calc(100%-8px)] w-[calc(50%-4px)]"
                  style={{ left: viewMode === "grid" ? 4 : "calc(50% + 2px)" }}
                />
                <Button
                  className={clsx(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition relative z-10 min-h-0 h-7",
                    viewMode === "grid" ? "text-white" : "text-gray-700"
                  )}
                  radius="full"
                  size="sm"
                  variant="light"
                  onPress={() => setViewMode("grid")}
                >
                  <LayoutGridIcon className="size-4" />
                  {t("library.viewGrid")}
                </Button>
                <Button
                  className={clsx(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition relative z-10 min-h-0 h-7",
                    viewMode === "list" ? "text-white" : "text-gray-700"
                  )}
                  radius="full"
                  size="sm"
                  variant="light"
                  onPress={() => setViewMode("list")}
                >
                  <ListIcon className="size-4" />
                  {t("library.viewList")}
                </Button>
              </div>
            </div>
          </div>

          {/* Filter drawer: Category & Language - field size same as search */}
          <Drawer
            isOpen={filterDrawerOpen}
            placement={isRtl ? "left" : "right"}
            onClose={() => setFilterDrawerOpen(false)}
          >
            <DrawerContent>
              <DrawerHeader className="border-b border-gray-200">
                <span className="text-base font-semibold text-[var(--mainblue)]">
                  {t("library.filterDrawerTitle")}
                </span>
              </DrawerHeader>
              <DrawerBody className="p-4 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-700">
                    {t("library.category")}
                  </label>
                  <Select
                    aria-label={t("library.category")}
                    className="w-full"
                    classNames={{
                      ...selectClassNames,
                      trigger:
                        "rounded-full bg-white border border-gray-200 h-9 min-h-9 data-[hover=true]:border-[var(--blue)] data-[focus=true]:border-[var(--blue)]",
                      value: "text-xs",
                    }}
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
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-700">
                    {t("library.language")}
                  </label>
                  <Select
                    aria-label={t("library.language")}
                    className="w-full"
                    classNames={{
                      ...selectClassNames,
                      trigger:
                        "rounded-full bg-white border border-gray-200 h-9 min-h-9 data-[hover=true]:border-[var(--blue)] data-[focus=true]:border-[var(--blue)]",
                      value: "text-xs",
                    }}
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
                </div>
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Content card: white, rounded-b-xl, scrollable */}
          <div className="bg-white rounded-b-xl overflow-hidden shadow-sm border border-gray-200">
            <div
              className="overflow-x-auto overflow-y-auto relative"
              style={{ minHeight: 400, height: "55vh" }}
            >
              {isLoading ? (
                <div className="p-4">
                  <LibraryPageSkeleton viewMode={viewMode} />
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center py-12 px-4">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchXIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {t("library.emptyTitle")}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">{t("library.emptyDescription")}</p>
                    {canManage && (
                      <Button
                        as={Link}
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs font-medium mx-auto"
                        href={createModulePath}
                        radius="full"
                      >
                        <PlusIcon className="size-3" />
                        {t("library.addNew")}
                      </Button>
                    )}
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                  {paginatedModules.map((item: Module) => (
                    <Card key={item.id} className={cardClassName} shadow="sm">
                      <CardBody className="p-3 flex flex-col bg-white">
                        {/* Thumbnail: language-specific logo or default */}
                        <div className="rounded-xl h-40 overflow-hidden mb-3 w-full bg-gray-100 flex items-center justify-center shrink-0 relative">
                          <img
                            alt=""
                            className="w-full h-full object-cover object-center"
                            src={getModuleLogoUrl(item, languageFilter)}
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;

                              el.style.display = "none";
                              el.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <img
                            aria-hidden
                            alt=""
                            className="absolute inset-0 m-auto w-12 h-12 object-contain opacity-60 hidden"
                            src={getContentAssetUrl("/images/Icon_Template.svg")}
                          />
                        </div>
                        <h3 className="font-semibold text-[var(--mainblue)] text-sm truncate">
                          {moduleName(item)}
                        </h3>
                        <p className="text-xs text-[var(--darkgray)] mt-1 line-clamp-2 min-h-0 flex-1">
                          {moduleDescription(item) || "—"}
                        </p>
                        <div
                          className={clsx("flex justify-start mt-4", isRtl && "flex-row-reverse")}
                        >
                          <Button
                            as={Link}
                            className="border border-gray-500 bg-white text-[var(--mainblue)] text-xs font-medium rounded-lg px-4 py-1 mt-4 flex items-center gap-1.5 hover:bg-gray-50"
                            href={`${basePath}/${item.id}`}
                            size="sm"
                            variant="bordered"
                          >
                            {canManage ? (
                              <>
                                <EditIcon className="size-3.5 shrink-0" />
                                {t("library.edit")}
                              </>
                            ) : (
                              <>
                                <EyeIcon className="size-3.5 shrink-0" />
                                {t("library.view")}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table
                  removeWrapper
                  aria-label="Modules"
                  className="min-w-[640px] text-xs"
                  classNames={{
                    th: "px-4 py-3.5 bg-gray-50 text-gray-600 sticky top-0 z-10",
                    td: "px-4 py-3.5",
                  }}
                >
                  <TableHeader>
                    <TableColumn className="w-16 bg-gray-50 text-gray-600 font-semibold whitespace-nowrap">
                      {t("library.thumbnail")}
                    </TableColumn>
                    <TableColumn className="bg-gray-50 text-gray-600 font-semibold whitespace-nowrap">
                      <button
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors -m-2 p-2 rounded"
                        type="button"
                        onClick={() => handleSort("name")}
                      >
                        <span>{t("library.moduleName")}</span>
                        <span className="text-gray-400 inline-flex">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </span>
                      </button>
                    </TableColumn>
                    <TableColumn className="bg-gray-50 text-gray-600 font-semibold whitespace-nowrap">
                      <button
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors -m-2 p-2 rounded"
                        type="button"
                        onClick={() => handleSort("description")}
                      >
                        <span>{t("library.moduleDescription")}</span>
                        <span className="text-gray-400 inline-flex">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </span>
                      </button>
                    </TableColumn>
                    <TableColumn className="w-32 bg-gray-50 text-gray-600 font-semibold whitespace-nowrap">
                      {t("library.action")}
                    </TableColumn>
                  </TableHeader>
                  <TableBody items={paginatedModules}>
                    {(item: Module) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-16 align-middle">
                          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-gray-100">
                            <img
                              alt=""
                              className="w-full h-full object-cover"
                              src={getModuleLogoUrl(item, languageFilter)}
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;

                                el.style.display = "none";
                                el.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                            <img
                              aria-hidden
                              alt=""
                              className="absolute inset-0 m-auto w-5 h-5 object-contain opacity-90 hidden"
                              src={getContentAssetUrl("/images/Icon_Template.svg")}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-[var(--mainblue)]">
                            {moduleName(item)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[var(--darkgray)] line-clamp-2 max-w-xs">
                            {moduleDescription(item) || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div
                            className={clsx(
                              "flex items-center justify-start",
                              isRtl && "flex-row-reverse"
                            )}
                          >
                            <Button
                              as={Link}
                              className="border border-gray-500 bg-white text-[var(--mainblue)] text-xs font-medium rounded-lg px-4 py-1 mt-4 flex items-center gap-1.5 hover:bg-gray-50"
                              href={`${basePath}/${item.id}`}
                              size="sm"
                              variant="bordered"
                            >
                              {canManage ? (
                                <>
                                  <EditIcon className="size-3.5 shrink-0" />
                                  {t("library.edit")}
                                </>
                              ) : (
                                <>
                                  <EyeIcon className="size-3.5 shrink-0" />
                                  {t("library.view")}
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            <div
              className={clsx(
                "flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t border-gray-200 bg-gray-50 gap-3",
                isRtl && "flex-row-reverse"
              )}
            >
              <div className="text-[10px] text-gray-500 font-medium">{paginationText}</div>
              <div className="flex gap-1.5">
                <Button
                  className="min-w-8 w-8 h-8 min-h-0 border border-gray-200 bg-white text-gray-700"
                  isDisabled={page <= 1}
                  radius="md"
                  size="sm"
                  variant="flat"
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;

                  return (
                    <Button
                      key={p}
                      className={
                        page === p
                          ? "min-w-8 w-8 h-8 min-h-0 bg-sky-500 text-white"
                          : "min-w-8 w-8 h-8 min-h-0 border border-gray-200 bg-white text-gray-700"
                      }
                      radius="md"
                      size="sm"
                      variant={page === p ? "solid" : "flat"}
                      onPress={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  className="min-w-8 w-8 h-8 min-h-0 border border-gray-200 bg-white text-gray-700"
                  isDisabled={page >= totalPages}
                  radius="md"
                  size="sm"
                  variant="flat"
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
