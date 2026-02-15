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
  const campaignId = searchParams.get("campaign");

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch leaderboard data
  const { data: leaderboardRes, isLoading } = useCampaignLeaderboard(
    campaignId ? Number(campaignId) : 0,
    !!campaignId
  );

  const leaderboardData = leaderboardRes?.leaderboard || [];
  const campaignStats = leaderboardRes?.campaign_stats || {};

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return leaderboardData;

    const query = searchQuery.toLowerCase();
    return leaderboardData.filter((user: any) =>
      user.firstname?.toLowerCase().includes(query) ||
      user.lastname?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [leaderboardData, searchQuery]);

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

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRiskLevelProgressBar = (riskLevel?: string | number) => {
    if (!riskLevel) return <span className="text-gray-500">-</span>;

    const level = typeof riskLevel === "number" ? riskLevel : parseInt(riskLevel);
    const percentage = Math.min(100, Math.max(0, level));

    let bgColor = "bg-green-500";
    if (level > 75) bgColor = "bg-red-500";
    else if (level > 50) bgColor = "bg-orange-500";
    else if (level > 25) bgColor = "bg-yellow-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`${bgColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-600">{percentage}%</span>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6", isRtl && "text-right")}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Campaign User Leaderboard
              </h1>
              <Link
                href={`/dashboard/launch-awareness/campaigns/${campaignId}`}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
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
                <p className="text-lg font-semibold">
                  {campaignStats.campaign_name || "-"}
                </p>
              </div>
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                <img src="/awm/images/assing/assingment.svg" alt="" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Assigned Modules</p>
                <p className="text-lg font-semibold">
                  {campaignStats.total_modules || 0}
                </p>
              </div>
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                <img src="/awm/images/assing/assingment.svg" alt="" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Campaign Quizzes</p>
                <p className="text-lg font-semibold">
                  {campaignStats.total_quizzes || 0}
                </p>
              </div>
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                <img src="/awm/images/assing/pending.svg" alt="" />
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
                <img src="/awm/images/assing/res-rate.svg" alt="" />
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            <div className="relative w-64">
              <SearchX className="absolute text-gray-400 pointer-events-none z-10" 
                style={{
                  width: 16,
                  height: 16,
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                          <span>Completed Modules</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Progress</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Certificates</span>
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Achievements</span>
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
                          <span>Action</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((user: any, idx: number) => (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-800">{user.firstname || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{user.lastname || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-4 py-3">
                          {getRiskLevelProgressBar(user.risk_level)}
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {user.compliance_score || 0}%
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                            {user.completed_modules || 0}/{campaignStats.total_modules || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={clsx(
                                  "h-1.5 rounded-full transition-all duration-300",
                                  (user.progress_percentage || 0) >= 80 ? "bg-green-500" :
                                  (user.progress_percentage || 0) >= 60 ? "bg-blue-500" :
                                  (user.progress_percentage || 0) >= 40 ? "bg-yellow-500" :
                                  (user.progress_percentage || 0) >= 20 ? "bg-orange-500" : "bg-red-500"
                                )}
                                style={{
                                  width: `${user.progress_percentage || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-600">
                              {user.progress_percentage?.toFixed(0) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {user.completed_certificates || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                            {user.unlocked_achievements || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
                            {user.firstname?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {user.xp_tokens || 0} tokens
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                          >
                            Launch
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Users Found
                    </h3>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search query
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
              <div className="text-[10px] text-gray-400 font-medium">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, sortedData.length)} of{" "}
                  {sortedData.length} Entries
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-[10px] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-medium",
                      currentPage === page
                        ? "bg-[#051226] text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-[10px] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
