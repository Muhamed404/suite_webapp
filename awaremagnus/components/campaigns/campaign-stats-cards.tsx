"use client";

import type { CampaignMetaStatistics } from "@/types/campaign";

import { useTranslations } from "@/i18n/useTranslations";

interface CampaignStatsCardsProps {
  data?: CampaignMetaStatistics;
}

export function CampaignStatsCards({ data }: CampaignStatsCardsProps) {
  const t = useTranslations("campaigns");

  const stats = [
    {
      label: t("stats.totalCampaigns"),
      value: data?.total_campaigns || 0,
      icon: "/awm/images/assing/assingment.svg",
      bgColor: "bg-red-100",
    },
    {
      label: t("stats.totalEnrolledUsers"),
      value: data?.total_enrolled_users_all || 0,
      icon: "/awm/images/assing/assingment.svg",
      bgColor: "bg-green-100",
    },
    {
      label: t("stats.totalCertification"),
      value: data?.total_completed_certifications_all || 0,
      icon: "/awm/images/assing/pending.svg",
      bgColor: "bg-gray-200",
    },
    {
      label: t("stats.completionProgress"),
      value: `${data?.average_completion_percentage_all?.toFixed(0) || 0}%`,
      icon: "/awm/images/assing/res-rate.svg",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl p-3 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-semibold">{stat.value}</p>
          </div>
          <div className={`w-7 h-7 ${stat.bgColor} rounded-full flex items-center justify-center`}>
            <img alt="" className="w-4 h-4" src={stat.icon} />
          </div>
        </div>
      ))}
    </div>
  );
}
