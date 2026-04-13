"use client";

import type { Module, ModuleContent } from "@/types/quiz";
import type { LibraryType } from "./library-page";

import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";
import ReactCountryFlag from "react-country-flag";

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
import {
  useModule,
  useModules,
  useContentsWithQuizzes,
  useContentsWithProgress,
} from "@/hooks/useQuiz";
// import { useContentTypes } from "@/hooks/useSuiteAwm";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  SUPPORTED_LANGUAGES,
  getLanguageName,
  getLanguageCountryCode,
} from "@/utils/supportedLanguages";
import { getModuleAssetUrl } from "@/utils/contentAssetUrl";
import { isPlatformAdmin, isOrgAdmin, isOrgUser } from "@/utils/roles";
import { SearchIcon } from "@/components/icons";
import { ModuleDetailsSkeleton } from "@/components/ui/skeletons";

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

function moduleName(m: Module, selectedLanguageId: string): string {
  const translation = selectedLanguageId
    ? m.translations?.find((tr) => String(tr.language_id) === selectedLanguageId)
    : m.translations?.[0];

  return translation?.name ?? m.title ?? m.translations?.[0]?.name ?? m.code ?? `Module ${m.id}`;
}

function contentTitle(c: ModuleContent): string {
  return (
    c.title ?? c.translations?.[0]?.title ?? (c as { name?: string }).name ?? `Content ${c.id}`
  );
}

function languageId(c: ModuleContent): number | undefined {
  return c.language?.id ?? c.translations?.[0]?.language_id;
}

/** Get emoji icon for content type (match reference design) */
function getContentTypeEmoji(typeName: string): string {
  const n = (typeName ?? "").toLowerCase();

  if (n.includes("interactive") || n === "ispring") return "📘";
  if (n.includes("quiz")) return "💡";
  if (n.includes("poster")) return "🖼";
  if (n.includes("survey")) return "📊";
  if (n.includes("video") || n.includes("motion")) return "🎬";
  if (n.includes("game") && !n.includes("vr")) return "🎮";
  if (n.includes("vr")) return "🥽";
  if (n.includes("document") || n.includes("pdf") || n.includes("brochure")) return "📄";
  if (n.includes("screen saver")) return "💻";

  return "📎";
}

/** Icon box background by content type (match reference design) */
function getIconBgClass(typeName: string): string {
  const n = (typeName ?? "").toLowerCase();

  if (n.includes("interactive") || n === "ispring") return "bg-cyan-100 text-cyan-600";
  if (n.includes("quiz")) return "bg-blue-100 text-blue-600";
  if (n.includes("poster")) return "bg-orange-100 text-orange-600";
  if (n.includes("survey")) return "bg-purple-100 text-purple-600";
  if (n.includes("video") || n.includes("motion")) return "bg-blue-100 text-blue-600";
  if (n.includes("game") || n.includes("vr")) return "bg-emerald-100 text-emerald-600";
  if (n.includes("document") || n.includes("pdf") || n.includes("brochure")) return "bg-gray-100 text-gray-600";
  if (n.includes("screen saver")) return "bg-slate-100 text-slate-600";

  return "bg-gray-100 text-gray-600";
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
      dateRange?: {
        earliest_created?: string;
        latest_created?: string;
      } | null;
      languagesSupported?: string[];
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
  const { dir, locale } = useI18n();
  const { user } = useAuthStore();
  const roleId = user?.role_id;
  const isRtl = dir === "rtl";
  /** Org User (role 5) = learner view: progress bar, Awareness Campaign breadcrumb */
  const isOrgUserView = isOrgUser(roleId);
  /** Platform admin (1,2) or Org admin (3,4) = admin view: no progress, Training Library › Core Modules */
  const isAdminView = isPlatformAdmin(roleId) || isOrgAdmin(roleId);
  const isPlatform = isPlatformAdmin(roleId);
  const canEditContent = libraryType === "my" || (libraryType === "system" && isPlatform);

  const basePath = `/dashboard/training-library/${libraryType}`;
  const createContentHref = `${basePath}/${moduleId}/content/create`;
  const editModuleHref = `${basePath}/${moduleId}/edit`;

  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const tabGroupRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLSpanElement>(null);
  const rowsPerPage = 5;

  useEffect(() => {
    setLanguageFilter(locale === "ar" ? "2" : "");
  }, [locale]);

  const { data: moduleRes, isLoading: moduleLoading } = useModule(moduleId, !!moduleId);

  // Org User: Need to find campaign ID first
  // We re-use useModules to get assigned modules and find the campaign_id
  const { data: assignedModulesRes } = useModules({
    assigned_only: true,
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
      enabled: isAdminView || (isOrgUserView && !campaignId), // Fallback for Org User if no campaign
    }
  );

  const { data: contentsWithProgressRes, isLoading: progressLoading } = useContentsWithProgress(
    moduleId,
    campaignId!,
    {
      lang_id: languageFilter ? Number(languageFilter) : undefined,
      enabled: isOrgUserView && !!campaignId,
    }
  );

  // Unified Data extraction
  const { nonAggregatedContents, aggregatedContents, userProgress, quizzesData } = useMemo(() => {
    if (isOrgUserView && campaignId && contentsWithProgressRes?.success) {
      const data = contentsWithProgressRes.data;

      return {
        nonAggregatedContents: data.non_aggregated_contents || [],
        aggregatedContents: data.aggregated_contents || {},
        userProgress: data.user_progress_summary,
        quizzesData: null, // Quizzes often embedded in non-aggregated or separate
      };
    } else if (contentsWithQuizzesRes?.success) {
      const data = contentsWithQuizzesRes.data;

      return {
        nonAggregatedContents: data.non_aggregated_contents || [],
        aggregatedContents: data.aggregated_contents || {},
        userProgress: null,
        quizzesData: null,
      };
    }

    return {
      nonAggregatedContents: [],
      aggregatedContents: {},
      userProgress: null,
      quizzesData: null,
    };
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
        typeName: item.content_type,
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
          dateRange: agg.date_range,
          languagesSupported: agg.languages_supported,
          // We don't have individual items here, just the summary
          items: [],
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
  const totalPages = Math.max(1, Math.ceil(allCount / rowsPerPage));
  const paginatedContentCards = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredContentCards.slice(start, end);
  }, [filteredContentCards, currentPage]);

  const pageFrom = allCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const pageTo = Math.min(currentPage * rowsPerPage, allCount);
  // Progress calculations could be derived from userProgress if available
  const pendingCount = 0;
  const completedCount = 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, languageFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const activeTranslation = languageFilter
    ? moduleData.translations?.find((tr) => String(tr.language_id) === languageFilter)
    : moduleData.translations?.[0];

  const moduleTitle = moduleName(moduleData, languageFilter);
  const moduleDesc =
    activeTranslation?.description ??
    moduleData.description ??
    moduleData.translations?.[0]?.description ??
    t("moduleDetails.description");
  const moduleLogoUrl = (() => {
    const translation = activeTranslation;
    const logoPath = translation?.logo_banner_url ?? moduleData.translations?.[0]?.logo_banner_url;

    return logoPath ? getModuleAssetUrl(logoPath) : "";
  })();

  const breadcrumbFirst = isOrgUserView
    ? t("moduleDetails.breadcrumbAwarenessCampaign")
    : t("moduleDetails.breadcrumbTrainingLibrary");
  const breadcrumbMiddle = isOrgUserView
    ? t("moduleDetails.breadcrumbCampaign")
    : libraryType === "system"
      ? t("moduleDetails.coreModules")
      : t("moduleDetails.breadcrumbMyLibrary");

  // Different base paths for different user types
  const breadcrumbFirstHref = isOrgUserView ? "/dashboard/campaign-assignments" : basePath;
  const breadcrumbMiddleHref =
    isOrgUserView && campaignId ? `/dashboard/campaign-assignments/${campaignId}` : basePath;

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
              <Link
                className="hover:text-gray-700 transition text-inherit"
                href={breadcrumbFirstHref}
              >
                {breadcrumbFirst}
              </Link>
              <span className="text-gray-400">›</span>
              <Link className={breadcrumbLinkClassName} href={breadcrumbMiddleHref}>
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
              {!isOrgUserView && canEditContent && (
                <div className="flex items-center gap-2">
                  <Button
                    as={Link}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-xs font-medium"
                    href={editModuleHref}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="hidden md:inline">{t("moduleDetails.editModule") ?? "Edit Module"}</span>
                  </Button>
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
                </div>
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
                    aria-label={t("moduleDetails.searchPlaceholderContent")}
                    classNames={{
                      ...inputClassNames,
                      base: "w-full",
                      inputWrapper: clsx(
                        "rounded-full bg-white border border-gray-200 h-9 min-h-9 focus-within:border-blue-500",
                        isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                      ),
                      input: "text-xs",
                    }}
                    placeholder={t("moduleDetails.searchPlaceholderContent")}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                </div>
                <div className="w-[180px]">
                  <Select
                    aria-label={t("moduleDetails.languageFilter")}
                    className="w-full"
                    classNames={{
                      ...selectClassNames,
                      trigger: clsx(selectClassNames.trigger, "rounded-full text-xs min-h-9 h-9"),
                    }}
                    placeholder={t("moduleDetails.languageFilter")}
                    selectedKeys={languageFilter ? [languageFilter] : ["all"]}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys as Set<string>)[0] ?? "";

                      setLanguageFilter(v === "all" ? "" : v);
                    }}
                  >
                    {[
                      { id: "all" as const, name: t("moduleDetails.allLanguages"), icon: "🌐" },
                      ...SUPPORTED_LANGUAGES.map((lang) => ({
                        id: String(lang.id),
                        name: lang.name,
                        flag: lang.id,
                      })),
                    ].map((item: any) => (
                      <SelectItem key={item.id} textValue={item.name}>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {item.icon ? (
                            <span>{item.icon}</span>
                          ) : item.flag ? (
                            <ReactCountryFlag
                              svg
                              countryCode={getLanguageCountryCode(item.flag)}
                              style={{
                                fontSize: "1em",
                                lineHeight: "1em",
                              }}
                            />
                          ) : null}
                          <span className="whitespace-nowrap">{item.name}</span>
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
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <h4 className="text-xs font-bold text-gray-900 mb-3">
                      {t("moduleDetails.aboutModule")}
                    </h4>
                    <div className="flex flex-col items-start gap-3">
                      <div 
                        className={clsx(
                          "w-50 h-50 overflow-hidden shrink-0",
                          locale === "ar" && "translate-x-4"
                        )}
                        style={{ borderRadius: 12 }}
                      >
                        {moduleLogoUrl ? (
                          <img
                            alt={moduleTitle}
                            className="w-full h-full object-cover"
                            src={moduleLogoUrl}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/70" style={{ borderRadius: 12 }} />
                        )}
                      </div>
                      <div className="min-w-0 w-full">
                        <h3 className="text-base font-bold text-gray-900 leading-5">{moduleTitle}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mt-1">{moduleDesc}</p>
                      </div>
                    </div>
                  </div>

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
                  {paginatedContentCards.map((card, _idx) => {
                    // --- 1. NON-AGGREGATED CONTENT CARD (Interactive, etc.) ---
                    if (card.kind === "interactive") {
                      const { item, typeId, typeName } = card;

                      // For non-aggregated, we go directly to the DETAIL page
                      const detailHref = `${basePath}/${moduleId}/content/${typeId}/${item.content_id ?? item.id}`;
                      // Use item.language_id or item.language as per new API structure
                      const lid = item.language_id ?? item.language?.id;
                      const createdStr = formatCreatedDate(item.created_date ?? item.created_at);
                      const displayName = getContentTypeDisplayName(typeName);

                      // Check for item specific quiz data (from new API structure)
                      const itemQuizzes = item.quizzes; // { total_count, ... }

                      return (
                        <div
                          key={`interactive-${item.content_id ?? item.id}-${_idx}`}
                          className="flex flex-col gap-2"
                        >
                          {/* Main Content Card */}
                          <Card className="rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                            <CardBody className="p-4 flex flex-row items-center gap-3">
                              <div
                                className={clsx(
                                  "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-2xl font-bold",
                                  getIconBgClass(typeName)
                                )}
                              >
                                {getContentTypeEmoji(typeName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-gray-900 leading-5">
                                  {contentTitle(item)}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                  {t("moduleDetails.created")} {createdStr}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {t("moduleDetails.supportedLanguages", { defaultValue: "Supported Languages" })}
                                  </span>
                                  {item.languages_supported && item.languages_supported.length > 0 ? (
                                    <>
                                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                        {item.languages_supported.length}
                                      </span>
                                      {item.languages_supported.map((langName: string, idx: number) => {
                                         const langEntry = SUPPORTED_LANGUAGES.find(sl => sl.name === langName);
                                         const countryCode = langEntry ? getLanguageCountryCode(langEntry.id) : null;
                                         return (
                                           <span key={idx} className="text-[10px] text-gray-600 flex items-center gap-1">
                                              {countryCode && (
                                                <ReactCountryFlag
                                                  svg
                                                  countryCode={countryCode}
                                                  style={{ fontSize: "1em" }}
                                                />
                                              )}
                                              {langName}
                                           </span>
                                         );
                                      })}
                                    </>
                                  ) : lid != null ? (
                                    <>
                                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                        1
                                      </span>
                                      <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                        <ReactCountryFlag
                                          svg
                                          countryCode={getLanguageCountryCode(lid)}
                                          style={{ fontSize: "1em" }}
                                        />
                                        {getLanguageName(lid)}
                                      </span>
                                    </>
                                  ) : null}
                                  
                                  {item.user_completion_status === "completed" && (
                                    <span className="text-[10px] text-green-600 bg-green-100 px-3 py-1 rounded-full ml-auto">
                                      {t("moduleDetails.completed")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                as={Link}
                                className="bg-[#3FB6F7] hover:bg-[#33A7E6] text-white rounded-full text-[10px] font-semibold min-w-[82px] px-4 h-7"
                                href={detailHref}
                                size="sm"
                              >
                                {t("moduleDetails.start")}
                              </Button>
                            </CardBody>
                          </Card>

                          {/* Linked Quiz Card (if quizzes exist for this content) */}
                          {itemQuizzes && itemQuizzes.total_count > 0 && (
                            <Card className="rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                              <CardBody className="p-4 flex flex-row items-center gap-3">
                                <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden text-2xl font-bold">
                                  💡
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-base text-gray-900 leading-5">
                                    {t("moduleDetails.quizzes")}
                                  </p>
                                  <p className="text-[10px] text-gray-500 mt-1">
                                    {itemQuizzes.total_count} {t("moduleDetails.quizzesCount")}
                                  </p>
                                </div>
                                <Button
                                  as={Link}
                                  // TODO: Make sure we have a proper route for quizzes specific to a content item
                                  // Usually /quizzes?content_id=...
                                  className="bg-[#3FB6F7] hover:bg-[#33A7E6] text-white rounded-full text-[10px] font-semibold min-w-[82px] px-4 h-7"
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
                      const { typeId, typeName, count, dateRange } = card;
                      // For aggregated, click takes us to LIST page for that type
                      const listHref = `${basePath}/${moduleId}/content/${typeId}`;
                      const displayName = getContentTypeDisplayName(typeName);
                      const createdStr = formatCreatedDate(dateRange?.earliest_created);

                      return (
                        <Card
                          key={`grouped-${typeId}`}
                          className="rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                        >
                          <CardBody className="p-4 flex flex-row items-center gap-3">
                            <div
                              className={clsx(
                                "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-2xl font-bold",
                                getIconBgClass(typeName)
                              )}
                            >
                              {getContentTypeEmoji(typeName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base text-gray-900 leading-5">
                                {displayName}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {t("moduleDetails.created")} {createdStr}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-700 font-semibold mr-2 border-r border-gray-300 pr-2">
                                  {count} {displayName}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {t("moduleDetails.supportedLanguages", { defaultValue: "Supported Languages" })}
                                </span>
                                {card.languagesSupported && card.languagesSupported.length > 0 && (
                                  <>
                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                      {card.languagesSupported.length}
                                    </span>
                                    {card.languagesSupported.map((langName: string, idx: number) => {
                                      const langEntry = SUPPORTED_LANGUAGES.find(sl => sl.name === langName);
                                      const countryCode = langEntry ? getLanguageCountryCode(langEntry.id) : null;
                                      return (
                                        <span key={idx} className="text-[10px] text-gray-600 flex items-center gap-1">
                                          {countryCode && (
                                            <ReactCountryFlag
                                              svg
                                              countryCode={countryCode}
                                              style={{ fontSize: "1em" }}
                                            />
                                          )}
                                          {langName}
                                        </span>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              as={Link}
                              className="bg-[#3FB6F7] hover:bg-[#33A7E6] text-white rounded-full text-[10px] font-semibold min-w-[82px] px-4 h-7"
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

                      return (
                        <Card key="quizzes-row" className="rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                          <CardBody className="p-4 flex flex-row items-center gap-3">
                            <div
                              className={clsx(
                                "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-2xl font-bold",
                                getIconBgClass("Quiz")
                              )}
                            >
                              💡
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base text-gray-900 leading-5">
                                {t("moduleDetails.quizzes")}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {t("moduleDetails.created")} —
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] text-gray-600">
                                  {card.count} {t("moduleDetails.quizzesCount")}
                                </span>
                              </div>
                            </div>
                            <Button
                              as={Link}
                              className="bg-[#3FB6F7] hover:bg-[#33A7E6] text-white rounded-full text-[10px] font-semibold min-w-[82px] px-4 h-7"
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
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {t("library.paginationShowing")
                        .replace("{from}", String(pageFrom))
                        .replace("{to}", String(pageTo))
                        .replace("{total}", String(filteredContentCards.length))}
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          className="min-w-[32px] h-8 px-2 border border-gray-300 rounded-full text-xs bg-white text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={currentPage === 1}
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                          ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            className={clsx(
                              "min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all",
                              page === currentPage
                                ? "bg-blue-50 text-blue-600 border-blue-500 font-semibold"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            )}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          className="min-w-[32px] h-8 px-2 border border-gray-300 rounded-full text-xs bg-white text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={currentPage === totalPages}
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
