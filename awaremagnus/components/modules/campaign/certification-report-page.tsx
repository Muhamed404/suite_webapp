"use client";

import type { AwarenessReportParams } from "@/types/certificationReport";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import {
  Search,
  Download,
  Users,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Award,
  Target,
  TrendingUp,
  Shield,
  Clock,
  Star,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useAwarenessReportUsers } from "@/hooks/useCertificationReport";
import { useUserReportCard } from "@/hooks/useReportCard";

type SortField = "name" | "email" | "user_id";
type SortDirection = "asc" | "desc";

/* ─── Helpers ─── */
function num(val: string | number | null | undefined, fallback = 0): number {
  if (val == null) return fallback;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return Number.isFinite(n) ? n : fallback;
}

function formatStudyTime(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getRiskBadge(riskLevel?: string | null) {
  if (!riskLevel)
    return <span className="text-[10px] text-gray-400 italic">N/A</span>;

  const lower = riskLevel.toLowerCase();

  if (lower.includes("high")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
        <Shield className="w-3 h-3" /> {riskLevel}
      </span>
    );
  }
  if (lower.includes("medium")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">
        <Shield className="w-3 h-3" /> {riskLevel}
      </span>
    );
  }
  if (lower.includes("low")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
        <Shield className="w-3 h-3" /> {riskLevel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
      <Shield className="w-3 h-3" /> {riskLevel}
    </span>
  );
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return "#10b981";
  if (percent >= 50) return "#f59e0b";
  return "#ef4444";
}

/* ─── Progress Ring ─── */
function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3.5,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(value, 0), 100);
  const offset = c - (p / 100) * c;
  const color = getProgressColor(p);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-[9px] font-bold" style={{ color }}>
        {label ?? `${Math.round(p)}%`}
      </span>
    </div>
  );
}

/* ─── Stat Mini Card ─── */
function StatMiniCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 truncate">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{String(value)}</p>
      </div>
    </div>
  );
}

/* ─── Expandable Report Card Row ─── */
function UserReportCardPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: reportRes, isLoading } = useUserReportCard(userId, true);
  const result: any = reportRes?.success ? reportRes.data : undefined;
  const meta = result?.meta_statistics as Record<string, unknown> | undefined;
  const campaigns =
    (result?.campaigns as Array<{
      campaign_name: string;
      completed_modules: Array<{
        module_name: string;
        status: string;
        quiz_percentage?: number;
        achieved_xp_tokens: number;
        achieved_compliance_score: number;
        certificate_issued: string;
        module_completion_date: string | null;
        achievements_unlocked_in_module: number;
      }>;
    }>) ?? [];

  const modulesCompleted = (meta?.total_modules_completed as number) ?? 0;
  const totalCertificates = (meta?.total_completed_certificates as number) ?? 0;
  const quizAccuracy = num(meta?.quizzes_accuracy_percent as string | number | null | undefined);
  const xpTokens = num(meta?.xp_total_tokens as string | number | null | undefined);
  const studyTime = (meta?.total_study_time as number) ?? 0;
  const globalProgress = num(meta?.global_progress_percentage as string | number | null | undefined);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Spinner color="primary" size="sm" />
            <span className="text-xs text-gray-500">Loading report card…</span>
          </div>
        </td>
      </tr>
    );
  }

  if (!result) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 italic">
              No report card data available for this user.
            </p>
            <button
              className="text-gray-400 hover:text-gray-600 transition"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-t border-b border-blue-100 px-5 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Report Card</h4>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-600 font-medium">
                {campaigns.length} Campaign{campaigns.length !== 1 && "s"}
              </span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <StatMiniCard icon={GraduationCap} label="Modules Completed" value={modulesCompleted} iconBg="#dbeafe" iconColor="#3b82f6" />
            <StatMiniCard icon={Award} label="Certificates" value={totalCertificates} iconBg="#fef3c7" iconColor="#f59e0b" />
            <StatMiniCard icon={Target} label="Quiz Accuracy" value={`${quizAccuracy.toFixed(0)}%`} iconBg="#d1fae5" iconColor="#10b981" />
            <StatMiniCard icon={Star} label="XP Tokens" value={xpTokens.toLocaleString()} iconBg="#fee2e2" iconColor="#ef4444" />
            <StatMiniCard icon={Clock} label="Study Time" value={formatStudyTime(studyTime)} iconBg="#e0e7ff" iconColor="#6366f1" />
            <StatMiniCard icon={TrendingUp} label="Global Progress" value={`${globalProgress.toFixed(0)}%`} iconBg="#fce7f3" iconColor="#ec4899" />
          </div>

          {/* Campaign Modules */}
          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign, campIdx) => (
                <div key={campIdx} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">
                      {campaign.campaign_name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {campaign.completed_modules.length} module{campaign.completed_modules.length !== 1 && "s"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {campaign.completed_modules.map((mod, modIdx) => (
                      <div
                        key={modIdx}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-gray-50 rounded-lg text-[11px]"
                      >
                        <span className="font-medium text-gray-800 min-w-[140px]">
                          {mod.module_name}
                        </span>
                        <span className="text-orange-500 font-medium">
                          ⭐ +{mod.achieved_xp_tokens} XP
                        </span>
                        <span className="text-purple-500 font-medium">
                          🏆 {mod.achieved_compliance_score} pts
                        </span>
                        {mod.quiz_percentage !== undefined && (
                          <span className="text-blue-600">
                            📘 {mod.quiz_percentage.toFixed(0)}% Quiz
                          </span>
                        )}
                        {mod.module_completion_date && (
                          <span className="text-gray-400">
                            📅 {mod.module_completion_date}
                          </span>
                        )}
                        <span className="ml-auto">
                          {mod.status?.toLowerCase() === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-medium">
                              <Clock className="w-3 h-3" /> {mod.status || "In Progress"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 italic">No completed campaigns yet.</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Main Component ─── */
export function CertificationReportPage() {
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortDirection>("asc");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setCurrentPage(1);
      }, 400);
      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  // Build API params
  const params: AwarenessReportParams = useMemo(
    () => ({
      page: currentPage,
      limit: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [currentPage, perPage, sortBy, sortOrder, debouncedSearch]
  );

  // Fetch data
  const { data: reportRes, isLoading } = useAwarenessReportUsers(params);
  const users = reportRes?.success ? reportRes.data?.users ?? [] : [];
  const pagination = reportRes?.success ? reportRes.data?.pagination : undefined;
  const totalItems = pagination?.total_items ?? 0;
  const totalPages = pagination?.total_pages ?? 1;

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
      setCurrentPage(1);
    },
    [sortBy]
  );

  // Sortable header
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortBy === field;

    return (
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        role="button"
        tabIndex={0}
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSort(field);
          }
        }}
      >
        <span>{label}</span>
        <span className={clsx(isActive ? "text-blue-600" : "text-gray-400")}>
          {isActive && sortOrder === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : isActive && sortOrder === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    );
  };

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!users.length) return;
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Global Progress",
      "Modules Enrolled",
      "Modules Completed",
      "Certificates Earned",
      "Quizzes Passed",
      "Quiz Accuracy",
      "XP Tokens",
      "Compliance Score",
      "Risk Level",
      "Level",
      "Study Time (min)",
      "Streak Days",
    ];
    const rows = users.map((u) => {
      const d = u.dashboard;
      return [
        u.user_id,
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
        u.email ?? "",
        d ? `${num(d.global_progress_percent).toFixed(1)}%` : "",
        d?.total_modules_enrolled ?? "",
        d?.total_completed_modules ?? "",
        d?.total_completed_certificates ?? "",
        d?.total_quizzes_passed ?? "",
        d ? `${num(d.quizzes_accuracy_percent).toFixed(1)}%` : "",
        d?.xp_total_tokens ?? "",
        d?.total_compliance_score ?? "",
        d?.user_risk_level ?? "",
        d?.level_number ?? "",
        d?.total_study_time ?? "",
        d?.streak_day ?? "",
      ];
    });
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certification-report-users.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users]);

  const startIndex = totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  // Summary stats from current page data
  const summaryStats = useMemo(() => {
    const withDashboard = users.filter((u) => u.dashboard);
    const totalCerts = withDashboard.reduce(
      (sum, u) => sum + (u.dashboard?.total_completed_certificates ?? 0),
      0
    );
    const avgProgress =
      withDashboard.length > 0
        ? withDashboard.reduce(
            (sum, u) => sum + num(u.dashboard?.global_progress_percent),
            0
          ) / withDashboard.length
        : 0;
    return { totalCerts, avgProgress, usersWithData: withDashboard.length };
  }, [users]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("flex flex-col", isRtl && "text-right")}>
          {/* Breadcrumb */}
          <nav className="flex items-center text-xs text-gray-500 gap-1.5 p-3 pb-0">
            <Link className="hover:text-gray-700 transition" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <span className="font-semibold text-gray-900">Certification Report</span>
          </nav>

          <div className="flex flex-col px-3 gap-3 mt-2">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Certification Report</h3>
                  <p className="text-xs text-gray-500">
                    Awareness report users with progress tracking and report cards
                  </p>
                </div>
              </div>
              <Button
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition"
                radius="full"
                size="sm"
                startContent={<Download className="w-4 h-4" />}
                variant="bordered"
                onPress={handleExportCSV}
              >
                Export CSV
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-gray-500 text-xs">Total Users</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold">{totalItems}</h3>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-gray-500 text-xs">Total Certificates Earned</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold text-amber-600">
                    {summaryStats.totalCerts}
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-gray-500 text-xs">Avg Progress (Page)</p>
                <div className="flex justify-between items-center mt-1.5">
                  <h3 className="text-2xl font-semibold text-emerald-600">
                    {summaryStats.avgProgress.toFixed(1)}%
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-t-xl border border-gray-100">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="text-sm font-medium text-gray-900 mr-2">User List</h3>
                <Input
                  classNames={{
                    base: "w-64",
                    inputWrapper:
                      "h-9 bg-white border border-gray-200 rounded-full hover:border-gray-300 focus-within:!border-blue-500",
                    input: "text-xs",
                  }}
                  placeholder="Search by name or email..."
                  startContent={<Search className="text-gray-400 w-4 h-4" />}
                  type="text"
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl overflow-hidden border border-gray-100 border-t-0">
              <div
                className="overflow-x-auto overflow-y-auto relative"
                style={{ maxHeight: "60vh", minHeight: "350px" }}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <Spinner className="mb-4" color="primary" size="lg" />
                      <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="text-center py-12">
                      <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Users Found
                      </h3>
                      {debouncedSearch ? (
                        <p className="text-sm text-gray-500">
                          Try adjusting your search query.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No awareness report data is available yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <table
                    className="w-full text-xs whitespace-nowrap"
                    aria-label="Certification report users table"
                  >
                    <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3.5 text-left font-semibold">
                          <SortableHeader field="name" label="User" />
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Progress
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Modules
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Certificates
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Quiz Accuracy
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Risk Level
                        </th>
                        <th className="px-4 py-3.5 text-center font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => {
                        const initials =
                          `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
                          "?";
                        const d = user.dashboard;
                        const progress = num(d?.global_progress_percent);
                        const modulesEnrolled = d?.total_modules_enrolled ?? 0;
                        const modulesCompleted = d?.total_completed_modules ?? 0;
                        const certs = d?.total_completed_certificates ?? 0;
                        const certsAvail = d?.total_certificates_available ?? 0;
                        const accuracy = num(d?.quizzes_accuracy_percent);
                        const isExpanded = expandedUserId === user.user_id;

                        return (
                          <>
                            <tr
                              key={user.user_id}
                              className={clsx(
                                "hover:bg-gray-50 transition-colors cursor-pointer",
                                isExpanded && "bg-blue-50/50"
                              )}
                              onClick={() =>
                                setExpandedUserId(isExpanded ? null : user.user_id)
                              }
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {user.email ?? "—"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {d ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <ProgressRing value={progress} />
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-[10px] italic">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {d ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-gray-800">
                                      {modulesCompleted}/{modulesEnrolled}
                                    </span>
                                    <span className="text-[9px] text-gray-400">
                                      completed
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-[10px] italic">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {d ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-amber-600">
                                      {certs}/{certsAvail}
                                    </span>
                                    <span className="text-[9px] text-gray-400">
                                      earned
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-[10px] italic">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {d ? (
                                  <span
                                    className={clsx(
                                      "font-semibold",
                                      accuracy >= 80
                                        ? "text-emerald-600"
                                        : accuracy >= 50
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    )}
                                  >
                                    {accuracy.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-[10px] italic">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {getRiskBadge(d?.user_risk_level)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <button
                                  className={clsx(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all",
                                    isExpanded
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedUserId(
                                      isExpanded ? null : user.user_id
                                    );
                                  }}
                                >
                                  <BarChart3 className="w-3 h-3" />
                                  {isExpanded ? "Close" : "Report Card"}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <UserReportCardPanel
                                key={`rc-${user.user_id}`}
                                userId={user.user_id}
                                onClose={() => setExpandedUserId(null)}
                              />
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                    <span>
                      Showing {startIndex}–{endIndex} out of {totalItems} Entries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Per page:</span>
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                {totalPages > 1 && (
                  <Pagination
                    showControls
                    classNames={{
                      wrapper: "gap-1.5",
                      item: "min-w-8 h-8 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-100",
                      cursor: "bg-[#0ea5e9] text-white font-medium",
                      prev: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                      next: "min-w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100",
                    }}
                    page={currentPage}
                    radius="sm"
                    size="sm"
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
