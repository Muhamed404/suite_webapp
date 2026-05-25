"use client";

import type { CampaignAssignment } from "@/types/campaign";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@heroui/card";
import clsx from "clsx";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  SearchX,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAssignedCampaigns } from "@/hooks/useCampaign";
import { campaignService } from "@/services/campaignService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles"; // helper to detect organization user (learner view) 
import { useUserDashboards } from "@/hooks/useDashboard";
import { Spinner } from "@heroui/spinner"; // used for loading state in tables

function formatDate(dateStr?: string, locale: string = "en-GB"): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function campaignName(c: CampaignAssignment, t?: any): string {
  return c.name ?? (t ? `${t("campaignLabel")} ${c.id}` : `Campaign ${c.id}`);
}

function generateModuleSlug(campaign: CampaignAssignment): string {
  const name = campaignName(campaign);

  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

function getCampaignStatus(campaign: CampaignAssignment): "active" | "pending" | "completed" {
  // priority: numeric progress percentage is the source of truth for determining
  // whether a module is active/completed. the `status` string from the API has
  // proven unreliable (e.g. "completed" even when progress is 66.67%), so we
  // avoid using it for filtering.

  // coerce progress to numeric value in case it's a string or missing
  // some API responses still use the original field name `progress_percentage`,
  // so we fallback to it if the normalized `progress_percent` is undefined.
  const progress = Number(campaign.progress_percent ?? campaign.progress_percentage) || 0;

  if (progress >= 100) {
    return "completed";
  }

  // Active: progress == 0 (not started)
  if (progress === 0) {
    return "active";
  }

  // Pending: progress > 0 and < 100 (in progress)
  return "pending";
} 

function getTimelinePriorityTimestamp(campaign: CampaignAssignment): number {
  const now = Date.now();
  const startTs = campaign.start_date ? new Date(campaign.start_date).getTime() : Number.POSITIVE_INFINITY;
  const endTs = campaign.end_date ? new Date(campaign.end_date).getTime() : Number.POSITIVE_INFINITY;
  const hasValidStart = Number.isFinite(startTs);
  const hasValidEnd = Number.isFinite(endTs);

  // If not started yet, prioritize by nearest upcoming start date.
  if (hasValidStart && startTs >= now) return startTs;
  // If in progress, prioritize by nearest remaining end date.
  if (hasValidEnd && endTs >= now) return endTs;
  // Completed/expired items go to the end ordered by end date.
  if (hasValidEnd) return endTs;
  if (hasValidStart) return startTs;
  return Number.POSITIVE_INFINITY;
}

// add "inprogress" type for org users only
function getStatusBadge(status: "active" | "pending" | "completed" | "inprogress", t: any) {
  const badges: Record<
    typeof status,
    { class: string; icon: string; text: string }
  > = {
    active: {
      class: "bg-green-100 text-green-700 border border-green-200",
      icon: "play-circle",
      text: t("status.active"),
    },
    inprogress: {
      // visually similar to active but with different label
      class: "bg-green-100 text-green-700 border border-green-200",
      icon: "play-circle",
      text: t("status.inProgress"),
    },
    pending: {
      class: "bg-amber-100 text-amber-700 border border-amber-200",
      icon: "clock",
      text: t("status.pending"),
    },
    completed: {
      class: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: "check-circle",
      text: t("status.completed"),
    },
  };

  const badge = badges[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.class} text-[10px] font-semibold min-w-[100px] justify-center`}
    >
      <span>{badge.text}</span>
    </span>
  );
} 

function getActionButton(
  status: "active" | "pending" | "completed",
  campaign: CampaignAssignment,
  t: any,
  onStart?: (campaign: CampaignAssignment) => void
) {
  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200";
  const moduleSlug = generateModuleSlug(campaign);

  // If progress is null, show Start Module button
  if (campaign.progress_percent === null && onStart) {
    return (
      <button
        className={`${baseClasses} bg-[#3FBDFF] text-white hover:bg-opacity-90`}
        onClick={() => onStart(campaign)}
      >
        <span>{t("assignmentPage.actions.startModule")}</span>
      </button>
    );
  }

  // Otherwise, always show View button
  return (
    <Link href={`/module/${moduleSlug}?campaign_id=${campaign.campaign_id}`}>
      <button
        className={`${baseClasses} bg-[#3FBDFF] text-white hover:bg-opacity-90`}
        // Commented out useless API call - response was being ignored
        // onClick={() => {
        //   // simply hit report endpoint; ignore response for now
        //   campaignService
        //     .getModuleReport(campaign.id)
        //     .then((res) => {
        //       console.log("[campaign-assignments] getModuleReport", res);
        //     })
        //     .catch((err) => {
        //       console.error("[campaign-assignments] getModuleReport error", err);
        //     });
        // }}
      >
        <span>{t("assignmentPage.actions.view")}</span>
      </button>
    </Link>
  );
}

export function CampaignAssignmentsPage() {
  const t = useTranslations("campaigns");
  const { dir, locale } = useI18n();
  const isRtl = dir === "rtl";
  const queryClient = useQueryClient();

  // State declarations first
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "completed">(
    "all"
  );
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);

  // Hook calls after state declarations
  const { data: allCampaignsRes } = useAssignedCampaigns(); // For dropdown options
  const { data: campaignsRes, isLoading } = useAssignedCampaigns(campaignFilter);
  const allAssignments = allCampaignsRes?.success ? (allCampaignsRes.data ?? []) : [];
  const campaigns = campaignsRes?.success ? (campaignsRes.data ?? []) : [];

  // Get unique campaigns for dropdown
  const uniqueCampaigns = useMemo(() => {
    const campaignMap = new Map<number, { id: number; name: string }>();

    allAssignments.forEach((assignment: CampaignAssignment) => {
      if (
        assignment.campaign_name &&
        assignment.campaign_id &&
        !campaignMap.has(assignment.campaign_id)
      ) {
        campaignMap.set(assignment.campaign_id, {
          id: assignment.campaign_id,
          name: assignment.campaign_name,
        });
      }
    });

    return Array.from(campaignMap.values());
  }, [allAssignments]);

  const { data: userDashboardsRes } = useUserDashboards();
  const userMetrics = userDashboardsRes?.object?.dashboardUsers?.[0] || null;

  // Do not show static/mock data when API returns no data
  const displayCampaigns = campaigns;
  const { user } = useAuthStore();
  const isOrgUserView = isOrgUser(user?.role_id); // only learners should see progress-based labels
  const [sortColumn, setSortColumn] = useState<"timeline" | "name" | "start" | "end" | "status">(
    "timeline"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleStartModule = async (campaign: CampaignAssignment) => {
    try {
      // campaign.id is module_id, campaign.campaign_id is campaign identifier
      if (campaign.campaign_id == null) {
        console.warn("Missing campaign_id on assignment", campaign);

        return;
      }

      // first report the campaign start
      const campaignRes = await campaignService.beginCampaign(campaign.campaign_id);

      if (!campaignRes.success) {
        console.error("beginCampaign did not succeed", campaignRes);

        return; // don't start module if campaign start failed
      }

      // campaign start succeeded, now begin module
      await campaignService.beginModule(campaign.campaign_id, campaign.id);

      // refresh data without page reload
      queryClient.invalidateQueries({ queryKey: ["campaign", "assigned"] });
    } catch (error) {
      console.error("Failed to start module:", error);
    }
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = displayCampaigns;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c: CampaignAssignment) => getCampaignStatus(c) === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c: CampaignAssignment) =>
          campaignName(c, t).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.campaign_name && c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sorting
    filtered.sort((a: CampaignAssignment, b: CampaignAssignment) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case "timeline":
          aVal = getTimelinePriorityTimestamp(a);
          bVal = getTimelinePriorityTimestamp(b);
          break;
        case "name":
          aVal = campaignName(a, t).toLowerCase();
          bVal = campaignName(b, t).toLowerCase();
          break;
        case "start":
          aVal = a.start_date ? new Date(a.start_date).getTime() : 0;
          bVal = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case "end":
          aVal = a.end_date ? new Date(a.end_date).getTime() : 0;
          bVal = b.end_date ? new Date(b.end_date).getTime() : 0;
          break;
        case "status":
          aVal = getCampaignStatus(a);
          bVal = getCampaignStatus(b);
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;

      return 0;
    });

    return filtered;
  }, [displayCampaigns, statusFilter, searchQuery, sortColumn, sortDirection]);

  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  const handleSort = (column: "name" | "start" | "end" | "status") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const updateTabIndicator = (activeTab: string) => {
    if (!tabIndicatorRef.current || !tabsContainerRef.current) return;
    const tabs = tabsContainerRef.current.querySelectorAll(".tab-btn");
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
    updateTabIndicator(statusFilter);
  }, [statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // removed date dropdown logic
      if (showCampaignDropdown && !target.closest(".campaign-dropdown-container")) {
        setShowCampaignDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCampaignDropdown]);

  const handleTabClick = (status: "all" | "active" | "pending" | "completed") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    // Calculate counts from actual campaigns data (fallbacks only)
    const campaignCounts = displayCampaigns.reduce(
      (
        acc: { active: number; pending: number; completed: number },
        campaign: CampaignAssignment
      ) => {
        const status = getCampaignStatus(campaign);

        acc[status] = (acc[status] || 0) + 1;

        return acc;
      },
      { active: 0, pending: 0, completed: 0 }
    );

    // Prefer values returned by the dashboardUsers API when available
    // "assignment" card should reflect modules enrolled, not campaigns
    const totalAssignments =
      userMetrics && typeof userMetrics.total_modules_enrolled === 'number'
        ? userMetrics.total_modules_enrolled
        : // fallback to campaign count if modules data is missing
          (userMetrics && typeof userMetrics.total_campaigns === 'number'
            ? userMetrics.total_campaigns
            : displayCampaigns.length);

    const completedCount =
      userMetrics && typeof userMetrics.total_completed_modules === 'number'
        ? userMetrics.total_completed_modules
        : campaignCounts.completed;

    // pending should be based on the number of modules enrolled
    const pendingCount =
      // if we were able to compute totalAssignments above, use that
      typeof totalAssignments === 'number'
        ? totalAssignments - completedCount
        : // fallback to old logic (campaign-based) if modules info is unavailable
          userMetrics && typeof userMetrics.total_campaigns === 'number'
            ? userMetrics.total_campaigns - (userMetrics.total_completed_modules ?? 0)
            : campaignCounts.pending;

    const assignmentSummary = (campaignsRes as any)?.user_summary;
    const responseRateValue =
      assignmentSummary && typeof assignmentSummary.response_rate === "number"
        ? assignmentSummary.response_rate
        : userMetrics && userMetrics.global_progress_percent != null
        ? Number(userMetrics.global_progress_percent)
        : 0;

    return {
      assignment: totalAssignments,
      completed: completedCount,
      pending: pendingCount,
      responseRate: responseRateValue,
      active: campaignCounts.active,
    };
  }, [displayCampaigns, userMetrics, campaignsRes]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-3 min-h-screen">
          <h1 className="text-lg font-semibold mb-4">{t("assignmentPage.title")}</h1>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image alt="" height={20} src="/awm/images/assing/assingment.svg" width={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">{t("assignmentPage.stats.assignment")}</p>
                <p className="text-lg font-semibold">{stats.assignment}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image alt="" height={20} src="/awm/images/assing/assingment.svg" width={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">{t("assignmentPage.stats.completed")}</p>
                <p className="text-lg font-semibold">{stats.completed}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image alt="" height={20} src="/awm/images/assing/pending.svg" width={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">{t("assignmentPage.stats.pending")}</p>
                <p className="text-lg font-semibold">{stats.pending}</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image alt="" height={20} src="/awm/images/assing/res-rate.svg" width={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">{t("assignmentPage.stats.responseRate")}</p>
                <p className="text-lg font-semibold">{stats.responseRate}%</p>
              </div>
            </Card>

            <Card className="bg-white rounded-2xl p-3 relative">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs absolute top-3 right-3">
                <Image alt="" height={20} src="/awm/images/assing/assingment.svg" width={20} />
              </div>
              <div className="pr-10">
                <p className="text-xs text-gray-500">{t("assignmentPage.stats.active")}</p>
                <p className="text-lg font-semibold">{stats.active}</p>
              </div>
            </Card>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            <style>
              {`
                .tab-btn.active:hover {
                  background-color: transparent !important;
                }
                .tab-btn:not(.active):hover {
                  background-color: rgba(243, 244, 246, 1);
                }
                /* Base Button Styles */
                .modern-dropdown-button {
                  width: 100%;
                  height: 47px; /* Overridden by small variant */
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem; /* Overridden by rounded-full */
                  padding: 0 2.5rem 0 0.75rem; /* Overridden by variants */
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

                /* Small Size Variant */
                .modern-dropdown-wrapper.small .modern-dropdown-button {
                  height: 39px;
                  padding: 0 2rem 0 0.625rem; /* Left padding overridden by inline style */
                  font-size: 0.75rem;
                }

                /* Rounded-Full Variant */
                .modern-dropdown-wrapper.rounded-full .modern-dropdown-button {
                  border-radius: 9999px;
                  padding: 0 2rem 0 0.875rem; /* Left padding overridden by inline style */
                }

                /* Hover State */
                .modern-dropdown-button:hover {
                  border-color: #d1d5db;
                }

                /* Active/Focused State */
                .modern-dropdown-button.active {
                  border-color: #3b82f6;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* Arrow Icon */
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

                /* Dropdown Menu */
                .modern-dropdown-menu {
                  position: absolute;
                  top: calc(100% + 0.25rem);
                  left: 0;
                  right: 0;
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem; /* 1rem for rounded-full */
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
              `}
            </style>
            {/* Tabs */}
            <div ref={tabsContainerRef} className="flex gap-0 bg-white p-0.5 rounded-full relative">
              {/* Sliding Background Indicator */}
              <div
                ref={tabIndicatorRef}
                className="absolute bg-[#051226] rounded-full transition-all duration-300"
                style={{ top: "3px", height: "calc(100% - 6px)" }}
              />

              {[
                { key: "all", label: t("filters.all"), count: stats.assignment },
                { key: "active", label: t("filters.active"), count: stats.active },
                { key: "pending", label: t("filters.pending"), count: stats.pending },
                { key: "completed", label: t("filters.completed"), count: stats.completed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={clsx(
                    "tab-btn px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10",
                    statusFilter === tab.key
                      ? "active text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  )}
                  data-status={tab.key}
                  onClick={() => handleTabClick(tab.key as any)}
                >
                  <span className="tab-label">{tab.label}</span>
                  <span
                    className={clsx(
                      "tab-count w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-200",
                      statusFilter === tab.key
                        ? "bg-white/30 text-white"
                        : "bg-green-100 text-green-400"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex gap-2">
              {/* Search with Icon */}
              <div className="relative w-64">
                <Search
                  className="absolute text-gray-400 pointer-events-none z-10 w-4 h-4"
                  style={{ left: "16px", top: "40%", transform: "translateY(-50%)" }}
                />
                <input
                  className="datatable-input w-full pr-4 py-2 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-9 placeholder-gray-400"
                  placeholder={t("filters.searchPlaceholder")}
                  style={{ paddingLeft: "40px" }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Campaign Filter */}
              <div className="relative w-48 modern-dropdown-wrapper small rounded-full campaign-dropdown-container">
                <button
                  className="modern-dropdown-button"
                  onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                >
                  <span>
                    {campaignFilter === "all"
                      ? t("assignmentPage.filter.allCampaigns")
                      : uniqueCampaigns.find((c) => c.id.toString() === campaignFilter)?.name ||
                        t("assignmentPage.filter.allCampaigns")}
                  </span>
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

                {showCampaignDropdown && (
                  <div className="modern-dropdown-menu open">
                    <button
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setCampaignFilter("all");
                        setShowCampaignDropdown(false);
                      }}
                    >
                      {t("assignmentPage.filter.allCampaigns")}
                    </button>
                    {uniqueCampaigns.map((campaign: { id: number; name: string }, idx: number) => (
                      <button
                        key={`${campaign.id}-${idx}`}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setCampaignFilter(campaign.id.toString());
                          setShowCampaignDropdown(false);
                        }}
                      >
                        {campaign.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Table Container with Fixed Height (VH) */}
            <div
              className="overflow-x-auto overflow-y-auto relative"
              style={{ height: "55vh", minHeight: "400px" }}
            >
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{t("table.campaignName")}</span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t("table.modules")}</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === "name" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("start")}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t("table.startDate")}</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === "start" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("end")}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t("table.endDate")}</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === "end" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t("table.status")}</span>
                        <span className="sort-icon text-gray-400">
                          {sortColumn === "status" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{t("table.action")}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="h-[400px]">
                        <div className="flex items-center justify-center">
                          <Spinner color="primary" label={t("assignmentPage.table.loading")} />
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCampaigns.length > 0 ? (
                    paginatedCampaigns.map((campaign: CampaignAssignment, index: number) => {
                      const status = getCampaignStatus(campaign);

                      // determine badge text specifically for org users based on numeric progress
                      let displayStatus: "active" | "pending" | "completed" | "inprogress" = status;
                      if (isOrgUserView) {
                        const p = Number(
                          campaign.progress_percent ?? campaign.progress_percentage
                        ) || 0;
                        if (p >= 100) {
                          displayStatus = "completed";
                        } else if (p > 0 && p < 100) {
                          displayStatus = "inprogress";
                        }
                      }

                      // id maps to module_id, which can repeat in the same campaign;
                      // include more fields plus index so keys stay unique per rendered row.
                      const rowKey = [
                        campaign.campaign_id ?? "no-campaign",
                        campaign.id,
                        campaign.start_date ?? "no-start",
                        campaign.end_date ?? "no-end",
                        index,
                      ].join("-");

                      return (
                        <tr key={rowKey} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {campaign.campaign_name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {campaignName(campaign, t)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <span>{formatDate(campaign.start_date, locale)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <span>{formatDate(campaign.end_date, locale)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">{getStatusBadge(displayStatus, t)}</td>
                          <td className="px-4 py-3.5">
                            {getActionButton(status, campaign, t, handleStartModule)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-12 text-center" colSpan={6}>
                        <div className="text-center py-12">
                          <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                            <SearchX className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {t("emptyState.title")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t("emptyState.description")}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 bg-gray-50 gap-3">
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <span>
                  {t("pagination.showing", {
                    start: (currentPage - 1) * itemsPerPage + 1,
                    end: Math.min(currentPage * itemsPerPage, filteredCampaigns.length),
                    total: filteredCampaigns.length,
                  })}
                </span>
              </div>
              <div className="flex gap-1.5" id="paginationButtons">
                <button
                  className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const buttons = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  // First page + ellipsis
                  if (startPage > 1) {
                    buttons.push(
                      <button
                        key="page-1"
                        className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      buttons.push(
                        <span key="ellipsis1" className="px-2 text-gray-400 flex items-center">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      );
                    }
                  }

                  // Page number buttons
                  for (let i = startPage; i <= endPage; i++) {
                    buttons.push(
                      <button
                        key={`page-${i}`}
                        className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${
                          i === currentPage
                            ? "bg-blue-50 text-blue-600 border-blue-500 font-semibold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Last page + ellipsis
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      buttons.push(
                        <span key="ellipsis2" className="px-2 text-gray-400 flex items-center">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      );
                    }
                    buttons.push(
                      <button
                        key={`page-${totalPages}`}
                        className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return buttons;
                })()}

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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
