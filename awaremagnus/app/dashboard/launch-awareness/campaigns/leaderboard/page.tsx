"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ChevronsUpDown, SearchX } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { useCampaignLeaderboard } from "@/hooks/useCampaigns";

export default function CampaignLeaderboardPage() {
  const t = useTranslations("campaigns");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const searchParams = useSearchParams();
  const router = useRouter();

  if (!searchParams) return null;

  const campaignId = searchParams.get("campaign");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch leaderboard data
  const { data: leaderboardRes, isLoading } = useCampaignLeaderboard(
    campaignId ? Number(campaignId) : 0,
    !!campaignId
  );

  // The awmGet normalizer already extracts 'object' from the raw response
  // So leaderboardRes directly contains { meta_statistics, users, pagination }
  const rawUsers = leaderboardRes?.users || [];
  const metaStats = leaderboardRes?.meta_statistics || {};

  // Transform API response to match table expectations
  const leaderboardData = rawUsers.map((user: any) => {
    const progress = user.global_progress || 0;
    // Use status from API if available, otherwise default to "active"
    const status = user.status || "active";

    return {
      user_id: user.user_id,
      firstname: user.first_name || "-",
      lastname: user.last_name || "-",
      email: "-",
      last_login: user.last_login_time || null,
      risk_level: user.campaign_risk_level || 0,
      compliance_score: user.compliance_score || 0,
      completed_modules: user.modules_completed || 0,
      progress_percentage: progress,
      completed_certificates: user.certificates_completed || 0,
      unlocked_achievements: user.total_achievements_unlocked || 0,
      xp_tokens: user.xp_tokens_earned || 0,
      status,
      avatar_level: user.avatar_level || 1,
      quizzes_accuracy: user.quizzes_accuracy_percent || 0,
    };
  });

  const campaignStats = {
    campaign_name: metaStats.campaign_name || "-",
    total_modules: metaStats.total_campaign_modules || 0,
    total_quizzes: metaStats.total_campaign_quizzes || 0,
    avg_completion_percentage: metaStats.campaign_completion_percentage || 0,
  };

  // Filter by search and status
  const filteredData = useMemo(() => {
    let filtered = leaderboardData;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((user: any) => {
        const userStatus = user.status?.toLowerCase() || "active";

        return userStatus === statusFilter.toLowerCase();
      });
    }

    // Filter by search query
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();

    return filtered.filter(
      (user: any) =>
        user.firstname?.toLowerCase().includes(query) ||
        user.lastname?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [leaderboardData, searchQuery, statusFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof typeof a];
      let bValue: any = b[sortConfig.key as keyof typeof b];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: "asc" };
    });
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return "-";
    }
  };

  const getAvatarImage = (avatarLevel: number) => {
    // Avatar levels 0-9 map to images 1-10
    // Level 0 = image 1 (Vulnerable Newbie)
    // Level 1 = image 2 (Alert Apprentice)
    // ... Level 8 = image 9 (Expert Enforcer)
    const imageNumber = Math.min(9, Math.max(1, (avatarLevel || 0) + 1));

    return `/awm/images/avatars/${imageNumber}.png`;
  };

  const getRiskLevelBadge = (riskLevel?: string | number) => {
    if (!riskLevel) return <span className="text-gray-500">-</span>;

    const level = typeof riskLevel === "string" ? riskLevel : String(riskLevel);
    
    let bgColor = "bg-green-100";
    let textColor = "text-green-700";

    if (level.toLowerCase().includes("very high") || level.toLowerCase().includes("very_high")) {
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    } else if (level.toLowerCase().includes("high")) {
      bgColor = "bg-orange-100";
      textColor = "text-orange-700";
    } else if (level.toLowerCase().includes("medium")) {
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-700";
    } else if (level.toLowerCase().includes("low") && !level.toLowerCase().includes("very")) {
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
    } else if (level.toLowerCase().includes("very low") || level.toLowerCase().includes("very_low")) {
      bgColor = "bg-green-100";
      textColor = "text-green-700";
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${bgColor} ${textColor}`}>
        {level}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6", isRtl && "text-right")}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Campaign User Leaderboard</h1>
              <Link
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                href={`/dashboard/launch-awareness/campaigns/${campaignId}`}
              >
                ← Back to Campaign
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Campaign Name</p>
                <p className="text-lg font-semibold">{campaignStats.campaign_name || "-"}</p>
              </div>
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                <img alt="" src="/awm/images/assing/assingment.svg" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Assigned Modules</p>
                <p className="text-lg font-semibold">{campaignStats.total_modules || 0}</p>
              </div>
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                <img alt="" src="/awm/images/assing/assingment.svg" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Campaign Quizzes</p>
                <p className="text-lg font-semibold">{campaignStats.total_quizzes || 0}</p>
              </div>
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                <img alt="" src="/awm/images/assing/pending.svg" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Completion Progress</p>
                <p className="text-lg font-semibold">
                  {campaignStats.avg_completion_percentage?.toFixed(0) || 0}%
                </p>
              </div>
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                <img alt="" src="/awm/images/assing/res-rate.svg" />
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-full w-fit">
            {[
              { value: "all", label: "All", count: leaderboardData.length },
              {
                value: "active",
                label: "Active",
                count: leaderboardData.filter((u: any) => u.status?.toLowerCase() === "active")
                  .length,
              },
              {
                value: "pending",
                label: "Pending",
                count: leaderboardData.filter((u: any) => u.status?.toLowerCase() === "pending")
                  .length,
              },
              {
                value: "completed",
                label: "Completed",
                count: leaderboardData.filter((u: any) => u.status?.toLowerCase() === "completed")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                className={clsx(
                  "px-4 py-2 text-xs font-medium rounded-full transition-all",
                  statusFilter === tab.value
                    ? "bg-[#051226] text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    "ml-1 inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[10px]",
                    statusFilter === tab.value
                      ? "bg-white/30 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            <div className="relative w-64">
              <SearchX
                className="absolute text-gray-400 pointer-events-none z-10"
                style={{
                  width: 16,
                  height: 16,
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                className="w-full pl-10 pr-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Campaign..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Date Filter */}
            <select
              className="px-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="180">Last 6 Months</option>
              <option value="365">This Year</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div
              className="overflow-x-auto overflow-y-auto relative"
              style={{ height: "55vh", minHeight: "400px" }}
            >
              {paginatedData.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                    <tr>
                      <th
                        className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("firstname")}
                      >
                        <div className="flex items-center gap-2">
                          <span>First Name</span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("lastname")}
                      >
                        <div className="flex items-center gap-2">
                          <span>Last Name</span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("last_login")}
                      >
                        <div className="flex items-center gap-2">
                          <span>Last Login</span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("risk_level")}
                      >
                        <div className="flex items-center gap-2">
                          <span>Risk Level</span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("compliance_score")}
                      >
                        <div className="flex items-center gap-2">
                          <span>Compliance Score</span>
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Completed Module</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Progress</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Completed Certificates</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Unlocked Achievements</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Avatar Image</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>XP Tokens</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Action</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((user: any, idx: number) => (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-medium text-gray-700">{user.firstname || "-"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          <span>{user.lastname || "-"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                          <span>{formatDate(user.last_login)}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getRiskLevelBadge(user.risk_level)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="font-semibold text-gray-700">
                            {user.compliance_score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="text-gray-600">{user.completed_modules || 0}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-gray-200">
                              <div
                                className={clsx(
                                  "h-2 rounded-full transition-all duration-300",
                                  (user.progress_percentage || 0) >= 90
                                    ? "bg-green-500"
                                    : (user.progress_percentage || 0) >= 70
                                      ? "bg-blue-500"
                                      : (user.progress_percentage || 0) >= 50
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                )}
                                style={{
                                  width: `${user.progress_percentage || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {user.progress_percentage?.toFixed(0) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="font-semibold text-gray-700">
                            {user.completed_certificates || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={clsx(
                              "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                              "bg-purple-100 text-purple-700"
                            )}
                          >
                            {user.unlocked_achievements || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              alt={`Avatar Level ${user.avatar_level}`}
                              className="w-full h-full object-cover"
                              src={getAvatarImage(user.avatar_level)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="text-xs font-semibold text-gray-700">
                            {user.xp_tokens || 0} tokens
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold min-w-[100px] justify-center",
                              user.status?.toLowerCase() === "active"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : user.status?.toLowerCase() === "pending"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : user.status?.toLowerCase() === "completed"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-green-100 text-green-700 border border-green-200"
                            )}
                          >
                            <span>
                              {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) ||
                                "Active"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                            onClick={() =>
                              router.push(
                                `/dashboard/my-report-card?userId=${user.user_id}`
                              )
                            }
                          >
                            Full Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center py-12">
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                      <SearchX className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Users Found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search query</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
              <div className="text-[10px] text-gray-400 font-medium">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}{" "}
                  Entries
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-[10px] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={clsx(
                      "w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-medium",
                      currentPage === page
                        ? "bg-[#051226] text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-[10px] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
