"use client";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AreaChart } from "@/components/modules/dashboard/charts/area-chart";
import { CircularProgressChart } from "@/components/modules/dashboard/charts/circular-progress-chart";
import { SemiCircleChart } from "@/components/modules/dashboard/charts/semi-circle-chart";
import { CertificationChart } from "@/components/modules/dashboard/charts/certification-chart";
import { DashboardTables } from "@/components/modules/dashboard/dashboard-tables";
import { GamificationStats } from "@/components/modules/dashboard/gamification-stats";
import clsx from "clsx";
import {
  isPlatformAdmin as getIsPlatformAdmin,
  isOrgAdmin as getIsOrgAdmin,
  isUser as getIsUser
} from "@/utils/roles";

import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  useSystemOverview,
  useOrganizationDashboards,
  useUserDashboards,
  useSystemStrugglingModules,
  useOrganizationStrugglingModules
} from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();

  const isPlatformAdmin = getIsPlatformAdmin(user?.role_id);
  const isOrgAdmin = getIsOrgAdmin(user?.role_id);
  const isUser = getIsUser(user?.role_id);

  // --- Data Fetching ---
  const { data: systemData } = useSystemOverview();
  const { data: orgDataResponse } = useOrganizationDashboards();
  const { data: userDataResponse } = useUserDashboards({ userId: user?.id });

  const { data: systemStrugglingRaw } = useSystemStrugglingModules();
  const { data: orgStrugglingRaw } = useOrganizationStrugglingModules();

  // Pick the right data source
  const dashboardData = useMemo(() => {
    if (isPlatformAdmin && systemData?.success) {
      return systemData.data;
    }
    if (isOrgAdmin && orgDataResponse?.success && orgDataResponse.data.dashboardOrganizations.length > 0) {
      return orgDataResponse.data.dashboardOrganizations[0];
    }
    if (isUser && userDataResponse?.success && userDataResponse.data.dashboardUsers.length > 0) {
      // Map User Data to generic structure where possible, or return specific
      return userDataResponse.data.dashboardUsers[0];
    }
    return null;
  }, [isPlatformAdmin, isOrgAdmin, isUser, systemData, orgDataResponse, userDataResponse]);

  const strugglingModules = useMemo(() => {
    if (isPlatformAdmin && systemStrugglingRaw?.success) {
      return systemStrugglingRaw.data.struggling_modules.slice(0, 3);
    }
    if (isOrgAdmin && orgStrugglingRaw?.success) {
      return orgStrugglingRaw.data.struggling_modules.slice(0, 3);
    }
    // Fallback to data inside dashboardData if available (Top 3 usually included in overview)
    if (dashboardData && 'top_struggling_modules' in dashboardData) {
      return (dashboardData as any).top_struggling_modules;
    }
    return [];
  }, [isPlatformAdmin, isOrgAdmin, systemStrugglingRaw, orgStrugglingRaw, dashboardData]);

  // Extract values with fallbacks
  const totalLicenses = 100; // API doesn't seem to have "Total Licenses", only "Total User Licenses" in spec image but mapped to... total_employees?
  // Spec says: "Total User Licenses / Total Consumed Licenses".
  // Implementation note says "Total User Licenses" is available.
  // BUT the JSON response for System Overview shows: total_organizations, total_employees_modules_enrolled, etc.
  // It does NOT show "total_licenses".
  // I will use placeholders or try to find a proxy.
  // total_employees_modules_enrolled could be "Consumed"?

  const consumedLicenses =
    (dashboardData && 'total_employees_modules_enrolled' in dashboardData) ? dashboardData.total_employees_modules_enrolled :
      (dashboardData && 'total_modules_enrolled' in dashboardData) ? dashboardData.total_modules_enrolled : 0;

  const complianceScore = dashboardData?.total_compliance_score || 0;
  const compliancePercent = dashboardData?.total_compliance_percent || 0;

  const globalProgress = (dashboardData && 'global_org_progress_percent' in dashboardData) ? dashboardData.global_org_progress_percent :
    (dashboardData && 'global_progress_percent' in dashboardData) ? dashboardData.global_progress_percent : 0;

  const xpTokens = (dashboardData && 'global_xp_total_tokens' in dashboardData) ? dashboardData.global_xp_total_tokens :
    (dashboardData && 'xp_total_tokens' in dashboardData) ? dashboardData.xp_total_tokens : 0;

  const totalCampaigns = dashboardData?.total_campaigns || 0;
  const weeklyProgress = dashboardData?.weekly_progress_percent || 0;
  const quizAccuracy = dashboardData?.quizzes_accuracy_percent || 0;
  const securityAwarenessScore = (dashboardData && 'total_compliance_score' in dashboardData) ? dashboardData.total_compliance_score : 0; // Or assumes same as compliance?
  const securityAwarenessMax = (dashboardData && 'maximum_compliance_score' in dashboardData) ? dashboardData.maximum_compliance_score : 100;

  // Risk Stats
  const riskStats = {
    low: (dashboardData && 'total_low_risk_employees' in dashboardData) ? dashboardData.total_low_risk_employees : 0,
    medium: (dashboardData && 'total_medium_risk_employees' in dashboardData) ? dashboardData.total_medium_risk_employees : 0,
    high: (dashboardData && 'total_high_risk_employees' in dashboardData) ? dashboardData.total_high_risk_employees : 0,
  };

  // Certification Stats
  const certStats = {
    certified: (dashboardData && 'total_certified_employees' in dashboardData) ? dashboardData.total_certified_employees : 0,
    uncertified: (dashboardData && 'total_uncertified_employees' in dashboardData) ? dashboardData.total_uncertified_employees : 0,
  };

  const activeLearners = (dashboardData && 'total_active_learner' in dashboardData) ? dashboardData.total_active_learner : 0;
  const trainingCompletionRate = (dashboardData && 'training_completion_rate' in dashboardData) ? dashboardData.training_completion_rate : 0;

  useEffect(() => {
    // Animate security posture bar segments
    const container = document.getElementById("segBar");
    if (container) {
      const items = container.querySelectorAll("div");
      // Calculate level based on compliance percent? 0-100 -> 0-7
      // 7 bars. 100/7 approx 14.
      const level = Math.ceil(compliancePercent / 14.3);

      items.forEach((item, index) => {
        setTimeout(() => {
          if (index < level) {
            (item as HTMLElement).style.opacity = "1";
          } else {
            (item as HTMLElement).style.opacity = "0.1";
          }
        }, index * 200);
      });
    }
  }, [compliancePercent]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col p-6 gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-medium">{t("page.title")}</h3>
          </div>
        </div>

        <div className="flex flex-col p-6 pt-0 gap-5">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-2" style={{ gridAutoRows: 'minmax(80px, auto)' }}>
            {/* Row 1: Total User Licenses (cols 1-4) */}
            <div className="col-span-4 row-start-1">
              <div className={clsx("bg-[linear-gradient(305deg,#4BABDC_0%,#5DB1FC_94.2%)] text-white rounded-xl p-4 flex gap-3 items-start h-full", isRtl && "flex-row-reverse")}>
                <Image src="/images/img/users-profile.svg" alt="" width={48} height={48} className="w-12 h-12" />
                <div className="flex flex-col">
                  <h3 className="text-base">{t("cards.totalUserLicenses")}</h3>
                  <p className="text-2xl">{totalLicenses}</p>
                </div>
              </div>
            </div>

            {/* Row 1: Consumed Licenses (cols 5-8) */}
            <div className="col-span-4 col-start-5 row-start-1">
              <div className={clsx("bg-white text-black rounded-xl p-4 flex gap-3 items-start h-full", isRtl && "flex-row-reverse")}>
                <Image src="/images/img/users-licanse.svg" alt="" width={48} height={48} className="w-12 h-12" />
                <div className="flex flex-col">
                  <h3 className="text-base">{t("cards.totalConsumedLicenses")}</h3>
                  <p className="text-2xl">{consumedLicenses}</p>
                </div>
              </div>
            </div>

            {/* Row 1-2: Organization Score (cols 9-12, spans 2 rows) */}
            <div className="col-span-4 col-start-9 row-start-1 row-span-2">
              <div className="bg-white rounded-xl p-5 space-y-3 h-full flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900">{isUser ? t("cards.myScore") : t("cards.organizationScore")}</h2>
                <h2 className="text-base text-gray-900">{t("cards.totalComplianceScore")}</h2>

                <div className="flex w-full items-center">
                  <div className={clsx("text-6xl text-gray-900", isRtl ? "ml-4" : "mr-4")}>{Math.round(compliancePercent / 10)}</div>
                  <div className="mt-1 flex-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: `${compliancePercent}%` }}></div>
                    </div>
                    <div className={clsx("text-base text-gray-500 font-medium mt-1.5", isRtl ? "text-left" : "text-right")}>{compliancePercent}%</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-5">
                  <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                    <Image src="/images/img/score.svg" alt="" width={24} height={24} className="w-6 h-6" />
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">{globalProgress}%</div>
                      <p className="text-gray-500 text-base">{t("cards.globalProgress")}</p>
                    </div>
                  </div>

                  <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                    <Image src="/images/img/score.svg" alt="" width={24} height={24} className="w-6 h-6" />
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">{xpTokens}</div>
                      <p className="text-gray-500 text-base">{t("cards.totalXpTokens")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                    <div className="w-2 h-8 bg-orange-400 rounded-full"></div>
                    <p className="text-gray-600 text-base leading-tight">
                      {t("cards.totalAwarenessCampaigns")}
                    </p>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{totalCampaigns}</div>
                </div>
              </div>
            </div>

            {/* Row 2: Security Posture (cols 1-8) */}
            <div className="col-span-8 col-start-1 row-start-2 row-span-1">
              <div className="bg-white rounded-xl p-4 flex items-center gap-5 w-full h-full">
                <div className={clsx("relative flex gap-3 items-center", isRtl && "flex-row-reverse")}>
                  <Image src="/images/shield-check.svg" alt="" width={16} height={16} className="w-4 h-4" />
                  <h3 className="text-base whitespace-nowrap">{t("cards.securityPosture")}</h3>

                  <Popover placement="bottom">
                    <PopoverTrigger>
                      <Button isIconOnly variant="light" className="min-w-4 w-4 h-4 p-0" aria-label="Info">
                        <Image src="/images/info-information.svg" alt="" width={16} height={16} className="w-4 h-4 cursor-pointer" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="p-5 text-sm bg-white border border-gray-300 rounded-xl w-80">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 me-2 shrink-0" fill="none" viewBox="0 0 24 24">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <h3 className="font-medium text-base">{t("cards.infoTitle")}</h3>
                          </div>
                        </div>
                        <div className="mt-2 mb-4 leading-relaxed text-sm">
                          {t("cards.infoBody")}
                        </div>
                        <Button className="text-white bg-blue-600 rounded-2xl text-sm px-3 py-1.5">{t("cards.viewMore")}</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1">
                  <div id="segBar" className="flex overflow-hidden rounded-lg w-full h-4" data-level={Math.ceil(compliancePercent / 14.3)}>
                    {["#9EC232", "#C1C625", "#EACB16", "#FFCD0F", "#EBA75C", "#E4590F", "#D1132A"].map((color, i) => (
                      <div key={i} className="h-4 w-full transition-all duration-300 opacity-0" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <p className="bg-red-600 text-white px-3 py-1 rounded-full text-base whitespace-nowrap">{t("cards.inRisk")}</p>
              </div>
            </div>

            {/* Row 3-5: Security Awareness Campaign (cols 1-8, spans 3 rows) */}
            <div className="col-span-8 col-start-1 row-start-3 row-span-3">
              <div className="bg-white rounded-xl p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{t("cards.securityAwarenessCampaign")}</h3>
                  <Link href="#" className="text-blue-600 text-base font-medium">{t("cards.viewAll")}</Link>
                </div>
                <p className="text-sm text-gray-400 mb-3">{t("cards.lastCampaignDate", { date: "1/23/05" })}</p>
                <div className="flex-1 min-h-0">
                  <AreaChart />
                </div>
              </div>
            </div>

            {/* Row 3-4: Weekly Progress & Quiz Accuracy (cols 9-12, spans 2 rows) */}
            <div className="col-span-4 col-start-9 row-start-3 row-span-2">
              <div className="grid grid-cols-2 p-3 rounded-xl bg-white gap-3 h-full">
                <div className="bg-[#F1F5F8] rounded-xl p-4 flex flex-col items-center justify-center">
                  <h3 className="text-base font-semibold mb-3">{t("cards.weeklyProgress")}</h3>
                  <CircularProgressChart value={weeklyProgress} color="#00CCC4" size={120} />
                </div>

                <div className="bg-[#F1F5F8] rounded-xl p-4 flex flex-col items-center justify-center">
                  <h3 className="text-base font-semibold mb-3">{t("cards.quizAccuracy")}</h3>
                  <CircularProgressChart value={quizAccuracy} color="#7CC5FA" size={120} />
                </div>
              </div>
            </div>

            {/* Row 5: Security Awareness Score (cols 9-12) */}
            <div className="col-span-4 col-start-9 row-start-5">
              <div className="bg-white rounded-xl p-5 flex flex-col h-full justify-center">
                <div className="flex justify-between items-center">
                  <div className={clsx("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                    <Image src="/images/icons/shield.svg" alt="" width={48} height={48} className="w-12 h-12" />
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{t("cards.securityAwarenessScore")}</h3>
                      <div className="flex items-center gap-1.5">
                        <p className="text-2xl text-gray-800">{securityAwarenessScore}</p>
                        <p className="text-gray-400 text-base font-medium">/{Number(securityAwarenessMax).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                  <span className="bg-[#00CCC4] text-white text-lg font-medium px-3 py-1 rounded-full">{t("cards.good")}</span>
                </div>
              </div>
            </div>

            {/* Row 6: Employee Risk States (cols 1-4) */}
            <div className="col-span-4 col-start-1 row-start-6">
              <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-between h-full">
                <h3 className="text-base font-semibold text-gray-800 mb-3">{t("cards.employeeRiskStates")}</h3>
                <SemiCircleChart sent={riskStats.low} opened={riskStats.medium} admin={riskStats.high} color1="#3ACE89" color2="#BEC3C7" color3="#FB5050" />
              </div>
            </div>

            {/* Row 6: Employee Certification (cols 5-8) */}
            <div className="col-span-4 col-start-5 row-start-6">
              <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-between h-full">
                <h3 className="text-base font-semibold text-gray-800 mb-3">{t("cards.employeeCertification")}</h3>
                <CertificationChart value={Math.round((certStats.certified / (certStats.certified + certStats.uncertified || 1)) * 100)} color="#3ACE89" color2="#FB5050" />

                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>{t("cards.certified", { count: certStats.certified })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>{t("cards.notCertified", { count: certStats.uncertified })}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 6: Right Column - All three widgets stacked (cols 9-12) */}
            <div className="col-span-4 col-start-9 row-start-6 row-span-1">
              <div className="flex flex-col gap-2 h-full">
                {/* Top 3 Struggling Topics - Very compact */}
                <div className="bg-white rounded-xl p-3 flex flex-col flex-1 min-h-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">{t("cards.top3StrugglingTopics")}</h3>
                    <Link href="#" className="text-blue-600 text-xs font-medium">{t("cards.viewAll")}</Link>
                  </div>

                  <div className="space-y-1">
                    {strugglingModules.length > 0 ? strugglingModules.map((topic: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-[#F0F7F9] rounded-lg py-1.5 px-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]`}>
                            <Image src="/images/icons/alert.svg" alt="" width={12} height={12} className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{topic.module_name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{topic.failure_rate}% Fail</span>
                      </div>
                    )) : (
                      <div className="text-xs text-gray-400 italic">No struggling topics</div>
                    )}
                  </div>

                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <Image src="/images/icons/alert.svg" alt="" width={12} height={12} className="w-3 h-3" />
                    {t("cards.employeesNeedAttention")}
                  </p>
                </div>

                {/* Active Learners - Compact */}
                <div className="bg-[#10B981] text-white rounded-xl p-3 flex justify-between items-center flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-medium opacity-90">{t("cards.activeLearnersThisMonth")}</h3>
                    <p className="text-xl">{activeLearners}</p>
                  </div>
                  <div className="w-10 h-10">
                    <Image src="/images/check-fr.svg" alt="" width={40} height={40} className="w-10 h-10" />
                  </div>
                </div>

                {/* Training Completion Rate - Compact */}
                <div className="bg-[#A78BFA] text-white rounded-xl p-3 flex justify-between items-center flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-medium opacity-90">{t("cards.trainingCompletionRate")}</h3>
                    <p className="text-xl">{trainingCompletionRate}%</p>
                  </div>
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Section - Gamification */}
          <div className="mt-4">
            <GamificationStats />
          </div>

          {/* Third Section - Tables */}
          <div className="mt-0">
            <DashboardTables />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
