"use client";

import Image from "next/image";
import { UsersRound } from "lucide-react";

import { useTranslations } from "@/i18n/useTranslations";
import { AWM_BASE_PATH } from "@/services/jnrStorage";

interface DashboardSummaryCardsProps {
  childrenEnrolled: number;
  totalParents: number;
}

export function DashboardSummaryCards({
  childrenEnrolled,
  totalParents,
}: DashboardSummaryCardsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex min-h-[88px] items-center justify-between rounded-xl bg-[var(--primary-color)] px-5 py-4 text-white shadow-sm">
        <div>
          <p className="text-sm font-medium opacity-95">{t("stats.childrenEnrolled")}</p>
          <p className="mt-1 text-3xl font-bold">{childrenEnrolled}</p>
        </div>
        <Image
          alt=""
          className="h-16 w-16 object-contain"
          height={64}
          src={`${AWM_BASE_PATH}/images/avatars/1.png`}
          width={64}
        />
      </div>

      <div className="flex min-h-[88px] items-center justify-between rounded-xl bg-[#4BABDC] px-5 py-4 text-white shadow-sm">
        <div>
          <p className="text-sm font-medium opacity-95">{t("stats.totalParents")}</p>
          <p className="mt-1 text-3xl font-bold">{totalParents}</p>
        </div>
        <UsersRound aria-hidden className="size-14 shrink-0 opacity-90" strokeWidth={1.5} />
      </div>
    </div>
  );
}
