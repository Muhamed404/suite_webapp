"use client";

import type { CampaignWithDetails } from "@/types/campaign";

import { useState, useMemo } from "react";
import { ChevronsUpDown, SearchX } from "lucide-react";

import { CampaignTableRow } from "./campaign-table-row";

import { useTranslations } from "@/i18n/useTranslations";

interface CampaignListProps {
  campaigns: CampaignWithDetails[];
  isLoading?: boolean;
  searchQuery: string;
}

export function CampaignList({ campaigns, isLoading, searchQuery }: CampaignListProps) {
  const t = useTranslations("campaigns");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;

    const query = searchQuery.toLowerCase();

    return campaigns.filter((campaign) => campaign.name.toLowerCase().includes(query));
  }, [campaigns, searchQuery]);

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    if (!sortConfig) return filteredCampaigns;

    return [...filteredCampaigns].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof CampaignWithDetails];
      let bValue: any = b[sortConfig.key as keyof CampaignWithDetails];

      if (sortConfig.key === "name") {
        aValue = a.name;
        bValue = b.name;
      }

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
  }, [filteredCampaigns, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: "asc" };
    });
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Fixed Height Table Container */}
      <div
        className="overflow-x-auto overflow-y-auto relative"
        style={{ height: "55vh", minHeight: "400px" }}
      >
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
            <tr>
              <th
                className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  <span>{t("table.campaignName")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.startDate")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.totalUsers")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.totalCertification")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.progress")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.modules")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.endDate")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{t("table.status")}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">
                <span>{t("table.action")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!isLoading &&
              sortedCampaigns.map((campaign) => (
                <CampaignTableRow key={campaign.id} campaign={campaign} />
              ))}
          </tbody>
        </table>

        {/* Empty State */}
        {!isLoading && sortedCampaigns.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                <SearchX className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("emptyState.title")}</h3>
              <p className="text-sm text-gray-500">{t("emptyState.description")}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center px-4 py-3.5 border-t bg-gray-50 gap-3">
        <div className="text-[10px] text-gray-400 font-medium">
          <span>
            Showing {sortedCampaigns.length > 0 ? 1 : 0}–{Math.min(sortedCampaigns.length, 10)} out
            of {sortedCampaigns.length} Entries
          </span>
        </div>
        <div className="flex gap-1.5">{/* Pagination buttons can be added here */}</div>
      </div>
    </div>
  );
}
