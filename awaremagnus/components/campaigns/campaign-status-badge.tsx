"use client";

import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

interface CampaignStatusBadgeProps {
  statusId: number;
  statusName?: string;
}

export function CampaignStatusBadge({ statusId, statusName }: CampaignStatusBadgeProps) {
  const t = useTranslations("campaigns");

  const getStatusConfig = (id: number) => {
    switch (id) {
      case 1: // Draft
        return { color: "bg-gray-100 text-gray-700", label: t("status.draft") };
      case 2: // Active
        return { color: "bg-green-100 text-green-700", label: t("status.active") };
      case 3: // Cancelled
        return { color: "bg-red-100 text-red-700", label: t("status.cancelled") };
      case 4: // Pending
        return { color: "bg-yellow-100 text-yellow-700", label: t("status.pending") };
      case 5: // Completed
        return { color: "bg-blue-100 text-blue-700", label: t("status.completed") };
      case 20: // In Progress
        return { color: "bg-yellow-100 text-yellow-700", label: t("status.inProgress") };
      default:
        return { color: "bg-gray-100 text-gray-700", label: statusName || "Unknown" };
    }
  };

  const config = getStatusConfig(statusId);

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
