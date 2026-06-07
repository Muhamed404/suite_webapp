"use client";

import { useState, useEffect, useRef, useMemo, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useCampaignModules } from "@/hooks/useCampaign";
import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
// import { setLocaleCookie } from "@/i18n/client-locale"; // re-enable if global locale sync from content language is restored
import { useAuthStore } from "@/hooks/useAuthStore";
import { useContentsWithProgress, useModule, useModules } from "@/hooks/useQuiz";
import { campaignService } from "@/services/campaignService";
import { jnrClient, API_BASE } from "@/services/httpClient";
import { isOrgUser } from "@/utils/roles";
import { quizService } from "@/services/quizService";
import { SUPPORTED_LANGUAGES, LANGUAGE_COUNTRY_CODES } from "@/utils/supportedLanguages";
import { getModuleAssetUrl } from "@/utils/contentAssetUrl";
import { formatNumber } from "@/utils/localeNumber";

function normalizeContentType(value?: string): string {
  return (value ?? "").toLowerCase().trim();
}

function getContentTypeEmoji(typeName?: string): string {
  const n = normalizeContentType(typeName);

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

function getContentTypeColorClass(typeName?: string): string {
  const n = normalizeContentType(typeName);

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

export default function PhysicalSecurityPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const { locale, dir } = useI18n();
  const t = useTranslations("module");
  const slugDerivedName = useMemo(
    () => module.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    [module]
  );
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  // track selected language by supported language id (see utils/supportedLanguages); null = All Languages
  const [language, setLanguage] = useState<number | null>(locale === "ar" ? 2 : null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // report API data - added per user request
  const [reportCampaignId, setReportCampaignId] = useState<number | null>(null);
  const [reportCampaignData, setReportCampaignData] = useState<any>(null);
  const [reportModuleData, setReportModuleData] = useState<any>(null);
  const [reportContentsData, setReportContentsData] = useState<any>(null);
  const [reportContentsLoading, setReportContentsLoading] = useState(false);

  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);


  const generateModuleSlug = useCallback(
    (name: string) =>
      (name || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    []
  );

  // Get module ID from slug
  const { data: modulesRes } = useModules({ filter: module });

  const moduleId = useMemo<number | null>(() => {
    if (modulesRes?.success && modulesRes.data) {
      const found = modulesRes.data.find((m) => {
        const codeMatch = m.code?.toLowerCase() === module.toLowerCase();
        const titleMatch = m.title?.toLowerCase() === slugDerivedName.toLowerCase();
        const translationMatch = m.translations?.some(
          (t) => t.name.toLowerCase() === slugDerivedName.toLowerCase()
        );
        const slugMatch = m.translations?.some(
          (t) => generateModuleSlug(t.name) === module
        );

        return codeMatch || titleMatch || translationMatch || slugMatch;
      });

      return found?.id ?? null;
    }

    return null; // Not yet resolved — prevents premature API calls with wrong default ID
  }, [modulesRes, module, slugDerivedName, generateModuleSlug]);

  // Get module basic info
  const { data: moduleRes } = useModule(moduleId ?? 1, !!moduleId);

  const { moduleName, moduleDescription } = useMemo(() => {
    let name = slugDerivedName;
    let description = moduleRes?.data?.description || "";

    if (moduleRes?.success && moduleRes.data?.translations?.length) {
      // Prioritize the dropdown language if selected, otherwise use the global locale
      const currentLangId = language ?? (locale === "ar" ? 2 : 1);
      const translations = moduleRes.data.translations;
      const primaryTranslation = translations.find((t) => t.language_id === currentLangId);
      const fallbackTranslation = translations[0];
      const source = primaryTranslation ?? fallbackTranslation;

      if (source?.name) name = source.name;
      if (source?.description) description = source.description;
    }

    return { moduleName: name, moduleDescription: description };
  }, [moduleRes, locale, language, slugDerivedName]);

  const roleId = user?.role_id;
  const isOrgUserView = isOrgUser(roleId);

  // Get campaign ID from URL or assigned modules
  const { data: assignedModulesRes } = useModules({
    assigned_only: true,
  });

  const campaignId = useMemo(() => {
    // searchParams may be null in some Next.js modes (e.g. during server rendering)
    const campaignIdFromUrl = searchParams?.get("campaign_id");

    if (campaignIdFromUrl) {
      return parseInt(campaignIdFromUrl, 10);
    }

    if (!isOrgUserView || !assignedModulesRes?.success) return null; // Not yet resolved
    const modules = assignedModulesRes.data ?? [];
    const currentModule = modules.find((m) => m.id === Number(moduleId));

    if (currentModule && currentModule.assignments && currentModule.assignments.length > 0) {
      return currentModule.assignments[0].campaign_id;
    }

    return null; // Campaign not found
  }, [searchParams, isOrgUserView, assignedModulesRes, moduleId]);

  // when we have both campaignId & moduleId we need to fetch the reportCampaign
  // and then the corresponding reportModule; response isn't directly rendered yet
  useEffect(() => {
    if (!campaignId || !moduleId) return;

    setReportContentsLoading(true);
    // first call: get report campaign entry
    quizService
      .getReportCampaign(campaignId, user?.id ?? undefined)
      .then((res) => {
        if (res?.success && res?.data?.reportCampaigns?.length) {
          const entry = res.data.reportCampaigns[0];
          setReportCampaignData(entry);
          setReportCampaignId(entry.id);
          console.log("reportCampaign entry", entry);

          // second call depends on reportCampaignId
          return quizService.getReportModuleByParams(entry.id, moduleId);
        }
        return null;
      })
      .then((res2) => {
        if (res2 && res2.success) {
          setReportModuleData(res2.data);
          console.log("reportModule response", res2.data);

          // now that we have the report module entry, call contents endpoint
          const firstModule = res2.data?.reportModules?.[0];
          const reportModuleId = firstModule?.id;
          if (reportModuleId) {
            quizService
              .getContentsReport(reportModuleId)
              .then((res3) => {
                if (res3 && res3.success) {
                  setReportContentsData(res3.data);
                  console.log("report contents response", res3.data);
                }
              })
              .catch((err3) => {
                console.error("error fetching contents report", err3);
              })
              .finally(() => setReportContentsLoading(false));
          } else {
            setReportContentsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("error fetching report data", err);
        setReportContentsLoading(false);
      });
  }, [campaignId, moduleId]);

  // fetch list of modules that belong to this campaign so we can wire up "next module" navigation
  const { data: campaignModulesRes } = useCampaignModules(campaignId ?? 0, !!campaignId);

  const nextModuleSlug = useMemo(() => {
    if (!campaignModulesRes?.success || !moduleId) return null;
    const list = campaignModulesRes.data || [];
    const idx = list.findIndex((m: any) => m.id === moduleId);

    if (idx === -1 || idx === list.length - 1) return null;
    const next = list[idx + 1];

    // Module type defines `title`, so just use that.  Cast to any in case third-party returns extra
    return generateModuleSlug((next as any).title || "");
  }, [campaignModulesRes, moduleId, generateModuleSlug]);

  // Fetch content with progress data
  const { data: contentsWithProgressRes, isLoading } = useContentsWithProgress(
    moduleId ?? 0,
    campaignId ?? 0,
    {
      lang_id: language ?? undefined,
      enabled: !!moduleId && !!campaignId,
    }
  );

  // moduleRes is already fetched above

  // Transform API data to items format
  const items = useMemo(() => {
    if (!contentsWithProgressRes?.success) return [];

    const data = contentsWithProgressRes.data;
    const transformedItems: any[] = [];

    // Add non-aggregated contents (Interactive content, Videos, Documents, etc.)
    // Group gallery items so posters/brochures/documents/screen‑savers appear as one card.
    if (data.non_aggregated_contents) {
      const GALLERY_TYPES = ["Posters", "Brochures", "Screen Savers", "Screen savers"];
      const galleryGroups = new Map<number, any[]>();

      data.non_aggregated_contents.forEach((content: any) => {
        const isGallery = GALLERY_TYPES.some(
          (gt) => gt.toLowerCase() === (content.content_type ?? "").toLowerCase()
        );

        if (isGallery && content.content_type_id != null) {
          if (!galleryGroups.has(content.content_type_id)) {
            galleryGroups.set(content.content_type_id, []);
          }
          galleryGroups.get(content.content_type_id)!.push(content);

          return; // will be pushed as an aggregated card below
        }

        // process a regular non-gallery item
        let statusValue: string;

        if (content.user_completion_status) {
          statusValue = content.user_completion_status.toLowerCase();
        } else if (content.status && typeof content.status === "string") {
          statusValue = content.status.toLowerCase();
        } else if (content.status != null) {
          statusValue = String(content.status).toLowerCase();
        } else {
          statusValue = "pending";
        }

        if (statusValue === "pending") {
          statusValue = "in progress";
        }
        const statusLabel = statusValue.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

        transformedItems.push({
          id: content.content_id,
          title: content.name || content.title || content.content_type,
          status: statusValue,
          statusLabel,
          date: content.created_date
            ? new Date(content.created_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            : "—",
          chapters: `${content.content_type}`,
          lessons: content.description || `1 ${content.content_type?.toLowerCase()}`,
          languages: content.language_name
            ? [content.language_name.toLowerCase() === "arabic" ? "ar" : "en"]
            : ["en"],
          type: content.content_type,
          content_type_id: content.content_type_id,
        });

        if (content.quizzes && content.quizzes.total_count > 0) {
          const qStatus = content.quizzes.status || "not_started";
          const qLabel = qStatus.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

          transformedItems.push({
            id: `quiz-${content.content_id ?? content.id}`,
            title: "Quizzes",
            status: qStatus,
            statusLabel: qLabel,
            date: content.created_date
              ? new Date(content.created_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : "—",
            chapters: `${content.quizzes.total_count} Quizzes`,
            lessons: `${content.quizzes.total_count} questions`,
            languages: content.language_name
              ? [content.language_name.toLowerCase() === "arabic" ? "ar" : "en"]
              : ["en"],
            type: "Quiz",
            isQuizSummary: false,
            contentIds: [content.content_id ?? content.id],
            parentId: content.content_id ?? content.id,
          });
        }
      });

      // push a single card for each gallery type collected above
      // type IDs for which status is driven by reportContentsData
      const REPORT_DRIVEN_TYPE_IDS = [3, 4, 5, 8];

      galleryGroups.forEach((items, ctypeId) => {
        const first = items[0];
        const contentTypeName: string = first.content_type ?? "Documents";
        const count = items.length;

        // Determine aggregated status
        let aggStatus = "in progress";
        if (REPORT_DRIVEN_TYPE_IDS.includes(ctypeId) && reportContentsData?.reportContents) {
          const matching = (reportContentsData.reportContents as any[]).filter(
            (rc: any) => rc.content?.contype_id === ctypeId
          );
          if (matching.length > 0) {
            const allCompleted = matching.every((rc: any) => rc.status?.name === "COMPLETED");
            const allNotStarted = matching.every((rc: any) => rc.status?.name === "NOT_STARTED");
            if (allCompleted) aggStatus = "completed";
            else if (allNotStarted) aggStatus = "not started";
            else aggStatus = "in progress";
          }
        } else {
          const allCompleted = items.every((c: any) => {
            const sv = c.user_completion_status ?? c.status ?? "";
            return String(sv).toLowerCase() === "completed";
          });
          if (allCompleted) aggStatus = "completed";
        }
        const aggLabel = aggStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

        // Latest date across all items in the group
        const latestDate = items
          .map((c: any) => c.created_date)
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0];

        // Collect unique language codes
        const langs = Array.from(
          new Set(
            items.map((c: any) =>
              c.language_name ? (c.language_name.toLowerCase() === "arabic" ? "ar" : "en") : "en"
            )
          )
        );

        transformedItems.push({
          id: `agg_non_${ctypeId}`,
          title: contentTypeName,
          status: aggStatus,
          statusLabel: aggLabel,
          date: latestDate
            ? new Date(latestDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            : "—",
          chapters: `${count} ${contentTypeName}`,
          lessons: `${count} item${count !== 1 ? "s" : ""}`,
          languages: langs,
          type: contentTypeName,
          content_type_id: ctypeId,
          isAggregated: true,
          aggregatedData: {
            total_count: count,
            content_type: contentTypeName,
            content_type_id: ctypeId,
          },
        });
      });
    }

    // Add aggregated contents (Posters, Brochures, etc.)
    const REPORT_DRIVEN_TYPE_IDS_AGG = [3, 4, 5, 8];
    if (data.aggregated_contents) {
      Object.values(data.aggregated_contents).forEach((agg: any) => {
        if (agg.total_count > 0) {
          // determine status — for types 3,4,5,8 use reportContentsData, else fallback
          let aggStatus: string | undefined;

          if (REPORT_DRIVEN_TYPE_IDS_AGG.includes(agg.content_type_id) && reportContentsLoading) {
            aggStatus = "loading";
          } else if (REPORT_DRIVEN_TYPE_IDS_AGG.includes(agg.content_type_id) && reportContentsData?.reportContents) {
            const matching = (reportContentsData.reportContents as any[]).filter(
              (rc: any) => rc.content?.contype_id === agg.content_type_id
            );
            if (matching.length > 0) {
              const allCompleted = matching.every((rc: any) => rc.status?.name === "COMPLETED");
              const allNotStarted = matching.every((rc: any) => rc.status?.name === "NOT_STARTED");
              if (allCompleted) aggStatus = "completed";
              else if (allNotStarted) aggStatus = "not started";
              else aggStatus = "in progress";
            } else {
              aggStatus = "in progress";
            }
          } else {
            aggStatus = agg.statuses?.some((s: any) => s.status === 2) ? "completed" : "pending";
            if (aggStatus === "pending") {
              aggStatus = "in progress";
            }
          }
          const aggLabel = aggStatus === "loading" ? "Loading..." : aggStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

          transformedItems.push({
            id: `agg_${agg.content_type_id}`,
            title: agg.content_type,
            status: aggStatus,
            statusLabel: aggLabel,
            date: agg.date_range?.latest_created
              ? new Date(agg.date_range.latest_created).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : moduleRes?.data?.created_at
                ? new Date(moduleRes.data.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                : "—",
            chapters: `${agg.total_count} ${agg.content_type}`,
            lessons: `${agg.total_count} items`,
            languages: agg.languages_supported?.map((lang: string) =>
              lang.toLowerCase() === "arabic" ? "ar" : "en"
            ) || ["en"],
            type: agg.content_type,
            content_type_id: agg.content_type_id,
            isAggregated: true,
            aggregatedData: agg,
          });
        }
      });
    }

    // Global quizzes aggregate block has been removed in favor of inline quizzes per content.

    return transformedItems;
  }, [contentsWithProgressRes, moduleRes, reportContentsData, reportContentsLoading]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (item) =>
            item.status !== "completed" && item.status !== "passed" && item.status !== "failed"
        );
      } else if (statusFilter === "completed") {
        filtered = filtered.filter(
          (item) =>
            item.status === "completed" || item.status === "passed" || item.status === "failed"
        );
      } else {
        filtered = filtered.filter((item) => item.status === statusFilter);
      }
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();

      filtered = filtered.filter((item) => item.title.toLowerCase().includes(term));
    }

    return filtered;
  }, [items, statusFilter, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;

    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));

  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter(
        (item) =>
          item.status !== "completed" && item.status !== "passed" && item.status !== "failed"
      ).length,
      completed: items.filter(
        (item) =>
          item.status === "completed" || item.status === "passed" || item.status === "failed"
      ).length,
    };
  }, [items]);

  // Calculate overall progress from API data
  const overallProgress = useMemo(() => {
    if (!contentsWithProgressRes?.success) return 0;

    return contentsWithProgressRes.data?.user_progress_summary?.overall_progress_percent || 0;
  }, [contentsWithProgressRes]);

  // Get module info from API
  const moduleInfo = useMemo(() => {
    return {
      name: moduleName,
      description: moduleDescription,
    };
  }, [moduleName, moduleDescription]);

  const moduleLogoUrl = useMemo(() => {
    if (!moduleRes?.success || !moduleRes?.data) return "";
    const currentLangId = language ?? (locale === "ar" ? 2 : 1);
    const translation = moduleRes.data.translations?.find((t) => t.language_id === currentLangId);

    // If logo is null/empty for the current language, don't fall back – show nothing.
    const logoPath = translation?.logo_banner_url || "";

    return logoPath ? getModuleAssetUrl(logoPath) : "";
  }, [moduleRes, language, locale]);

  // Keep dropdown language in sync when global locale changes elsewhere in the app.
  useEffect(() => {
    setLanguage(locale === "ar" ? 2 : null);
  }, [locale]);

  // Disabled: content-language dropdown should only filter module content,
  // not switch the global UI locale (was causing Arabic UI to flip to English
  // when the user picked English content while in Arabic).
  // const syncGlobalLocaleWithLanguage = (langId: number) => {
  //   const targetLocale = langId === 2 ? "ar" : "en";
  //
  //   if (targetLocale !== locale) {
  //     setLocaleCookie(targetLocale);
  //     router.refresh();
  //   }
  // };


  const updateTabIndicator = () => {
    if (!tabIndicatorRef.current || !tabsContainerRef.current) return;
    const tabs = tabsContainerRef.current.querySelectorAll(".tab-btn");
    const activeTab = statusFilter;
    const activeIndex = Array.from(tabs).findIndex(
      (tab) => tab.getAttribute("data-status") === activeTab
    );

    if (activeIndex === -1) return;
    const activeTabEl = tabs[activeIndex] as HTMLElement;
    const left = activeTabEl.offsetLeft + 4;
    const width = activeTabEl.offsetWidth - 8;

    tabIndicatorRef.current.style.left = `${left}px`;
    tabIndicatorRef.current.style.width = `${width}px`;
  };

  useEffect(() => {
    updateTabIndicator();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [language, searchQuery, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        !(event.target as Element).closest(".language-dropdown-container")
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link href="/vendor/flag-icons/css/flag-icons.min.css" rel="stylesheet" />
        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }


          .item {
            animation: slideIn 0.3s ease-out;
          }

          .progress-bar {
            height: 100%;
          }

          /* Modern Dropdown Styles */
          .modern-dropdown-button {
            width: 100%;
            height: 47px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 0 2.5rem 0 0.75rem;
            font-size: 0.75rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
            outline: none;
            line-height: 1.5;
          }

          .modern-dropdown-wrapper.small .modern-dropdown-button {
            height: 39px;
            padding: 0 2rem 0 0.625rem;
            font-size: 0.75rem;
          }

          .modern-dropdown-wrapper.rounded-full .modern-dropdown-button {
            border-radius: 9999px;
            padding: 0 2rem 0 0.875rem;
          }

          .modern-dropdown-button:hover {
            border-color: #d1d5db;
          }

          .modern-dropdown-button.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .modern-dropdown-arrow {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            transition: transform 0.2s ease;
          }

          .modern-dropdown-arrow svg {
            width: 1rem;
            height: 1rem;
            color: #6b7280;
            transition: color 0.2s;
          }

          .modern-dropdown-menu {
            position: absolute;
            top: calc(100% + 0.25rem);
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            box-shadow:
              0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
            max-height: 240px;
            overflow-y: auto;
            z-index: 50;
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
            transition: all 0.2s ease;
          }

          .modern-dropdown-menu.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
          }

          /* Base table action button */
          .table-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.375rem; /* gap-1.5 */
            min-width: 120px;
            padding: 0.375rem 0.5rem; /* px-2 py-1.5 */
            border-radius: 9999px; /* rounded-full */
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
          }

          /* Primary variant (blue background) */
          .table-btn--primary {
            background-color: var(--blue);
          }

          .table-btn--primary:hover {
            opacity: 0.9;
          }
        `}</style>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading module content...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">
            <main className="flex-1 overflow-y-auto">
              <div className="flex gap-4 p-3 min-h-screen">
                {/* Main Content */}
                <div className="flex-1">
                  {/* Breadcrumb */}
                  <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5">
                    {isOrgUserView ? (
                      <>
                        <Link
                          className="hover:text-gray-700 transition"
                          href="/dashboard/campaign-assignments"
                        >
                          {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-semibold text-gray-900">{moduleName}</span>
                      </>
                    ) : (
                      <>
                        <Link className="hover:text-gray-700 transition" href="#">
                          {t("moduleDetails.breadcrumbAwarenessCampaign") ?? "Awareness Campaign"}
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link className="hover:text-gray-700 transition" href="#">
                          {t("moduleDetails.breadcrumbCampaign") ?? "Campaign"} {campaignId}
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-semibold text-gray-900">{moduleName}</span>
                      </>
                    )}
                  </nav>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold text-gray-900">{moduleName}</h1>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center justify-between rounded-xl mb-4">
                    {/* Tabs */}
                    <div
                      ref={tabsContainerRef}
                      className="flex gap-0 bg-white p-0.5 rounded-full relative"
                      id="tabGroup"
                    >
                      <div
                        ref={tabIndicatorRef}
                        className="absolute bg-[#051226] rounded-full transition-all duration-300"
                        style={{ top: "3px", height: "calc(100% - 6px)", width: "0px" }}
                      />
                      <button
                        className={`tab-btn ${statusFilter === "all" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                        data-status="all"
                        onClick={() => {
                          setStatusFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        {t("moduleDetails.tabAll") ?? "All"}{" "}
                        <span className="tab-count w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-200">
                          {tabCounts.all}
                        </span>
                      </button>
                      <button
                        className={`tab-btn ${statusFilter === "pending" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                        data-status="pending"
                        onClick={() => {
                          setStatusFilter("pending");
                          setCurrentPage(1);
                        }}
                      >
                        {t("moduleDetails.tabPending") ?? "Pending"}{" "}
                        <span className="tab-count w-5 h-5 rounded-full bg-green-100 text-green-400 text-[10px] font-bold flex items-center justify-center transition-all duration-200">
                          {tabCounts.pending}
                        </span>
                      </button>
                      <button
                        className={`tab-btn ${statusFilter === "completed" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                        data-status="completed"
                        onClick={() => {
                          setStatusFilter("completed");
                          setCurrentPage(1);
                        }}
                      >
                        {t("moduleDetails.tabCompleted") ?? "Completed"}{" "}
                        <span className="tab-count w-5 h-5 rounded-full bg-green-100 text-green-400 text-[10px] font-bold flex items-center justify-center transition-all duration-200">
                          {tabCounts.completed}
                        </span>
                      </button>
                    </div>

                    {/* Search + Language */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search
                          className="absolute text-gray-600 pointer-events-none z-10 w-4 h-4"
                          style={{ left: "16px", top: "45%", transform: "translateY(-50%)" }}
                        />
                        <input
                          className="datatable-input w-full pr-4 py-2 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-9 placeholder-gray-400"
                          id="searchInput"
                          placeholder={t("moduleDetails.searchPlaceholderContent") ?? "Search Content..."}
                          style={{ paddingLeft: "40px" }}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>

                      <div className="relative w-40 modern-dropdown-wrapper small rounded-full language-dropdown-container">
                        <button
                          className="modern-dropdown-button flex items-center justify-between"
                          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        >
                          {/* selected language name + flag */}
                          {(() => {
                            if (language === null) {
                              return (
                                <span className="flex items-center gap-1">
                                  <span>{t("moduleDetails.allLanguages") ?? "All Languages"}</span>
                                </span>
                              );
                            }
                            const sel = SUPPORTED_LANGUAGES.find((l) => l.id === language);
                            const code = sel ? LANGUAGE_COUNTRY_CODES[sel.id].toLowerCase() : "us";
                            return (
                              <>
                                <span className="flex items-center gap-1">
                                  <span className={`fi fi-${code} rounded-full`} />
                                  <span>{sel?.name || (t("moduleDetails.languageLabel") ?? "Language")}</span>
                                </span>
                              </>
                            );
                          })()}
                          <div className="modern-dropdown-arrow">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M19 9l-7 7-7-7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </button>

                        {showLanguageDropdown && (
                          <div className="modern-dropdown-menu open">
                            <button
                              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setLanguage(null);
                                setShowLanguageDropdown(false);
                              }}
                            >
                              <span>{t("moduleDetails.allLanguages") ?? "All Languages"}</span>
                            </button>
                            {SUPPORTED_LANGUAGES.map((lang) => {
                              const code = LANGUAGE_COUNTRY_CODES[lang.id].toLowerCase();
                              return (
                                <button
                                  key={lang.id}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                  onClick={() => {
                                    setLanguage(lang.id);
                                    // Content language filter should not change the global UI locale.
                                    // syncGlobalLocaleWithLanguage(lang.id);
                                    setShowLanguageDropdown(false);
                                  }}
                                >
                                  <span className={`fi fi-${code} rounded-full`} />
                                  <span>{lang.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 w-full h-[80vh]">
                    {/* Left Sidebar */}
                    <div className="col-span-3 flex flex-col gap-4 justify-between bg-white rounded-2xl p-4 h-full">
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3">
                          🎉 {t("moduleDetails.welcomeText") ?? "Welcome to the"}
                        </h2>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{moduleInfo.name}</h3>
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="progress-bar h-full bg-green-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${overallProgress}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex w-full justify-between items-center">
                            <p className="text-[10px] text-gray-500">{t("moduleDetails.progress") ?? "Progress"}</p>
                            <p className="text-[10px] text-gray-700 font-semibold">
                              {overallProgress}%
                            </p>
                          </div>
                        </div>

                        <div className="">
                          <p className="text-xs text-gray-600">
                            {t("moduleDetails.progressHint") ?? "To complete this module you need to complete interactive lesson, than quizzes to complete 100%"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-6">
                          <h4 className="text-xs font-bold text-gray-900 mb-3">{t("moduleDetails.aboutModule") ?? "About The Module"}</h4>
                          {moduleInfo.description && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                              {moduleInfo.description}
                            </p>
                          )}
                          {isOrgUserView && moduleLogoUrl ? (
                            <img
                              alt={`${moduleInfo.name} logo`}
                              className="mt-3 w-full h-auto max-h-40 object-contain rounded-md border border-gray-200 bg-white"
                              src={moduleLogoUrl}
                            />
                          ) : null}
                        </div>

                        <Button
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                          disabled={!nextModuleSlug}
                          onClick={() => {
                            if (nextModuleSlug) {
                              router.push(`/module/${nextModuleSlug}?campaign_id=${campaignId}`);
                            }
                          }}
                        >
                          <span>{t("moduleDetails.nextModule")}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="col-span-9 flex flex-col justify-between">
                      <div className="space-y-2 w-full">
                        {(() => {
                          const baseIdx = filteredItems
                            .slice(0, (currentPage - 1) * rowsPerPage)
                            .filter(item => !(item.type === "Quiz" && !item.isQuizSummary))
                            .length;
                          let runningContentNumber = baseIdx;

                          return paginatedItems.map((item, index) => {
                            const contentTypeKey = item.type || item.title || "";
                            const langMap: Record<string, { label: string; flag: string }> = {
                              en: { label: "English", flag: "us" },
                              ar: { label: "Arabic", flag: "sa" },
                            };

                            const icon = getContentTypeEmoji(contentTypeKey);
                            const color = getContentTypeColorClass(contentTypeKey);
                            const isQuizSubItem = item.type === "Quiz" && !item.isQuizSummary;
                            let contentNumberLabel: string | null = null;

                            if (!isQuizSubItem) {
                              runningContentNumber += 1;
                              contentNumberLabel = formatNumber(runningContentNumber, locale);
                            }
                            const langChips = (item.languages || []).map((code: string) => {
                              const cfg = langMap[code];

                              if (!cfg) return null;

                              return (
                                <span
                                  key={code}
                                  className="inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-1 bg-white"
                                >
                                  <span className={`fi fi-${cfg.flag} rounded-full`} />
                                  <span className="text-gray-600">{cfg.label}</span>
                                </span>
                              );
                            });

                            // format status for display (e.g. "not_started" / "in progress" -> "Not Started" / "In Progress")
                            const displayStatus = item.status
                              ? item.status
                                .replace(/_/g, " ")
                                .split(" ")
                                .map((s: string) => s ? s[0].toUpperCase() + s.slice(1) : s)
                                .join(" ")
                              : "";

                            let statusLabel = displayStatus;
                            if (item.status === "completed") statusLabel = t("moduleDetails.completed") ?? "Completed";
                            else if (item.status === "passed") statusLabel = t("moduleDetails.passed") ?? "Passed";
                            else if (item.status === "failed") statusLabel = t("moduleDetails.failed") ?? "Failed";
                            else if (!item.status || item.status === "pending" || item.status === "in_progress" || item.status === "in progress")
                              statusLabel = t("moduleDetails.pending") ?? "Pending";

                            const statusBadge =
                              item.status === "loading" ? (
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full animate-pulse">
                                  {t("moduleDetails.statusLoading") ?? "Loading..."}
                                </span>
                              ) : item.status === "completed" || item.status === "passed" ? (
                                <span className="text-[11px] text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                  {statusLabel}
                                </span>
                              ) : item.status === "failed" ? (
                                <span className="text-[11px] text-red-600 bg-red-100 px-3 py-1 rounded-full">
                                  {statusLabel}
                                </span>
                              ) : (
                                <span className="text-[11px] text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                                  {statusLabel}
                                </span>
                              );

                            return (
                              <div
                                key={`${item.id}-${index}`}
                                className={`item bg-white rounded-2xl p-4 flex justify-between items-center border transition-all hover:shadow-sm relative z-10 ${item.type === "Quiz" && !item.isQuizSummary
                                    ? "ml-8 -mt-2 border-blue-100 bg-slate-50 hover:border-blue-300 shadow-sm"
                                    : "border-gray-100 hover:border-blue-200"
                                  }`}
                              >
                                <div className="flex gap-4 flex-1">
                                  <div
                                    className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center flex-shrink-0 text-lg`}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {contentNumberLabel && (
                                        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                                          {contentNumberLabel}
                                        </span>
                                      )}
                                      <h3 className="text-base font-semibold text-gray-900">
                                        {item.title}
                                      </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 mb-3">
                                      <span>
                                        {t("moduleDetails.createdLabel", { date: item.date }) ?? `Created ${item.date}`} &nbsp; &nbsp;·
                                      </span>
                                      {langChips}
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      {item.chapters} · {item.lessons}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-4 flex flex-col items-end gap-4">
                                  {statusBadge}
                                  <button
                                    className="table-btn--primary table-btn"
                                    onClick={async () => {
                                      console.log(
                                        "[module] Start clicked, moduleId:",
                                        moduleId,
                                        "campaignId:",
                                        campaignId,
                                        "item.id:",
                                        item.id,
                                        "typeof item.id:",
                                        typeof item.id
                                      );

                                      // notify backend that user began this content (skip if already completed or in progress, or aggregated)
                                      if (
                                        campaignId != null &&
                                        moduleId != null &&
                                        typeof item.id === "number" &&
                                        !item.isAggregated &&
                                        item.status !== "completed" &&
                                        item.status !== "passed" &&
                                        item.status !== "failed" &&
                                        item.status !== "in_progress" &&
                                        item.status !== "in progress"
                                      ) {
                                        try {
                                          await campaignService.beginContent(
                                            campaignId,
                                            moduleId,
                                            item.id
                                          );
                                          console.log("[module] beginContent success");
                                        } catch (err) {
                                          console.error("[module] beginContent error", err);
                                        }
                                      }

                                      // Call the report-actions/begin-content API (skip for aggregated content)
                                      if (moduleId != null && !item.isAggregated) {
                                        let contentId: number | null = null;

                                        if (typeof item.id === "number") {
                                          contentId = item.id;
                                        } else if (item.isAggregated && item.content_type_id) {
                                          contentId = item.content_type_id;
                                        }
                                        if (
                                          contentId != null &&
                                          item.status !== "in_progress" &&
                                          item.status !== "in progress" &&
                                          item.status !== "completed" &&
                                          item.status !== "passed" &&
                                          item.status !== "failed"
                                        ) {
                                          console.log(
                                            "[module] Calling report-actions/begin-content with",
                                            { contentId }
                                          );
                                          try {
                                            await jnrClient.post(
                                              `${API_BASE}/useraction/report-actions/begin-content`,
                                              {
                                                content_id: contentId,
                                                module_id: moduleId,
                                                campaign_id: campaignId,
                                              }
                                            );
                                            console.log(
                                              "[module] report-actions begin-content success"
                                            );
                                          } catch (err) {
                                            console.error(
                                              "[module] report-actions begin-content error",
                                              err
                                            );
                                          }
                                        } else {
                                          console.log(
                                            "[module] Skipping report-actions call: no valid contentId or status is in_progress/completed",
                                            item
                                          );
                                        }
                                      } else {
                                        console.log(
                                          "[module] Skipping report-actions call: moduleId is",
                                          moduleId
                                        );
                                      }

                                      // Fetch module contents for this content type before navigating
                                      if (item.content_type_id != null) {
                                        quizService
                                          .getContents({
                                            mod_id: moduleId ?? undefined,
                                            contype_id: item.content_type_id,
                                          })
                                          .then((res) => {
                                            console.log("[module] getContents by type", res);
                                          })
                                          .catch((err) => {
                                            console.error("[module] getContents error", err);
                                          });
                                      }
                                      // Navigation Logic Based on Content Type ID or Type Name
                                      const isVideo = item.content_type_id === 2 || item.type === "Motion Videos" || item.type === "Video Training";
                                      const isInteractive = item.content_type_id === 1 || item.type === "Interactive Lesson" || item.type === "Interactive Contents";
                                      const isQuiz = item.type === "Quiz" || item.title === "Quizzes";

                                      if (isVideo) {
                                        const videoParams = new URLSearchParams();
                                        videoParams.set("campaign_id", String(campaignId));
                                        if (item.id && !String(item.id).startsWith("agg_")) {
                                          videoParams.set("content_id", String(item.id));
                                        }
                                        router.push(
                                          `/module/${module}/video-training?${videoParams.toString()}`
                                        );
                                      } else if (isInteractive) {
                                        // Dedicated org-user interactive content page
                                        router.push(
                                          `/module/${module}/interactive-content/${item.id}?campaign_id=${campaignId}&module_id=${moduleId}`
                                        );
                                      } else if (isQuiz) {
                                        const quizParams = new URLSearchParams();
                                        quizParams.set("campaign_id", String(campaignId));
                                        if (item.contentIds && item.contentIds.length > 0) {
                                          quizParams.set("content_id", String(item.contentIds[0]));
                                        }
                                        router.push(
                                          `/module/${module}/quizzes?${quizParams.toString()}`
                                        );
                                      } else {
                                        // Gallery / Aggregated Content Types (Posters, Brochures, etc.)
                                        const galleryTypes = [
                                          "Posters",
                                          "Brochures",
                                          "Documents",
                                          "Screen Savers",
                                          "Screen savers",
                                          "Misc",
                                        ];

                                        const type = item.type || item.title || "";
                                        if (
                                          galleryTypes.some(
                                            (ct) => ct.toLowerCase() === type.toLowerCase()
                                          ) ||
                                          [3, 4, 5, 8].includes(item.content_type_id)
                                        ) {
                                          const typeName = item.type || item.title || "content";
                                          const typeSlug = typeName
                                            .toLowerCase()
                                            .replace(/\s+/g, "-");
                                          const ctParams = new URLSearchParams();

                                          if (moduleId) ctParams.set("mod_id", String(moduleId));
                                          if (item.content_type_id != null)
                                            ctParams.set("contype_id", String(item.content_type_id));
                                          if (campaignId)
                                            ctParams.set("campaign_id", String(campaignId));
                                          router.push(
                                            `/module/${module}/content/${typeSlug}?${ctParams.toString()}`
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    {t("moduleDetails.start") ?? "Start"}
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          {(() => {
                            const fromIdx =
                              filteredItems.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
                            const toIdx = Math.min(
                              currentPage * rowsPerPage,
                              filteredItems.length
                            );

                            return (
                              t("moduleDetails.showingEntries", {
                                from: formatNumber(fromIdx, locale),
                                to: formatNumber(toIdx, locale),
                                total: formatNumber(filteredItems.length, locale),
                              }) ??
                              `Showing ${formatNumber(fromIdx, locale)}–${formatNumber(toIdx, locale)} of ${formatNumber(filteredItems.length, locale)} Entries`
                            );
                          })()}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from(
                            { length: Math.ceil(filteredItems.length / rowsPerPage) },
                            (_, i) => i + 1
                          ).map((page) => (
                            <button
                              key={page}
                              className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${page === currentPage
                                  ? "bg-blue-50 text-blue-600 border-blue-500 font-semibold"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {formatNumber(page, locale)}
                            </button>
                          ))}

                          <button
                            className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
