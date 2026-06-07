"use client";

import type { CampaignWithDetails } from "@/types/campaign";

import { useState } from "react";
import Link from "next/link";
import { Play, FileText } from "lucide-react";

import { CampaignStatusBadge } from "./campaign-status-badge";

import { useTranslations } from "@/i18n/useTranslations";
import { useUpdateCampaign } from "@/hooks/useCampaigns";

interface CampaignTableRowProps {
  campaign: CampaignWithDetails;
}

export function CampaignTableRow({ campaign }: CampaignTableRowProps) {
  const t = useTranslations("campaigns");
  const updateCampaign = useUpdateCampaign();
  const [isLaunching, setIsLaunching] = useState(false);

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLaunchCampaign = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLaunching(true);

    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        payload: { campaign: { status_id: 2 } }, // ACTIVE status (2, not 1)
      });
    } catch (error) {
      console.error("Failed to launch campaign:", error);
      alert("Failed to launch campaign. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-800 font-medium">{campaign.name}</td>
      <td className="px-4 py-3 text-gray-600">{formatDate(campaign.start_date)}</td>
      <td className="px-4 py-3 text-gray-600">{campaign.statistics?.total_enrolled_users || 0}</td>
      <td className="px-4 py-3 text-gray-600">
        {campaign.statistics?.total_completed_certifications || 0}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${campaign.statistics?.campaign_completion_percentage || 0}%`,
              }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {campaign.statistics?.campaign_completion_percentage?.toFixed(0) || 0}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {campaign.statistics?.total_modules || campaign.modules?.length || 0}
      </td>
      <td className="px-4 py-3 text-gray-600">{formatDate(campaign.end_date)}</td>
      <td className="px-4 py-3">
        <CampaignStatusBadge statusId={campaign.status_id} statusName={campaign.status?.name} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Show Launch button for In Progress (20) campaigns - with launch functionality */}
          {campaign.status_id === 20 && (
            <button
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 w-32 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLaunching || updateCampaign.isPending}
              title={t("launch")}
              onClick={handleLaunchCampaign}
            >
              <Play className="w-3.5 h-3.5" />
              {isLaunching ? "Launching..." : t("launch")}
            </button>
          )}

          {/* Show View Reports button for Active (2) campaigns - redirects to details page */}
          {campaign.status_id === 2 && (
            <Link
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 w-32 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-full transition-colors"
              href={`/dashboard/launch-awareness/campaigns/${campaign.id}`}
              title={t("viewReport")}
            >
              <FileText className="w-3.5 h-3.5" />
              {t("viewReport")}
            </Link>
          )}

          {/* Show View Report button for Completed (5) campaigns */}
          {campaign.status_id === 5 && (
            <Link
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 w-32 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-full transition-colors"
              href={`/dashboard/launch-awareness/campaigns/${campaign.id}`}
              title={t("viewReport")}
            >
              <FileText className="w-3.5 h-3.5" />
              {t("viewReport")}
            </Link>
          )}

          {/* For Cancelled (3), show View Details link */}
          {campaign.status_id === 3 && (
            <Link
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 w-32 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              href={`/dashboard/launch-awareness/campaigns/${campaign.id}`}
              title={t("viewDetails")}
            >
              <FileText className="w-3.5 h-3.5" />
              {t("viewDetails")}
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
