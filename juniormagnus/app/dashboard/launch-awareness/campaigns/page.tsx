"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CampaignStatsCards } from "@/components/campaigns/campaign-stats-cards";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";

export default function CampaignsPage() {
  const t = useTranslations("campaigns");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: campaignsRes, isLoading } = useCampaigns({
    status_id: statusFilter !== "all" ? Number(statusFilter) : undefined,
  });

  // Extract data from response
  // API returns { campaigns: [...], meta_statistics: {...}, count: ... }
  const campaigns = campaignsRes?.campaigns || [];
  const metaStats = campaignsRes?.meta_statistics;

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: campaigns.length,
      active: 0,
      pending: 0,
      completed: 0,
    };

    campaigns.forEach((campaign: any) => {
      if (campaign.status_id === 2) counts.active++;
      else if (campaign.status_id === 20) counts.pending++;
      else if (campaign.status_id === 5) counts.completed++;
    });

    return counts;
  }, [campaigns]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-6", isRtl && "text-right")}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold text-gray-800">{t("title")}</h1>
            <Button
              as={Link}
              className="px-6 py-2 rounded-full bg-[#3FBDFF] text-white text-sm font-medium hover:bg-[#29AAE8]"
              href="/dashboard/launch-awareness/campaigns/create"
            >
              {t("createNew")}
            </Button>
          </div>

          {/* Stats Cards */}
          <CampaignStatsCards data={metaStats} />

          {/* Filters */}
          <CampaignFilters
            dateFilter={dateFilter}
            searchQuery={searchQuery}
            statusCounts={statusCounts}
            statusFilter={statusFilter}
            onDateChange={setDateFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
          />

          {/* Campaign Table */}
          <CampaignList campaigns={campaigns} isLoading={isLoading} searchQuery={searchQuery} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
