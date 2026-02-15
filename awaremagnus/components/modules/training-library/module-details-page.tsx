"use client";

import type { Module, ModuleContent } from "@/types/quiz";
import type { LibraryType } from "./library-page";

import Image from "next/image";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";

import {
  selectClassNames,
  cardClassName,
  breadcrumbLinkClassName,
  inputClassNames,
} from "./shared-styles";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useModule, useContentsByModule, useQuizzesByModule, useModules, useContentsWithQuizzes, useContentsWithProgress } from "@/hooks/useQuiz";
// import { useContentTypes } from "@/hooks/useSuiteAwm";
import { useAuthStore } from "@/hooks/useAuthStore";
import { SUPPORTED_LANGUAGES, getLanguageName, getLanguageCountryCode } from "@/utils/supportedLanguages";
import { getContentTypeIconFor } from "@/utils/contentTypeIcons";
import { isPlatformAdmin, isOrgAdmin, isOrgUser } from "@/utils/roles";
import { SearchIcon } from "@/components/icons";
import { ModuleDetailsSkeleton } from "@/components/ui/skeletons";
import ReactCountryFlag from "react-country-flag";

/** Normalized type name is "interactive lesson" / "ispring" / "interactive content(s)" → do not group (one card per item) */
function isInteractiveLessonType(typeName: string): boolean {
  const n = (typeName ?? "").toLowerCase().trim();

  return (
    n === "interactive lesson" ||
    n === "interactive lessons" ||
    n === "ispring" ||
    n === "interactive content" ||
    n === "interactive contents"
  );
}

function formatCreatedDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);

    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function moduleName(m: Module): string {
  return m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return (
    c.title ?? c.translations?.[0]?.title ?? (c as { name?: string }).name ?? `Content ${c.id}`
  );
}


function languageId(c: ModuleContent): number | undefined {
  return c.language?.id ?? c.translations?.[0]?.language_id;
}

/** Icon box background by content type (match reference design) */
function getIconBgClass(typeName: string): string {
  const n = (typeName ?? "").toLowerCase();

  if (n.includes("interactive") || n === "ispring") return "bg-sky-100";
  if (n.includes("quiz")) return "bg-amber-100";
  if (n.includes("poster")) return "bg-orange-100";
  if (n.includes("video") || n.includes("motion")) return "bg-blue-100";
  if (n.includes("survey")) return "bg-violet-100";
  if (n.includes("game") || n.includes("vr")) return "bg-emerald-100";
  if (n.includes("document") || n.includes("pdf") || n.includes("brochure")) return "bg-gray-100";
  if (n.includes("screen saver")) return "bg-slate-100";

  return "bg-gray-100";
}

type ContentTypeCardItem =
  | {
    kind: "interactive";
    item: ModuleContent;
    typeId: number;
    typeName: string;
  }
  | {
    kind: "grouped";
    typeId: number;
    typeName: string;
    count: number;
    items: ModuleContent[];
  }
  | { kind: "quizzes"; count: number };

type StatusFilter = "all" | "pending" | "completed";

interface ModuleDetailsPageProps {
  moduleId: number;
  libraryType: LibraryType;
}

export function ModuleDetailsPage({ moduleId, libraryType }: ModuleDetailsPageProps) {
  const t = useTranslations("module");
  const tContent = useTranslations("content");
  const { dir } = useI18n();
  const { user } = useAuthStore();
  const roleId = user?.role_id;
  const isRtl = dir === "rtl";
  /** Org User (role 5) = learner view: progress bar, Awareness Campaign breadcrumb */
  const isOrgUserView = isOrgUser(roleId);
  /** Platform admin (1,2) or Org admin (3,4) = admin view: no progress, Training Library › Core Modules */
  const isAdminView = isPlatformAdmin(roleId) || isOrgAdmin(roleId);

  const basePath = `/dashboard/training-library/${libraryType}`;
  const createContentHref = `${basePath}/${moduleId}/content/create`;

  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const tabGroupRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLSpanElement>(null);

  const { data: moduleRes, isLoading: moduleLoading } = useModule(moduleId, !!moduleId);

  // Org User: Need to find campaign ID first
  // We re-use useModules to get assigned modules and find the campaign_id
  const { data: assignedModulesRes } = useModules({
    assigned_only: true,
    status: 1, // Active modules
  });

  const campaignId = useMemo(() => {
    if (!isOrgUserView || !assignedModulesRes?.success) return undefined;
    const modules = assignedModulesRes.data ?? [];
    const currentModule = modules.find((m) => m.id === Number(moduleId));
    // Use the first active assignment's campaign ID
    if (currentModule && currentModule.assignments && currentModule.assignments.length > 0) {
      // prioritizing IN_PROGRESS or NOT_STARTED
      return currentModule.assignments[0].campaign_id;
    }
    return undefined;
  }, [isOrgUserView, assignedModulesRes, moduleId]);

  // Data Fetching based on Role
  const { data: contentsWithQuizzesRes, isLoading: quizzesLoading } = useContentsWithQuizzes(
    moduleId,
    {
      lang_id: languageFilter ? Number(languageFilter) : undefined,
      enabled: isAdminView || (isOrgUserView && !campaignId) // Fallback for Org User if no campaign
    }
  );

  const { data: contentsWithProgressRes, isLoading: progressLoading } = useContentsWithProgress(
    moduleId,
    campaignId!,
    {
      lang_id: languageFilter ? Number(languageFilter) : undefined,
      enabled: isOrgUserView && !!campaignId
    }
  );

  // Unified Data extraction
  const {
    nonAggregatedContents,
    aggregatedContents,
    userProgress,
    quizzesData
  } = useMemo(() => {
    if (isOrgUserView && campaignId && contentsWithProgressRes?.success) {
      const data = contentsWithProgressRes.data;
      return {
        nonAggregatedContents: data.non_aggregated_contents || [],
        aggregatedContents: data.aggregated_contents || {},
        userProgress: data.user_progress_summary,
        quizzesData: null // Quizzes often embedded in non-aggregated or separate
      };
    } else if (contentsWithQuizzesRes?.success) {
      const data = contentsWithQuizzesRes.data;
      return {
        nonAggregatedContents: data.non_aggregated_contents || [],
        aggregatedContents: data.aggregated_contents || {},
        userProgress: null,
        quizzesData: null
      };
    }
    return { nonAggregatedContents: [], aggregatedContents: {}, userProgress: null, quizzesData: null };
  }, [isOrgUserView, campaignId, contentsWithProgressRes, contentsWithQuizzesRes]);


  const moduleData = moduleRes?.success ? moduleRes.data : null;

  const getContentTypeDisplayName = (name: string) => {
    const n = (name ?? "").toLowerCase().trim();
    // Simple mapping or translation key lookup
    if (n.includes("interactive")) return tContent("contentTypes.interactiveContents");
    if (n.includes("video")) return tContent("contentTypes.motionVideos");
    if (n.includes("brochure")) return tContent("contentTypes.brochures");
    if (n.includes("poster")) return tContent("contentTypes.posters");
    if (n.includes("screen saver")) return tContent("contentTypes.screenSavers");
    if (n.includes("game") && !n.includes("vr")) return tContent("contentTypes.games");
    if (n.includes("vr")) return tContent("contentTypes.vrGames");
    if (n.includes("document")) return tContent("contentTypes.documents");
    return name;
  };

  const contentCards = useMemo((): ContentTypeCardItem[] => {
    const cards: ContentTypeCardItem[] = [];

    // 1. Non-Aggregated (Interactive, Videos, Games, VR, Documents) -> One Card Per Item
    nonAggregatedContents.forEach((item: any) => {
      cards.push({
        kind: "interactive", // Using 'interactive' kind for all individual cards for now
        item: item,
        typeId: item.content_type_id,
        typeName: item.content_type
      });
    });

    // 2. Aggregated (Posters, Brochures, Screen Savers, Misc) -> One Card Per Type
    // The API returns aggregated_contents as an object with keys: posters, brochures, etc.
    Object.values(aggregatedContents).forEach((agg: any) => {
      if (agg.total_count > 0) {
        cards.push({
          kind: "grouped",
          typeId: agg.content_type_id,
          typeName: agg.content_type,
          count: agg.total_count,
          // We don't have individual items here, just the summary
          items: []
        });
      }
    });

    // 3. Quizzes (Aggregated count from response or separate check)
    // If using contents-with-progress, we have userProgress.quizzes
    if (userProgress?.quizzes) {
      cards.push({ kind: "quizzes", count: userProgress.quizzes.total });
    }
    // If Admin view, we might need to rely on what the API returns. 
    // The current API response for contents-with-quizzes doesn't explicitly give a global quiz count in root,
    // but individual items have quiz data. 
    // Assuming for now Quizzes are treated as a separate card if we want to list them all, 
    // OR they are attached to content. The requirement said "render quiz card next to that... content".
    // AND "In case of the non aggregated content... render quiz card next to...".

    // Let's stick to the card list for now. The previous implementation had a "Quizzes" card.
    // We can keep it if there are quizzes associated with the module globally.

    return cards;

  }, [nonAggregatedContents, aggregatedContents, userProgress]);

  const filteredContentCards = useMemo(() => {
    if (!searchQuery.trim()) return contentCards;
    const q = searchQuery.toLowerCase().trim();

    return contentCards.filter((card) => {
      if (card.kind === "interactive") {
        return contentTitle(card.item).toLowerCase().includes(q);
      }
      if (card.kind === "grouped") {
        return card.typeName.toLowerCase().includes(q);
      }
      if (card.kind === "quizzes") {
        return t("moduleDetails.quizzes").toLowerCase().includes(q);
      }
      return false;
    });
  }, [contentCards, searchQuery, t, tContent]);

  const allCount = filteredContentCards.length;
  // Progress calculations could be derived from userProgress if available
  const pendingCount = 0;
  const completedCount = 0;

  useEffect(() => {
    const group = tabGroupRef.current;
    const indicator = tabIndicatorRef.current;

    if (!group || !indicator) return;
    const activeBtn = group.querySelector(
      `button[data-status="${statusFilter}"].active`
    ) as HTMLElement | null;

    if (activeBtn) {
      indicator.style.width = `${activeBtn.offsetWidth}px`;
      indicator.style.left = `${activeBtn.offsetLeft}px`;
    }
  }, [statusFilter]);

  const isLoading = moduleLoading || quizzesLoading || progressLoading;

  if (isLoading || !moduleData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div
            className={clsx("p-4 sm:p-6 max-w-5xl mx-auto w-full min-w-0", isRtl && "text-right")}
          >
            <ModuleDetailsSkeleton />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const moduleTitle = moduleName(moduleData);
  const moduleDesc =
    moduleData.description ?? moduleData.translations?.[0]?.description ?? t("moduleDetails.description");

  const breadcrumbFirst = isOrgUserView
    ? t("moduleDetails.breadcrumbAwarenessCampaign")
    : t("moduleDetails.breadcrumbTrainingLibrary");
  const breadcrumbMiddle = isAdminView
    ? t("moduleDetails.coreModules")
    : isOrgUserView
      ? t("moduleDetails.breadcrumbCampaign")
      : t("moduleDetails.breadcrumbMyLibrary");

  const progressPercent = userProgress?.overall_progress_percent || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex gap-4 p-3 min-h-screen", isRtl && "flex-row-reverse")}>
          <div className="flex-1 min-w-0">
            <nav
              className={clsx(
                "flex items-center text-xs text-gray-500 mb-6 gap-1.5 overflow-x-auto",
                isRtl && "flex-row-reverse"
              )}
            >
              <Link className="hover:text-gray-700 transition text-inherit" href={basePath}>
                {breadcrumbFirst}
              </Link>
              <span className="text-gray-400">›</span>
              <Link className={breadcrumbLinkClassName} href={basePath}>
                {breadcrumbMiddle}
              </Link>
              <span className="text-gray-400">›</span>
              <span className="font-semibold text-gray-900">{moduleTitle}</span>
            </nav>

            <div
              className={clsx(
                "flex items-center justify-between mb-4",
                isRtl && "flex-row-reverse"
              )}
            >
              <h1 className="text-xl font-semibold text-gray-900">{moduleTitle}</h1>
              {!isOrgUserView && (
                <Button
                  as={Link}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs font-medium"
                  href={createContentHref}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="12" x2="12" y1="5" y2="19" />
                    <line x1="5" x2="19" y1="12" y2="12" />
                  </svg>
                  <span className="hidden md:inline">{t("moduleDetails.addNewContent")}</span>
                </Button>
              )}
            </div>

            <div
              className={clsx(
                "flex items-center justify-between rounded-xl mb-4 flex-wrap gap-2",
                isRtl && "flex-row-reverse"
              )}
            >
              <div
                ref={tabGroupRef}
                className="relative flex gap-0 bg-white p-1 rounded-full"
                id="tabGroup"
              >
                <span
                  ref={tabIndicatorRef}
                  aria-hidden
                  className="absolute inset-y-1 left-1 rounded-full bg-gray-900 transition-all duration-300"
                  style={{ width: 0 }}
                />
                <button
                  className={clsx(
                    "tab-btn px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10",
                    statusFilter === "all" ? "text-white" : "bg-transparent text-gray-700",
                    statusFilter === "all" && "active"
                  )}
                  data-status="all"
                  type="button"
                  onClick={() => setStatusFilter("all")}
                >
                  {t("moduleDetails.tabAll")}{" "}
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-200",
                      statusFilter === "all"
                        ? "bg-white/30 text-white"
                        : "bg-green-100 text-green-600"
                    )}
                  >
                    {allCount}
                  </span>
                </button>
                {/* 
                  Pending/Completed tabs are visual filters. 
                  In a real implementation, we would filter `filteredContentCards` based on item status (if available).
                */}
                <button
                  className={clsx(
                    "tab-btn px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10",
                    statusFilter === "pending" ? "text-white" : "bg-transparent text-gray-700",
                    statusFilter === "pending" && "active"
                  )}
                  data-status="pending"
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                >
                  {t("moduleDetails.tabPending")}{" "}
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                </button>
                <button
                  className={clsx(
                    "tab-btn px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10",
                    statusFilter === "completed" ? "text-white" : "bg-transparent text-gray-700",
                    statusFilter === "completed" && "active"
                  )}
                  data-status="completed"
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                >
                  {t("moduleDetails.tabCompleted")}{" "}
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold flex items-center justify-center">
                    {completedCount}
                  </span>
                </button>
              </div>

              <div className={clsx("flex items-center gap-2", isRtl && "flex-row-reverse")}>
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
                    aria-label={t("moduleDetails.searchPlaceholder")}
                    classNames={{
                      ...inputClassNames,
                      base: "w-full",
                      inputWrapper: clsx(
                        "rounded-full bg-white border border-gray-200 h-9 min-h-9 focus-within:border-blue-500",
                        isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                      ),
                      input: "text-xs",
                    }}
                    placeholder={t("moduleDetails.searchPlaceholder")}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                </div>
                <div className="w-[140px]">
                  <Select
                    aria-label={t("moduleDetails.languageFilter")}
                    className="w-full"
                    classNames={{
                      ...selectClassNames,
                      trigger: clsx(selectClassNames.trigger, "rounded-full text-xs min-h-9 h-9"),
                    }}
                    placeholder={t("moduleDetails.languageFilter")}
                    selectedKeys={languageFilter ? [languageFilter] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys as Set<string>)[0] ?? "";

                      setLanguageFilter(v);
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={String(lang.id)} textValue={lang.name}>
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={getLanguageCountryCode(lang.id)}
                            style={{
                              fontSize: "1em",
                              lineHeight: "1em",
                            }}
                            svg
                          />
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 w-full min-h-[80vh]">
              {/* Left Side Info Panel */}
              <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 justify-between bg-white rounded-2xl p-4 h-full min-h-[280px]">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">
                    🎉 {t("moduleDetails.welcomeText")}
                  </h2>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{moduleTitle}</h3>

                  {isOrgUserView && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full progress-bar transition-[width] duration-[0.8s] ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex w-full justify-between items-center">
                        <p className="text-[10px] text-gray-500">{t("moduleDetails.progress")}</p>
                        <p className="text-[10px] text-gray-700 font-semibold mt-1">
                          {progressPercent}%
                        </p>
                      </div>
                    </div>
                  )}

                  {isOrgUserView && (
                    <div className="mb-6">
                      <p className="text-xs text-gray-600">{t("moduleDetails.progressHint")}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <h4 className="text-xs font-bold text-gray-900 mb-3">
                      {t("moduleDetails.aboutModule")}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{moduleDesc}</p>
                  </div>
                </div>

                <div>
                  {!isOrgUserView ? (
                    <Button
                      as={Link}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2"
                      href={basePath}
                    >
                      {t("moduleDetails.nextModule")}
                    </Button>
                  ) : (
                    <Button
                      as={Link}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2"
                      // For Org User, maybe link to next module in campaign?
                      href={basePath}
                    >
                      {t("moduleDetails.nextModule")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Side Content List */}
              <div className="col-span-12 lg:col-span-9 flex flex-col justify-between min-h-0">
                <div className="space-y-2 w-full overflow-y-auto flex-1 min-h-0" id="items">
                  {filteredContentCards.map((card, _idx) => {
                    // --- 1. NON-AGGREGATED CONTENT CARD (Interactive, etc.) ---
                    if (card.kind === "interactive") {
                      const { item, typeId, typeName } = card;

                      // For non-aggregated, we go directly to the DETAIL page
                      const detailHref = `${basePath}/${moduleId}/content/${typeId}/${item.content_id ?? item.id}`;
                      const iconPath = getContentTypeIconFor(typeId, typeName);
                      // Use item.language_id or item.language as per new API structure
                      const lid = item.language_id ?? item.language?.id;
                      const createdStr = formatCreatedDate(item.created_date ?? item.created_at);
                      const displayName = getContentTypeDisplayName(typeName);

                      // Check for item specific quiz data (from new API structure)
                      const itemQuizzes = item.quizzes; // { total_count, ... }

                      return (
                        <div key={`interactive-${item.content_id ?? item.id}-${_idx}`} className="flex flex-col gap-2">
                          {/* Main Content Card */}
                          <Card className={cardClassName}>
                            <CardBody className="p-4 flex flex-row items-center gap-3">
                              <div
                                className={clsx(
                                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                                  getIconBgClass(typeName)
                                )}
                              >
                                <Image
                                  alt=""
                                  className="object-contain"
                                  height={24}
                                  src={iconPath}
                                  width={24}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">
                                  {contentTitle(item)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {t("moduleDetails.created")} {createdStr}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {lid != null && (
                                    <div className="flex items-center gap-1" title={getLanguageName(lid)}>
                                      <ReactCountryFlag
                                        countryCode={getLanguageCountryCode(lid)}
                                        style={{ fontSize: "1em", lineHeight: "1em" }}
                                        svg
                                      />
                                      <span className="text-xs text-gray-600">{getLanguageName(lid)}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-600">
                                    1 {displayName.toLowerCase()}
                                  </span>
                                  {item.user_completion_status === 'completed' && (
                                    <span className="pill-btn green text-xs">
                                      {t("moduleDetails.completed")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                as={Link}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold min-w-[88px] px-5"
                                href={detailHref}
                                size="sm"
                              >
                                {t("moduleDetails.start")}
                              </Button>
                            </CardBody>
                          </Card>

                          {/* Linked Quiz Card (if quizzes exist for this content) */}
                          {itemQuizzes && itemQuizzes.total_count > 0 && (
                            <Card className={clsx(cardClassName, "ml-8 border-l-4 border-l-amber-300")}>
                              <CardBody className="p-3 flex flex-row items-center gap-3 bg-amber-50/30">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                  <Image alt="Quiz" height={16} src={getContentTypeIconFor(3, "Quiz")} width={16} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-xs text-gray-900">
                                    {t("moduleDetails.quizzes")}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {itemQuizzes.total_count} {t("moduleDetails.quizzesCount")}
                                  </p>
                                </div>
                                <Button
                                  as={Link}
                                  // TODO: Make sure we have a proper route for quizzes specific to a content item
                                  // Usually /quizzes?content_id=...
                                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-medium min-w-[70px] px-3 h-7"
                                  href={`${basePath}/${moduleId}/quizzes?content_id=${item.content_id ?? item.id}`}
                                  size="sm"
                                >
                                  {t("moduleDetails.start")}
                                </Button>
                              </CardBody>
                            </Card>
                          )}
                        </div>
                      );
                    }

                    // --- 2. AGGREGATED CONTENT CARD (Posters, etc.) ---
                    if (card.kind === "grouped") {
                      const { typeId, typeName, count } = card;
                      // For aggregated, click takes us to LIST page for that type
                      const listHref = `${basePath}/${moduleId}/content/${typeId}`;
                      const iconPath = getContentTypeIconFor(typeId, typeName);
                      const displayName = getContentTypeDisplayName(typeName);

                      return (
                        <Card key={`grouped-${typeId}`} className={cardClassName}>
                          <CardBody className="p-4 flex flex-row items-center gap-3">
                            <div
                              className={clsx(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                                getIconBgClass(typeName)
                              )}
                            >
                              <Image
                                alt=""
                                className="object-contain"
                                height={24}
                                src={iconPath}
                                width={24}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">{displayName}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {/* Date range could go here if we extracted it */}
                                {t("moduleDetails.created")} —
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs text-gray-600">
                                  {count} {displayName}
                                </span>
                              </div>
                            </div>
                            <Button
                              as={Link}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold min-w-[88px] px-5"
                              href={listHref}
                              size="sm"
                            >
                              {t("moduleDetails.viewDetails")}
                            </Button>
                          </CardBody>
                        </Card>
                      );
                    }

                    // --- 3. GENERAL QUIZZES CARD ---
                    if (card.kind === "quizzes") {
                      const quizzesHref = `${basePath}/${moduleId}/quizzes`;
                      const iconPath = getContentTypeIconFor(3, "Quiz");

                      return (
                        <Card key="quizzes-row" className={cardClassName}>
                          <CardBody className="p-4 flex flex-row items-center gap-3">
                            <div
                              className={clsx(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                                getIconBgClass("Quiz")
                              )}
                            >
                              <Image
                                alt=""
                                className="object-contain"
                                height={24}
                                src={iconPath}
                                width={24}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">
                                {t("moduleDetails.quizzes")}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t("moduleDetails.created")} —
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs text-gray-600">
                                  {card.count} {t("moduleDetails.quizzesCount")}
                                </span>
                              </div>
                            </div>
                            <Button
                              as={Link}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-semibold min-w-[88px] px-5"
                              href={quizzesHref}
                              size="sm"
                            >
                              {t("moduleDetails.start")}
                            </Button>
                          </CardBody>
                        </Card>
                      );
                    }

                    return null;
                  })}
                  {filteredContentCards.length === 0 && (
                    <Card className={cardClassName}>
                      <CardBody className="p-6 text-center">
                        <p className="text-sm text-gray-600">{t("moduleDetails.noContent")}</p>
                      </CardBody>
                    </Card>
                  )}
                </div>
                {filteredContentCards.length > 0 && (
                  <p className="text-xs text-gray-600 mt-4">
                    {t("library.paginationShowing")
                      .replace("{from}", "1")
                      .replace("{to}", String(filteredContentCards.length))
                      .replace("{total}", String(filteredContentCards.length))}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  );
}
