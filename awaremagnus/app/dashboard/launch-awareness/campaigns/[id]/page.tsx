"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, Play, Trophy } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Tooltip } from "@heroui/tooltip";
import Chart from "react-apexcharts";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CertificationChart } from "@/components/modules/dashboard/charts/certification-chart";
import { SemiCircleChart } from "@/components/modules/dashboard/charts/semi-circle-chart";
import { useUpdateCampaign, useCampaignDashboard } from "@/hooks/useCampaigns";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import {
  useOrganizationLeaderboard,
  useOrganizationCampaignCompletions,
  useAchievementStatisticsByCampaign,
  useAchievementStatisticsWithCampaign,
  useAvatarStatisticsByCampaign,
} from "@/hooks/useDashboard";
import { getLanguageId } from "@/utils/languageMapping";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { dir, locale } = useI18n();
  const isRtl = dir === "rtl";
  const t = useTranslations("dashboard");


  const campaignId = params?.id ? Number(params.id) : 0;
  const updateCampaign = useUpdateCampaign();

  const { data: campaignDashboard, isLoading } = useCampaignDashboard(campaignId);

  const { data: leaderboardData } = useOrganizationLeaderboard({
    campaignId,
    count: 10,
  });
  const currentLanguageId = getLanguageId(locale as "en" | "ar");
  const { data: campaignCompletionsData } = useOrganizationCampaignCompletions({
    campaign_id: campaignId,
    language_id: currentLanguageId,
  });
  const { data: achievementData } = useAchievementStatisticsByCampaign(campaignId);
  const { data: generalAchievementData } = useAchievementStatisticsWithCampaign(campaignId);
  const { data: avatarData } = useAvatarStatisticsByCampaign(campaignId);

  const achievementUnlocked = achievementData?.object?.total_unique_achievements_unlocked ?? 0;
  const achievementTotal = achievementData?.object?.total_achievements || 50;
  const achievementPercent =
    achievementTotal > 0 ? Math.round((achievementUnlocked / achievementTotal) * 100) : 0;

  // Set of achievement numbers (1-16) present in the backend response. We
  // parse the leading number from `image_small_url` (e.g. "1-quick-learner.png").
  const unlockedAchievementNumbers = useMemo(() => {
    const set = new Set<number>();
    const items = achievementData?.object?.achievement_statistics ?? [];

    for (const a of items) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d{1,2})/);

      if (!m) continue;
      const n = Number(m[1]);

      if (n >= 1 && n <= 16) set.add(n);
    }

    return set;
  }, [achievementData]);

  // Map: achievement number → full stats object (for tooltip data)
  const achievementByNumber = useMemo(() => {
    const map = new Map<number, any>();
    const items = achievementData?.object?.achievement_statistics ?? [];

    for (const a of items) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d{1,2})/);

      if (!m) continue;
      const n = Number(m[1]);

      if (n >= 1 && n <= 16) map.set(n, a);
    }

    return map;
  }, [achievementData]);

  // Display order: unlocked achievements first, then locked — capped at 16
  const achievementDisplayOrder = useMemo(() => {
    const all = Array.from({ length: 16 }, (_, i) => i + 1);

    return all.sort((a, b) => {
      const aUnlocked = unlockedAchievementNumbers.has(a) ? 0 : 1;
      const bUnlocked = unlockedAchievementNumbers.has(b) ? 0 : 1;

      return aUnlocked - bUnlocked;
    });
  }, [unlockedAchievementNumbers]);

  const avatarImageByLevel: Record<number, string> = {
    1: "Vulnerablenewbe_Level1_Robot.png",
    2: "AlertApprentice_Level2_Robot.png",
    3: "CautiousLearner_Level3_Robot.png",
    4: "InformedDefender_Level4_Robot.png",
    5: "VigilantGuardian_Level5_Robot.png",
    6: "SkilledSentinel._Level6_Robot.png",
    7: "ResilientProtector_Level7_Robot.png",
    8: "AdvancedWatchman_Level8_Robot.png",
    9: "ExpertEnforcer_Level9_Robot.png",
    10: "MasterStrategist_Level10_Robot.png",
    11: "EliteVanguard_Level11_Robot.png",
    12: "LegendaryShieldbearer_Level12_Robot.png",
    13: "SupremeCyberKnight_Level13_Robot.png",
    14: "UltimateCyberSentinel_Level14_Robot.png",
  };

  const resolveAvatarImage = (avatar?: any) => {
    if (!avatar) return "1.png";
    return avatarImageByLevel[avatar.level_number] ?? avatar.image_small_url ?? "1.png";
  };

  // Find the unlocked avatar with the highest level to show in the main slot
  const avatarStats = useMemo(() => {
    const items = (avatarData?.object?.avatar_statistics ?? []) as any[];
    return [...items].sort((a, b) => {
      const aUnlocked = (a.employee_count ?? 0) > 0 ? 0 : 1;
      const bUnlocked = (b.employee_count ?? 0) > 0 ? 0 : 1;

      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return b.level_number - a.level_number;
    });
  }, [avatarData]);

  const mainAvatar = useMemo(() => {
    if (avatarStats.length === 0) {
      return {
        level_number: 1,
        level_name: "Vulnerable Newbie",
        min_score_or_percentage: 0,
        max_score_or_percentage: 6,
        image_small_url: "Vulnerablenewbe_Level1_Robot.png",
        employee_count: 0,
      };
    }

    return avatarStats[0];
  }, [avatarStats]);

  // Check if main avatar is unlocked (has employee_count > 0)
  const isMainAvatarUnlocked = (mainAvatar?.employee_count ?? 0) > 0;

  const handleLaunchCampaign = async () => {
    if (!campaignDashboard) return;

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        payload: { campaign: { status_id: 2 } }, // ACTIVE status
      });
      // Optionally refresh the campaign data or show success message
      alert("Campaign launched successfully!");
    } catch (error) {
      console.error("Failed to launch campaign:", error);
      alert("Failed to launch campaign. Please try again.");
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateRemainingDays = () => {
    if (!campaignDashboard?.end_date) return 0;
    const end = new Date(campaignDashboard.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, diff);
  };

  const calculateProgress = () => {
    if (!campaignDashboard?.start_date || !campaignDashboard?.end_date) return 0;
    const start = new Date(campaignDashboard.start_date).getTime();
    const end = new Date(campaignDashboard.end_date).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;
    const total = end - start;
    const elapsed = now - start;

    return Math.round((elapsed / total) * 100);
  };

  const progress = calculateProgress();
  const remainingDays = campaignDashboard?.remaining_days ?? calculateRemainingDays();
  const totalCampaignDays =
    campaignDashboard?.start_date && campaignDashboard?.end_date
      ? Math.max(
          1,
          Math.ceil(
            (new Date(campaignDashboard.end_date).getTime() -
              new Date(campaignDashboard.start_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const remainingDaysPercent =
    totalCampaignDays > 0
      ? Math.max(0, Math.min(100, Math.round((remainingDays / totalCampaignDays) * 100)))
      : 0;
  const remainingDaysRadius = 34;
  const remainingDaysCircumference = 2 * Math.PI * remainingDaysRadius;

  const completionsPayload = ((campaignCompletionsData as any)?.object || (campaignCompletionsData as any)?.data || {});
  const completionCampaigns = Array.isArray(completionsPayload?.campaigns)
    ? completionsPayload.campaigns
    : [];
  const selectedCompletionCampaign = completionCampaigns.find(
    (campaign: any) => Number(campaign?.campaign_id) === campaignId
  );
  const completedModuleRows = Array.isArray(selectedCompletionCampaign?.completed_modules)
    ? selectedCompletionCampaign.completed_modules
    : [];

  const modules = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of completedModuleRows) {
      const moduleId = Number(row?.module_id || 0);
      if (!moduleId) continue;
      const moduleName = row?.module_name || `Module ${moduleId}`;
      if (!map.has(moduleId)) map.set(moduleId, moduleName);
    }

    const items = Array.from(map.entries()).map(([moduleId, moduleName]) => ({
      moduleId,
      moduleName,
    }));

    return items.sort((a, b) => {
      const nameCompare = a.moduleName.localeCompare(b.moduleName);
      return nameCompare !== 0 ? nameCompare : a.moduleId - b.moduleId;
    });
  }, [completedModuleRows]);

  const parseYmdDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  // Extract min/max dates for chart x-axis range
  const completionDates = completedModuleRows
    .map((row: any) => {
      const date = parseYmdDate(row?.module_completion_date);
      return date ? date.getTime() : null;
    })
    .filter((time: number | null): time is number => time !== null);

  const minDate = completionDates.length > 0 ? Math.min(...completionDates) : null;
  const maxDate = completionDates.length > 0 ? Math.max(...completionDates) : null;
  const hasSingleDate = minDate !== null && maxDate !== null && minDate === maxDate;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const xAxisMin = hasSingleDate
    ? ((minDate ?? 0) - oneDayMs)
    : (minDate ?? undefined);
  const xAxisMax = hasSingleDate
    ? ((maxDate ?? 0) + oneDayMs)
    : (maxDate ?? undefined);

  // multi-day ranges compute number of days and cap ticks to 7 to avoid clutter.
  const _xMin = xAxisMin as number | undefined;
  const _xMax = xAxisMax as number | undefined;
  const dateSpanMs = _xMin !== undefined && _xMax !== undefined ? Math.max(0, _xMax - _xMin) : 0;
  const spanDays = dateSpanMs > 0 ? Math.ceil(dateSpanMs / oneDayMs) : 0;
  const xAxisTickAmount = hasSingleDate ? 3 : spanDays > 0 ? Math.min(7, spanDays + 1) : undefined;

  // Transform completion data for ApexCharts
  const completionGraphPoints: Array<{
    x: number;
    y: number;
    moduleId: number;
    moduleName: string;
    userName: string;
    formattedDate: string;
  }> = completedModuleRows
    .map((row: any) => {
      const moduleId = Number(row?.module_id || 0);
      const completionDate = parseYmdDate(row?.module_completion_date);
      if (!moduleId || !completionDate) return null;

      const moduleName = row?.module_name || modules.find((m) => m.moduleId === moduleId)?.moduleName || `Module ${moduleId}`;
      const fullName = `${row?.first_name ?? ""} ${row?.last_name ?? ""}`.trim();
      const formattedDate = completionDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      return {
        x: completionDate.getTime(),
        y: modules.findIndex((m) => m.moduleId === moduleId) + 1,
        moduleId,
        moduleName,
        userName: fullName || `User ${row?.user_id || "-"}`,
        formattedDate,
      };
    })
    .filter((item: any): item is {
      x: number;
      y: number;
      moduleId: number;
      moduleName: string;
      userName: string;
      formattedDate: string;
    } => item !== null);
  // Chart data (only x and y for ApexCharts)
  const completionGraphData = completionGraphPoints.map(
    (point: { x: number; y: number }) => ({ x: point.x, y: point.y })
  );



  const orgLeaderboard = (leaderboardData as any)?.object || (leaderboardData as any)?.data || {};
  const topHighRiskEmployees = Array.isArray(orgLeaderboard?.top_high_risk_employees)
    ? orgLeaderboard.top_high_risk_employees
    : [];
  const topLowRiskEmployees = Array.isArray(orgLeaderboard?.top_low_risk_employees)
    ? orgLeaderboard.top_low_risk_employees
    : [];


  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className={clsx("p-3", isRtl && "text-right")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                className="hover:bg-gray-100"
                size="sm"
                variant="light"
                onClick={() => router.push("/dashboard/launch-awareness/campaigns")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="text-xs text-gray-500">
                Awareness Campaign &gt; {campaignDashboard?.name || `Campaign ${campaignId}`}
              </div>
            </div>

            {campaignDashboard?.status_id === 20 && (
              <Button
                className="text-white"
                color="primary"
                isLoading={updateCampaign.isPending}
                size="sm"
                startContent={<Play className="w-4 h-4" />}
                onClick={handleLaunchCampaign}
              >
                Launch Campaign
              </Button>
            )}

            <Button
              className="border-gray-300"
              size="sm"
              startContent={<Trophy className="w-4 h-4" />}
              variant="bordered"
              onClick={() =>
                router.push(
                  `/dashboard/launch-awareness/campaigns/leaderboard?campaign=${campaignId}`
                )
              }
            >
              Leaderboard
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2">
            <div className="bg-white p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 col-span-8 row-span-5">
              <div className="space-y-3 text-gray-700">
                <h2 className="text-lg font-semibold mb-4">
                  {campaignDashboard?.name || "Campaign"}
                </h2>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Name</span>
                  <span className="col-span-2">{campaignDashboard?.name || "-"}</span>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Description</span>
                  <span className="col-span-2">{campaignDashboard?.description || "-"}</span>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Department</span>
                  <span className="col-span-2">
                    {campaignDashboard?.departments?.list && campaignDashboard.departments.list.length > 0 ? (
                      campaignDashboard.departments.list
                        .map((d: any) => d.name || d.department_name || `Dept ${d.id}`)
                        .join(', ')
                    ) : (
                      campaignDashboard?.departments?.total ?? 0
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Group</span>
                  <div className="col-span-2 flex items-center gap-1">
                    {campaignDashboard?.groups?.list && campaignDashboard.groups.list.length > 0 ? (
                      campaignDashboard.groups.list.map((g: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-[2px] border border-red-300 rounded-full text-red-400 text-[10px]"
                        >
                          {g.name || g.group_name || `Group ${g.id}`}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-[2px] border border-red-300 rounded-full text-red-400 text-[10px]">
                        {campaignDashboard?.groups?.total ?? 0} Group(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Users</span>
                  <span className="col-span-2">{campaignDashboard?.total_users_enrolled || 0}</span>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">Start Date</span>
                  <span className="col-span-2">{formatDate(campaignDashboard?.start_date)}</span>
                </div>

                <div className="grid grid-cols-3 text-xs">
                  <span className="font-medium">End Date</span>
                  <span className="col-span-2">{formatDate(campaignDashboard?.end_date)}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4">
                    <img alt="" className="w-full h-full" src="/awm/images/img/calendar.svg" />
                  </span>
                  <h3 className="font-semibold text-gray-800 text-sm">Topics Schedule</h3>
                </div>

                <div className="space-y-2 text-gray-700 text-xs">
                  {campaignDashboard?.upcoming_topics && campaignDashboard.upcoming_topics.length > 0 ? (
                    campaignDashboard.upcoming_topics.map((topic: any, idx: number) => (
                      <p key={idx}>
                        {topic.module_name || `Module ${topic.module_id}`} {formatDate(topic.start_date)}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400">No schedule available</p>
                  )}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                    <input
                      readOnly
                      checked={campaignDashboard?.status_id === 2}
                      className="w-3.5 h-3.5 rounded border-gray-400"
                      type="checkbox"
                    />
                    Campaign Status
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs">
                      {campaignDashboard?.status_id === 2 ? "Active" : "Inactive"}
                    </span>

                    <label className="relative inline-flex items-center">
                      <input
                        readOnly
                        checked={campaignDashboard?.status_id === 2}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-6 h-3 bg-gray-400 peer-checked:bg-blue-500 rounded-full transition" />
                      <div className="absolute left-[0px] top-[1.2px] bg-white w-2.5 h-2.5 rounded-full peer-checked:translate-x-3 transition" />
                    </label>
                  </div>
                </div>
                {/* Enabled Features */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-gray-700 font-medium text-xs mb-2">Enabled Features</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {campaignDashboard?.settings?.enable_gamification && (
                      <span>✓ Gamification</span>
                    )}
                    {campaignDashboard?.settings?.enable_quiz && <span>✓ Quiz</span>}
                    {campaignDashboard?.settings?.enable_certificate && <span>✓ Certificate</span>}
                    {campaignDashboard?.settings?.enable_motion_videos && <span>✓ Videos</span>}
                    {campaignDashboard?.settings?.enable_interactive_ispring && (
                      <span>✓ Interactive</span>
                    )}
                    {campaignDashboard?.settings?.enable_documents && <span>✓ Documents</span>}
                    {campaignDashboard?.settings?.enable_games && <span>✓ Games</span>}
                    {campaignDashboard?.settings?.enable_misc_items && <span>✓ Miscellaneous</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Days Card */}
            <div className="col-span-4 row-span-2 col-start-9">
              <div className="bg-white rounded-xl p-4 h-full">
                <div className="flex justify-between items-start">
                  <p className="text-gray-600 text-xs">Remaining days</p>
                  <div className="w-6 h-6">
                    <img alt="" className="w-full h-full" src="/awm/images/profile.svg" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        cx="50"
                        cy="50"
                        fill="none"
                        r={remainingDaysRadius}
                        stroke="currentColor"
                        strokeWidth="8"
                      />
                      <circle
                        className="text-sky-500"
                        cx="50"
                        cy="50"
                        fill="none"
                        r={remainingDaysRadius}
                        stroke="currentColor"
                        strokeDasharray={`${(remainingDaysPercent / 100) * remainingDaysCircumference} ${remainingDaysCircumference}`}
                        strokeLinecap="round"
                        strokeWidth="8"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-sky-500">{remainingDays}</span>
                      <span className="text-[10px] font-medium text-gray-600">Days</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 leading-5">
                    <p className="font-medium text-gray-800">Timeline</p>
                    <p>{remainingDaysPercent}% remaining</p>
                    <p>Total {totalCampaignDays || 0} days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Progress */}
            <div className="col-span-8 row-span-2 col-start-1 row-start-6">
              <div className="bg-white rounded-xl p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-gray-800 text-sm font-bold">Module Completion Timeline</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{completionGraphPoints.length} completions • {modules.length} modules</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-400/40" />
                        <span>Completion</span>
                      </div>
                    </div>
                  </div>

                  {completionGraphPoints.length > 0 ? (
                    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 rounded-lg p-4 border border-blue-100/50 shadow-sm w-full">
                      <Chart
                        options={{
                          chart: {
                            type: "scatter",
                            sparkline: { enabled: false },
                            toolbar: {
                              show: false,
                            },
                            zoom: {
                              enabled: false,
                            },
                            parentHeightOffset: 0,
                          },
                          colors: ["#3B82F6"],
                          plotOptions: {
                            bubble: {
                              minBubbleRadius: 3,
                              maxBubbleRadius: 8,
                            },
                          } as any,
                          xaxis: {
                            type: "datetime",
                            min: xAxisMin,
                            max: xAxisMax,
                            title: {
                              text: "Date",
                              style: {
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#475569",
                              },
                            },
                            labels: {
                              format: "dd MMM",
                              datetimeUTC: false,
                              showDuplicates: false,
                              style: {
                                fontSize: "11px",
                                fontWeight: 500,
                                colors: "#64748B",
                              },
                            },
                            axisBorder: {
                              show: true,
                              color: "#94A3B8",
                              height: 1,
                            },
                            axisTicks: {
                              show: false,
                            },
                            crosshairs: {
                              show: true,
                              position: "back",
                              stroke: {
                                color: "#3B82F6",
                                width: 0.5,
                                dashArray: 3,
                              },
                            },
                          },
                          yaxis: {
                            min: 0,
                            max: Math.max(1, modules.length) + 1,
                            tickAmount: Math.max(1, modules.length) + 1,
                            decimalsInFloat: 0,
                            title: {
                              text: "Modules",
                              style: {
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#475569",
                              },
                              offsetX: +5,
                            },
                            labels: {
                              formatter: (value: number) => {
                                const rounded = Math.round(value);
                                return Number.isInteger(rounded) && rounded >= 0 ? String(rounded) : "";
                              },
                              style: {
                                fontSize: "11px",
                                fontWeight: 500,
                                colors: "#64748B",
                              },
                              offsetX: -10,
                            },
                            axisBorder: {
                              show: true,
                              color: "#94A3B8",
                              width: 1,
                            },
                            axisTicks: {
                              show: false,
                            },
                          } as any,
                          grid: {
                            borderColor: "#E2E8F0",
                            strokeDashArray: 2,
                            xaxis: {
                              lines: {
                                show: true,
                              },
                            },
                            yaxis: {
                              lines: {
                                show: true,
                              },
                            },
                            padding: {
                              left: 20,
                              right: 20,
                            },
                          },
                          tooltip: {
                            theme: "dark",
                            custom: function ({ dataPointIndex }: any) {
                              const point = completionGraphPoints[dataPointIndex];
                              if (!point) return "";
                              return `
                                <div style="background: linear-gradient(to bottom right, #1e40af, #1e3a8a); color: white; border-radius: 8px; padding: 12px 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid rgba(147, 197, 253, 0.3);">
                                  <div style="font-size: 13px; font-weight: bold; color: #dbeafe;">${point.moduleName}</div>
                                  <div style="color: #bfdbfe; margin-top: 6px; font-weight: 500; font-size: 12px;">${point.userName}</div>
                                  <div style="color: #93c5fd; font-size: 11px; margin-top: 4px;">${point.formattedDate}</div>
                                </div>
                              `;
                            },
                          },
                        }}
                        series={[
                          {
                            name: "Module Completions",
                            data: completionGraphData,
                          },
                        ]}
                        type="scatter"
                        height={Math.max(300, 200 + modules.length * 30)}
                      />

                      <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-[10px] text-gray-600">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                        </svg>
                        <span>Hover over any point to view completion details</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center border border-gray-200 flex flex-col items-center justify-center min-h-[200px]">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                      </svg>
                      <p className="text-gray-400 text-sm font-medium">No module completion data available</p>
                      <p className="text-gray-300 text-xs mt-1">Completions will appear here as users finish modules</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-1 mt-3">
                    <span className="text-gray-600 text-xs">Campaign Progress</span>
                    <span className="text-gray-700 font-medium text-xs">
                      {campaignDashboard?.metrics?.campaign_progress_percent ?? progress}%
                    </span>
                  </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${campaignDashboard?.metrics?.campaign_progress_percent ?? progress}%`,
                    }}
                  />
                </div>
                </div>
              </div>
            </div>

            {/* Top 3 Struggling Topics */}
            <div className="col-span-4 row-span-4 col-start-9 row-start-3 bg-white rounded-lg p-3 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] font-semibold text-gray-800">Top 3 Struggling Topics</h3>
                <a className="text-blue-600 text-[10px] font-medium" href="#">
                  View All
                </a>
              </div>

              <div className="space-y-1 flex-1">
                {campaignDashboard?.top_struggling_topics &&
                campaignDashboard.top_struggling_topics.length > 0 ? (
                  campaignDashboard.top_struggling_topics
                    .slice(0, 3)
                    .map((topic: any, idx: number) => {
                      const topicDisplayName =
                        topic.module_name || topic.topic_name || topic.name || "Unknown Topic";
                      const iconMap: Record<
                        string,
                        { icon: string; color: string; textColor: string }
                      > = {
                        "WIFI Security": {
                          icon: "/awm/images/icons/wifi.svg",
                          color: "#C9F1E2",
                          textColor: "#0D9488",
                        },
                        "Physical Security": {
                          icon: "/awm/images/icons/physical.svg",
                          color: "#DCE9FF",
                          textColor: "#2563EB",
                        },
                        "Phishing Security": {
                          icon: "/awm/images/icons/phishing.svg",
                          color: "#FEE2E2",
                          textColor: "#DC2626",
                        },
                      };
                      const config = iconMap[topicDisplayName] || {
                        icon: "/awm/images/icons/default.svg",
                        color: "#F0F0F0",
                        textColor: "#666",
                      };

                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-[#F0F7F9] rounded-md py-1 px-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center`}
                              style={{ backgroundColor: config.color }}
                            >
                              <img alt="" className="w-2 h-2" src={config.icon} />
                            </div>
                            <span className="text-[10px] font-medium text-gray-800">
                              {topicDisplayName}
                            </span>
                          </div>
                          <svg
                            className="w-2.5 h-2.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      );
                    })
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No struggling topics data available
                  </div>
                )}
              </div>

              <p className="text-[8px] text-red-600 mt-2 flex items-center gap-1">
                <img alt="" className="w-2.5 h-2.5" src="/awm/images/icons/alert.svg" />
                Your employees need attention on these topics
              </p>
            </div>

            {/* Employee Risk Rates */}
            <div className="col-span-4 row-span-4 col-start-1 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Risk Rates</h3>
              <div className="w-72 h-72 flex items-center justify-center">
                <SemiCircleChart
                  sent={campaignDashboard?.metrics?.total_low_risk_employees ?? 0}
                  opened={campaignDashboard?.metrics?.total_medium_risk_employees ?? 0}
                  admin={campaignDashboard?.metrics?.total_high_risk_employees ?? 0}
                  color1="#3ACE89"
                  color2="#FBBF24"
                  color3="#FB5050"
                  labels={["Low Risk", "Medium Risk", "High Risk"]}
                />
              </div>
            </div>

            {/* Employee Certification */}
            <div className="col-span-4 row-span-4 col-start-5 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Certification</h3>
              <CertificationChart
                color="#3ACE89"
                color2="#FB5050"
                value={Math.round(
                  ((campaignDashboard?.metrics?.total_certified_employees ?? 0) /
                    Math.max(
                      (campaignDashboard?.metrics?.total_certified_employees ?? 0) +
                        (campaignDashboard?.metrics?.total_uncertified_employees ?? 0),
                      1
                    )) *
                    100
                )}
              />

              <div className="flex justify-center gap-4 text-xs text-gray-600 mt-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Certified: {campaignDashboard?.metrics?.total_certified_employees || 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Not Certified: {campaignDashboard?.metrics?.total_uncertified_employees || 0}
                </span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="col-span-4 row-span-5 col-start-9 row-start-7 bg-white rounded-xl p-3 space-y-4">
              {/* Weekly Progress & Quiz Accuracy Charts */}
              <div className="grid grid-cols-2 gap-2">
                {/* Weekly Progress */}
                <div className="bg-gray-50 p-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-gray-700 text-[10px] font-medium mb-2">
                    Weekly Progress
                  </span>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" fill="none" r="28" stroke="#E5E7EB" strokeWidth="3" />
                      <circle
                        cx="32"
                        cy="32"
                        fill="none"
                        r="28"
                        stroke="#00CCC4"
                        strokeDasharray={`${(campaignDashboard?.metrics?.weekly_progress_percent || 0) * 1.76} 176`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-gray-800">
                      {campaignDashboard?.metrics?.weekly_progress_percent || 0}%
                    </span>
                  </div>
                </div>

                {/* Quiz Accuracy */}
                <div className="bg-gray-50 p-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-gray-700 text-[10px] font-medium mb-2">Quiz Accuracy</span>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" fill="none" r="28" stroke="#E5E7EB" strokeWidth="3" />
                      <circle
                        cx="32"
                        cy="32"
                        fill="none"
                        r="28"
                        stroke="#7A5CFF"
                        strokeDasharray={`${(campaignDashboard?.metrics?.quizzes_accuracy_percent || 0) * 1.76} 176`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-gray-800">
                      {campaignDashboard?.metrics?.quizzes_accuracy_percent || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="bg-[#FFEEE7] p-2 rounded-xl flex items-center justify-between border border-orange-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5">
                    <img alt="" className="w-full h-full" src="/awm/images/fire-red.svg" />
                  </div>
                  <span className="text-gray-700 font-medium text-[10px]">
                    Active Learner This Month
                  </span>
                </div>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaignDashboard?.metrics?.total_active_learner || 0}
                </span>
              </div>

              <div className="bg-[#E6FFFA] p-2 rounded-xl flex items-center justify-between border border-teal-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5">
                    <img alt="" className="w-full h-full" src="/awm/images/fire-teal.svg" />
                  </div>
                  <span className="text-gray-700 font-medium text-[10px]">
                    Training Completion Rate
                  </span>
                </div>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaignDashboard?.metrics?.training_completion_rate || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Second Section - Gamified Distribution Statistics */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Gamified Distribution Statistics</h3>
            </div>

            {/* Gamification Grid */}
            <div className="grid grid-cols-12 gap-2">
              {/* Course Completed */}
              <div className="col-span-3 row-span-1 bg-white rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="text-lg">
                    <img alt="" className="w-5 h-5" src="/awm/images/gard_cap.svg" />
                  </span>
                  <div>
                    Course Completed
                    <div className="text-xl text-gray-900">
                      {campaignDashboard?.metrics?.total_completed_employees_modules || 0}/
                      {campaignDashboard?.metrics?.total_employees_modules_enrolled || 0}
                    </div>
                  </div>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-4">
                  <div
                    className="h-1 bg-green-500 rounded-full"
                    style={{
                      width:
                        (campaignDashboard?.metrics?.total_employees_modules_enrolled || 0) &&
                        (campaignDashboard?.metrics?.total_employees_modules_enrolled || 0) > 0
                          ? `${
                              ((campaignDashboard?.metrics?.total_completed_employees_modules ||
                                0) /
                                (campaignDashboard?.metrics?.total_employees_modules_enrolled ||
                                  1)) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Study Time */}
              <div className="col-span-3 row-span-1 col-start-4 bg-white rounded-xl p-3 flex flex-col justify-start">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="text-lg">
                    <img alt="" className="w-5 h-5" src="/awm/images/clock_icon.svg" />
                  </span>
                  <div>
                    Study Time
                    <div className="text-xl text-gray-900">
                      {campaignDashboard?.metrics?.total_study_time
                        ? Math.round(campaignDashboard?.metrics?.total_study_time / 60)
                        : 0}
                      h
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Gallery - Takes up more space */}
              <div className="col-span-6 row-span-3 bg-gradient-to-br from-[#FFFEFC] to-[#FDECE0] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
                      <span className="text-lg">
                        <img alt="" className="w-5 h-5" src="/awm/images/img/Icon_Trophy.svg" />
                      </span>
                      Achievement Gallery
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      Organization locked and unlocked badges
                    </p>
                  </div>
                  <a className="text-blue-600 text-xs font-medium" href="#">
                    View All
                  </a>
                </div>
                <div className="grid grid-cols-8 gap-3 gap-y-4 mt-8">
                  {achievementDisplayOrder.map((num) => {
                    const isUnlocked = unlockedAchievementNumbers.has(num);
                    const meta = achievementByNumber.get(num);

                    const tooltipContent = (
                      <div className="flex flex-col gap-1 max-w-[200px] p-1">
                        <p className="font-semibold text-sm text-gray-900">
                          {meta?.achievement_name ?? `Achievement #${num}`}
                        </p>
                        {meta?.achievement_description && (
                          <p className="text-xs text-gray-600 leading-tight">
                            {meta.achievement_description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                              isUnlocked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {isUnlocked ? "Unlocked" : "Locked"}
                          </span>
                          {isUnlocked && meta?.employee_count != null && (
                            <span className="text-xs text-gray-500">
                              {meta.employee_count}x
                            </span>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <Tooltip key={num} content={tooltipContent} placement="top">
                        <div
                          aria-disabled={!isUnlocked}
                          className={`w-12 h-12 rounded-full flex items-center justify-center relative cursor-default ${
                            isUnlocked ? "" : "opacity-40"
                          }`}
                        >
                          <img
                            alt={meta?.achievement_name ?? `Achievement ${num}`}
                            className="w-full h-full"
                            src={`/awm/images/achivement/${num}.png`}
                          />
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Achievement Progress</div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>
                      {achievementUnlocked} / {achievementTotal} Achievements Unlocked
                    </span>
                    <span>{achievementPercent}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${achievementPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Employee Avatar Level */}
              <div className="col-span-6 row-span-2 row-start-2 bg-white rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold">{t("gamification.employeeAvatarLevel")}</h2>
                  <a className="text-blue-600 text-xs font-medium" href="#">
                    View All
                  </a>
                </div>

                <div className="mt-4 flex gap-6 items-start">
                  {/* Main Avatar — show the highest level avatar from backend response */}
                  <div className="flex flex-col items-center justify-center">
                    <Tooltip
                      content={
                        <div className="flex flex-col gap-1 max-w-[200px] p-1">
                          <p className="font-semibold text-sm text-gray-900">
                            Level {mainAvatar?.level_number ?? 1}
                          </p>
                          <p className="text-xs text-gray-600 leading-tight">
                            {mainAvatar?.level_name ?? "Vulnerable Newbie"}
                          </p>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                isMainAvatarUnlocked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {isMainAvatarUnlocked ? "Unlocked" : "Locked"}
                            </span>
                            {mainAvatar?.employee_count != null && (
                              <span className="text-xs text-gray-500">
                                {mainAvatar.employee_count}x
                              </span>
                            )}
                          </div>
                        </div>
                      }
                      placement="top"
                    >
                      <div
                        aria-disabled={!isMainAvatarUnlocked}
                        className={`w-24 h-24 bg-gray-200 rounded-full ${!isMainAvatarUnlocked ? "opacity-40" : ""} cursor-default`}
                      >
                        <img
                          alt={`Level ${mainAvatar?.level_number ?? 1}`}
                          className="w-24 h-24 rounded-full object-contain object-center"
                          src={`/awm/images/avatars/${resolveAvatarImage(mainAvatar)}`}
                        />
                      </div>
                    </Tooltip>
                    <p className="text-[12px] leading-tight text-gray-700 mt-4 w-full max-w-[120px] whitespace-normal break-words text-center">
                      {mainAvatar?.level_name ?? "Vulnerable Newbie"}
                    </p>
                  </div>

                  {/* vertical divider */}
                  <div className="w-px bg-gray-200 self-stretch my-1" />

                  {/* Grid of smaller avatars (4 cols x 2 rows) */}
                  <div className="grid grid-cols-4 gap-6 flex-1">
                    {avatarStats
                      .filter((avatar) => avatar.level_number !== mainAvatar?.level_number)
                      .slice(0, 8)
                      .map((avatar, idx) => {
                        const isUnlocked = (avatar.employee_count ?? 0) > 0;
                        const avatarImage = resolveAvatarImage(avatar);

                      return (
                        <Tooltip
                          key={avatar.level_number || idx}
                          content={
                            <div className="flex flex-col gap-1 max-w-[200px] p-1">
                              <p className="font-semibold text-sm text-gray-900">
                                Level {avatar.level_number}
                              </p>
                              <p className="text-xs text-gray-600 leading-tight">
                                {avatar.level_name}
                              </p>
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <span
                                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                    isUnlocked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {isUnlocked ? "Unlocked" : "Locked"}
                                </span>
                                {avatar.employee_count != null && (
                                  <span className="text-xs text-gray-500">
                                    {avatar.employee_count}x
                                  </span>
                                )}
                              </div>
                            </div>
                          }
                          placement="top"
                        >
                          <div
                            className={clsx(
                              "flex flex-col items-center",
                              avatar.level_number === 9 ? "rounded-xl bg-[#F1FAFF] p-3" : ""
                            )}
                          >
                            <div
                              className={`w-10 h-10 rounded-full bg-[#E6FFFB] flex items-center justify-center overflow-hidden border border-gray-200 ${
                                !isUnlocked ? "opacity-40" : ""
                              } cursor-default`}
                            >
                              <img
                                alt=""
                                className="w-full h-full object-contain"
                                src={`/awm/images/avatars/${avatarImage}`}
                              />
                            </div>
                            <p className="text-[10px] leading-tight text-gray-700 mt-2 w-full max-w-[70px] whitespace-normal break-words text-center">
                              {avatar.level_name}
                            </p>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Section - High/Low Risk Employees */}
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-2 mt-4">
            {/* High Risk Card */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-red-600">Top 10 High-Risk Employees</h3>
                <Button
                  className="text-xs text-blue-600"
                  size="sm"
                  variant="light"
                  onClick={() =>
                    router.push(
                      `/dashboard/launch-awareness/campaigns/${campaignId}/employees?risk=high`
                    )
                  }
                >
                  View All
                </Button>
              </div>

              {topHighRiskEmployees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">User ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          Risk Level
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          Compliance
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          XP Tokens
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topHighRiskEmployees
                        .slice(0, 10)
                        .map((employee: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2 text-gray-700">User {employee.user_id}</td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                                {employee.risk_level}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-gray-700">
                              {employee.compliance_score}%
                            </td>
                            <td className="py-2 px-2 text-gray-700">{employee.total_xp_tokens}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-400 text-xs py-8">
                  No employee analytics data available
                </div>
              )}
            </div>

            {/* Low Risk Card */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-green-600">Top 10 Low Risk Employees</h3>
                <Button
                  className="text-xs text-blue-600"
                  size="sm"
                  variant="light"
                  onClick={() =>
                    router.push(
                      `/dashboard/launch-awareness/campaigns/${campaignId}/employees?risk=low`
                    )
                  }
                >
                  View All
                </Button>
              </div>

              {topLowRiskEmployees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">User ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          Risk Level
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          Compliance
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                          XP Tokens
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLowRiskEmployees
                        .slice(0, 10)
                        .map((employee: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2 text-gray-700">User {employee.user_id}</td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                                {employee.risk_level}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-gray-700">
                              {employee.compliance_score}%
                            </td>
                            <td className="py-2 px-2 text-gray-700">{employee.total_xp_tokens}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-400 text-xs py-8">
                  No employee analytics data available
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
