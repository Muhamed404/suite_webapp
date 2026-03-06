"use client";

import Image from "next/image";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { AreaChart } from "@/components/modules/dashboard/charts/area-chart";
import { CircularProgressChart } from "@/components/modules/dashboard/charts/circular-progress-chart";
import { SemiCircleChart } from "@/components/modules/dashboard/charts/semi-circle-chart";
import { ModuleChart } from "@/components/modules/dashboard/charts/module-chart";
import { CertificationChart } from "@/components/modules/dashboard/charts/certification-chart";
import { DashboardTables } from "@/components/modules/dashboard/dashboard-tables";
import { GamificationStats } from "@/components/modules/dashboard/gamification-stats";
import {
  isPlatformAdmin as getIsPlatformAdmin,
  isOrgAdmin as getIsOrgAdmin,
  isUser as getIsUser,
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
  useOrganizationStrugglingModules,
  useOrganizationMonthlyCompletion,
  useUserAssignments,
  useUserGameAchievements,
} from "@/hooks/useDashboard";
import { useLicenseInfo } from "@/hooks/useSuiteAwm";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { decodeJwt, extractUserDisplayName, extractUserEmail } from "@/utils/jwt";
import { campaignService } from "@/services/campaignService";

export default function DashboardPage() {
  const { dir } = useI18n();
  const t = useTranslations("dashboard");
  const isRtl = dir === "rtl";
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();

  // Track which assignments are currently being started (by `campaign_id-module_id` key)
  const [startingKeys, setStartingKeys] = useState<Set<string>>(new Set());

  // Helper: generate a URL-friendly slug from a module name
  const generateModuleSlug = useCallback(
    (name: string) =>
      (name || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    []
  );

  // Handle Start: call beginCampaign → beginModule, then refresh data
  const handleStartAssignment = useCallback(
    async (assignment: any) => {
      const key = `${assignment.campaign_id}-${assignment.module_id}`;

      if (!assignment.campaign_id) return;
      setStartingKeys((prev) => new Set(prev).add(key));
      try {
        const campaignRes = await campaignService.beginCampaign(assignment.campaign_id);

        if (!campaignRes.success) {
          console.error("beginCampaign did not succeed", campaignRes);

          return;
        }
        await campaignService.beginModule(assignment.campaign_id, assignment.module_id);
        queryClient.invalidateQueries({ queryKey: ["user", "assignments"] });
      } catch (error) {
        console.error("Failed to start assignment:", error);
      } finally {
        setStartingKeys((prev) => {
          const next = new Set(prev);

          next.delete(key);

          return next;
        });
      }
    },
    [queryClient]
  );

  // Decode JWT to extract user details
  const jwtPayload = useMemo(() => decodeJwt(token), [token]);
  const userDisplayName = useMemo(() => extractUserDisplayName(jwtPayload), [jwtPayload]);
  const userEmail = useMemo(
    () => user?.email || extractUserEmail(jwtPayload),
    [user?.email, jwtPayload]
  );

  const isPlatformAdmin = getIsPlatformAdmin(user?.role_id);
  const isOrgAdmin = getIsOrgAdmin(user?.role_id);
  const isUser = getIsUser(user?.role_id);

  // --- Data Fetching ---
  const { data: systemData } = useSystemOverview();
  const { data: orgDataResponse } = useOrganizationDashboards();
  const { data: userDataResponse } = useUserDashboards({ userId: user?.id });
  const { data: assignmentsData } = useUserAssignments({ language_id: 1 });
  const { data: userGameAchievementsData } = useUserGameAchievements();

  const { data: systemStrugglingRaw } = useSystemStrugglingModules();
  const { data: orgStrugglingRaw } = useOrganizationStrugglingModules();
  const { data: licenseData } = useLicenseInfo(!isUser);

  // Organization monthly completion (used by org-admin Security Awareness Campaign graph)
  const { data: orgMonthlyCompletion } = useOrganizationMonthlyCompletion();

  // Pick the right data source
  const dashboardData = useMemo(() => {
    if (isPlatformAdmin && systemData?.statusCode === 200) {
      return systemData.object;
    }
    if (
      isOrgAdmin &&
      orgDataResponse &&
      orgDataResponse.object?.dashboardOrganizations?.length > 0
    ) {
      return orgDataResponse.object.dashboardOrganizations[0];
    }
    if (isUser && userDataResponse && userDataResponse.object?.dashboardUsers?.length > 0) {
      // Map User Data to generic structure where possible, or return specific
      return userDataResponse.object.dashboardUsers[0];
    }

    return null;
  }, [isPlatformAdmin, isOrgAdmin, isUser, systemData, orgDataResponse, userDataResponse]);

  const strugglingModules = useMemo(() => {
    if (isPlatformAdmin && systemStrugglingRaw?.statusCode === 200) {
      return systemStrugglingRaw.object.struggling_modules.slice(0, 3);
    }
    if (isOrgAdmin && orgStrugglingRaw) {
      return orgStrugglingRaw.object?.struggling_modules?.slice(0, 3) || [];
    }
    // Fallback to data inside dashboardData if available (Top 3 usually included in overview)
    if (dashboardData && "top_struggling_modules" in dashboardData) {
      return (dashboardData as any).top_struggling_modules;
    }

    return [];
  }, [isPlatformAdmin, isOrgAdmin, systemStrugglingRaw, orgStrugglingRaw, dashboardData]);

  // Map monthly completion -> chart data for Security Awareness Campaign (Org Admin)
  const campaignMonthly = useMemo(() => {
    const monthly =
      isOrgAdmin && orgMonthlyCompletion ? orgMonthlyCompletion.object?.monthly_data : [];

    if (!monthly || monthly.length === 0) return { labels: [], data: [] };

    const labels = monthly.map((m: any) => m.month_name || m.month);
    const data = monthly.map((m: any) => Number(m.modules_completed || 0));

    return { labels, data };
  }, [isOrgAdmin, orgMonthlyCompletion]);

  // Modules for Module Details chart
  const modules = useMemo(() => {
    if (assignmentsData?.object?.assignments && assignmentsData.object.assignments.length > 0) {
      const colors = [
        "#3B82F6",
        "#F97316",
        "#A855F7",
        "#8B5CF6",
        "#06B6D4",
        "#10B981",
        "#EF4444",
        "#22C55E",
        "#F59E0B",
        "#8B5CF6",
      ];

      return assignmentsData.object.assignments.map((assignment: any, index: number) => ({
        name: assignment.module_name,
        value: 1,
        color: colors[index % colors.length],
      }));
    }

    // No default static modules, only dynamic ones
    return [];
  }, [assignmentsData]);

  // Extract values with fallbacks
  const licenseInfo = licenseData?.AwareMagnus?.Subscription || licenseData?.All?.Subscription;
  const totalLicenses = licenseInfo?.TotalUserLicense ?? 100;
  const availableLicenses = licenseInfo?.TotalAvailable ?? 0;
  const consumedLicenses = licenseInfo ? totalLicenses - availableLicenses : 0;

  // Ensure numeric types for score/percent (API may return strings)
  const _complianceScore = Number(dashboardData?.total_compliance_score ?? 0);
  const compliancePercent = parseFloat(String(dashboardData?.total_compliance_percent ?? "0"));

  const globalProgress =
    dashboardData && "global_org_progress_percent" in dashboardData
      ? dashboardData.global_org_progress_percent
      : dashboardData && "global_progress_percent" in dashboardData
        ? dashboardData.global_progress_percent
        : 0;

  const xpTokens =
    dashboardData && "global_xp_total_tokens" in dashboardData
      ? dashboardData.global_xp_total_tokens
      : dashboardData && "xp_total_tokens" in dashboardData
        ? dashboardData.xp_total_tokens
        : 0;

  const totalCampaigns = dashboardData?.total_campaigns || 0;
  // Ensure dashboard-level progress is numeric (API may return string)
  const weeklyProgress = (() => {
    const raw = dashboardData?.weekly_progress_percent ?? 0;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw));

    return Number.isFinite(num) ? num : 0;
  })();
  // Ensure quiz accuracy is always numeric (API may return string)
  const quizAccuracy = (() => {
    const raw = dashboardData?.quizzes_accuracy_percent ?? 0;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw));

    return Number.isFinite(num) ? num : 0;
  })();
  const securityAwarenessScore =
    dashboardData && "total_compliance_score" in dashboardData
      ? dashboardData.total_compliance_score
      : 0; // Or assumes same as compliance?
  const securityAwarenessMax =
    dashboardData && "maximum_compliance_score" in dashboardData
      ? dashboardData.maximum_compliance_score
      : 100;

  // --- Map additional API fields ---
  const complianceGrade =
    dashboardData && "compliance_score_grade" in dashboardData
      ? (dashboardData as any).compliance_score_grade
      : null;

  // organization_risk_level may be `null` from API — treat null/empty as unknown/not-set
  const orgRiskLabel =
    dashboardData &&
    "organization_risk_level" in dashboardData &&
    (dashboardData as any).organization_risk_level != null &&
    String((dashboardData as any).organization_risk_level).trim() !== ""
      ? (dashboardData as any).organization_risk_level
      : "-"; // show neutral fallback when not provided

  const riskBadgeClass = (() => {
    const raw = dashboardData && (dashboardData as any).organization_risk_level;
    const lvl = raw != null ? String(raw).toLowerCase().trim() : "";

    if (!lvl) return "bg-gray-400"; // neutral for unknown/null
    if (lvl.includes("low")) return "bg-green-600";
    if (lvl.includes("medium") || lvl.includes("med")) return "bg-yellow-500";
    if (lvl.includes("high") || lvl.includes("critical")) return "bg-red-600";

    return "bg-gray-400";
  })();

  const complianceBadgeClass = (() => {
    const grade = complianceGrade ? String(complianceGrade).toLowerCase().trim() : "";

    if (!grade) return "bg-gray-400"; // neutral for unknown/null
    if (grade.includes("excellent")) return "bg-blue-600";
    if (grade.includes("good")) return "bg-green-600";
    if (grade.includes("fair")) return "bg-yellow-500";
    if (grade.includes("poor")) return "bg-red-600";

    return "bg-gray-400";
  })();

  // User-specific data for learner dashboard
  const userDashboardData =
    isUser && userDataResponse && userDataResponse.object?.dashboardUsers?.length > 0
      ? userDataResponse.object.dashboardUsers[0]
      : null;

  const totalModulesEnrolled =
    assignmentsData?.object?.count || userDashboardData?.total_modules_enrolled || 0;
  const totalCompletedModules = userDashboardData?.total_completed_modules || 0;
  const totalCertificatesAvailable = userDashboardData?.total_certificates_available || 0;
  const totalCompletedCertificates = userDashboardData?.total_completed_certificates || 0;
  const totalStudyTimeHours = userDashboardData
    ? Math.floor(userDashboardData.total_study_time / 60)
    : 0; // Convert minutes to hours
  const levelNumber = userDashboardData?.level_number ?? 1;
  const xpTotalTokens = parseFloat(userDashboardData?.xp_total_tokens ?? "0");
  const streakDay = userDashboardData?.streak_day ?? 0;
  const learningVelocity = (() => {
    const raw = userDashboardData?.learning_velocity ?? 0;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw));

    return Number.isFinite(num) ? num : 0;
  })();
  const bestModuleAttempted = userDashboardData?.best_module_attempted || "";
  const totalAchievementsCompleted = userDashboardData?.total_achievements_completed || 0;
  const quizzesAccuracyPercent = parseFloat(userDashboardData?.quizzes_accuracy_percent ?? "0");
  const weeklyProgressPercent = parseFloat(userDashboardData?.weekly_progress_percent ?? "0");

  // Risk Stats
  const riskStats = {
    low:
      dashboardData && "total_low_risk_employees" in dashboardData
        ? dashboardData.total_low_risk_employees
        : 0,
    medium:
      dashboardData && "total_medium_risk_employees" in dashboardData
        ? dashboardData.total_medium_risk_employees
        : 0,
    high:
      dashboardData && "total_high_risk_employees" in dashboardData
        ? dashboardData.total_high_risk_employees
        : 0,
  };

  // Certification Stats
  const certStats = {
    certified:
      dashboardData && "total_certified_employees" in dashboardData
        ? dashboardData.total_certified_employees
        : 0,
    uncertified:
      dashboardData && "total_uncertified_employees" in dashboardData
        ? dashboardData.total_uncertified_employees
        : 0,
  };

  const activeLearners =
    dashboardData && "total_active_learner" in dashboardData
      ? dashboardData.total_active_learner
      : 0;
  const trainingCompletionRate =
    dashboardData && "training_completion_rate" in dashboardData
      ? dashboardData.training_completion_rate
      : 0;

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

  // Unlocked achievements for user
  const unlockedAchievementIds = useMemo(() => {
    const set = new Set<number>();

    if (
      userGameAchievementsData?.statusCode === 200 &&
      userGameAchievementsData.object?.userGameAchievements
    ) {
      for (const achievement of userGameAchievementsData.object.userGameAchievements) {
        set.add(achievement.achievement_id);
      }
    }

    return set;
  }, [userGameAchievementsData]);

  // Category stats for user achievements
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};

    if (
      userGameAchievementsData?.statusCode === 200 &&
      userGameAchievementsData.object?.userGameAchievements
    ) {
      for (const achievement of userGameAchievementsData.object.userGameAchievements) {
        stats[achievement.category_name] =
          (stats[achievement.category_name] || 0) + achievement.count;
      }
    }

    return stats;
  }, [userGameAchievementsData]);

  // Define total for each category (static for now)
  const categoryTotals: Record<string, number> = {
    Performance: 5,
    Milestone: 4,
    Behavior: 4,
    Streak: 3,
    Completion: 3,
  };

  // Category config for display
  const categoryConfig: Record<string, { bg: string; iconBg: string; icon: string }> = {
    Performance: { bg: "bg-orange-100", iconBg: "bg-orange-400", icon: "chart-bar" },
    Milestone: { bg: "bg-blue-100", iconBg: "bg-blue-400", icon: "rocket" },
    Behavior: { bg: "bg-red-100", iconBg: "bg-red-400", icon: "clock" },
    Streak: { bg: "bg-purple-100", iconBg: "bg-purple-400", icon: "star" },
    Completion: { bg: "bg-teal-100", iconBg: "bg-teal-400", icon: "check-circle" },
    Learning: { bg: "bg-indigo-100", iconBg: "bg-indigo-400", icon: "book" },
    Security: { bg: "bg-gray-100", iconBg: "bg-gray-400", icon: "check-circle" },
    Awareness: { bg: "bg-yellow-100", iconBg: "bg-yellow-400", icon: "question" },
    Training: { bg: "bg-cyan-100", iconBg: "bg-cyan-400", icon: "star" },
    Compliance: { bg: "bg-green-100", iconBg: "bg-green-400", icon: "check-circle" },
    Risk: { bg: "bg-pink-100", iconBg: "bg-pink-400", icon: "clock" },
    Engagement: { bg: "bg-lime-100", iconBg: "bg-lime-400", icon: "rocket" },
    // Add more if needed
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {isUser ? (
          // Learner Dashboard for Org Users
          <>
            <div className="p-3 gap-2">
              <div className="grid grid-cols-12 gap-4">
                {/* Welcome Section */}
                <div className="col-span-8 row-span-4">
                  <div
                    className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-4xl p-8 md:p-6 w-full h-full"
                    style={{ background: "linear-gradient(-60deg,#29446D, #07152C)" }}
                  >
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                      <div className="flex-1">
                        <p className="text-gray-300 text-xs">Welcome back, {userDisplayName}!</p>
                        <h1 className="text-white text-2xl mt-2 leading-tight">
                          Ready To Continue Your Learning Journey?
                        </h1>

                        <div className="flex items-end gap-7">
                          <div className="flex flex-col items-center mt-3 gap-2">
                            <div className="relative">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  fill="none"
                                  r="35"
                                  stroke="#344F6E"
                                  strokeWidth="5"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  fill="none"
                                  r="35"
                                  stroke="#3D9BCC"
                                  strokeDasharray="220"
                                  strokeDashoffset="200"
                                  strokeLinecap="round"
                                  strokeWidth="5"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-white text-xs">Level {levelNumber}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">
                                {xpTotalTokens.toLocaleString()}/10000 XP
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <p className="text-white text-base">
                              You're on a{" "}
                              <span className="font-semibold">{streakDay} day streak!</span>
                            </p>
                            <button className="bg-[#3FBDFF] hover:bg-[#3FBDFF] justify-center text-white font-semibold text-xs px-2 py-3 rounded-full inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg">
                              Start
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="w-48 h-48 lg:w-56 lg:h-56">
                          <Image
                            alt="Learning Robot"
                            className="w-full h-full object-contain"
                            height={224}
                            src="/awm/images/avtar.svg"
                            width={224}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="col-span-8 col-start-1 row-start-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-300 to-red-400 flex items-center justify-center flex-shrink-0">
                        <Image
                          alt=""
                          className="w-8 h-8"
                          height={32}
                          src="/awm/images/time-jar.svg"
                          width={32}
                        />
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] font-medium">
                          {t("gamification.courseCompleted")}
                        </p>
                        <p className="text-gray-900 text-lg font-bold">
                          {totalCompletedModules}/{totalModulesEnrolled}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Image
                          alt=""
                          className="w-8 h-8"
                          height={32}
                          src="/awm/images/time-jar.svg"
                          width={32}
                        />
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] font-medium">
                          Certificate Completed
                        </p>
                        <p className="text-gray-900 text-lg font-bold">
                          {totalCompletedCertificates}/{totalCertificatesAvailable}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center flex-shrink-0">
                        <Image
                          alt=""
                          className="w-8 h-8"
                          height={32}
                          src="/awm/images/time-jar.svg"
                          width={32}
                        />
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] font-medium">Study Time</p>
                        <p className="text-gray-900 text-lg font-bold">{totalStudyTimeHours}h</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievement Gallery */}
                <div className="col-span-4 row-span-6 col-start-9 row-start-1 bg-[linear-gradient(114.67deg,#FFFEFC_5.61%,#FDECE0_98.45%)] rounded-2xl p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Image
                          alt=""
                          className="w-3.5 h-3.5"
                          height={16}
                          src="/awm/images/img/Icon_Trophy.svg"
                          width={16}
                        />
                      </div>
                      <div>
                        <h2 className="text-gray-900 text-xs font-bold">Achievement Gallery</h2>
                        <p className="text-gray-500 text-[9px] mt-0.5">
                          Organization locked and unlocked badges
                        </p>
                      </div>
                    </div>
                    <a
                      className="text-gray-700 text-[9px] font-medium flex items-center gap-0.5 hover:text-gray-900"
                      href="#"
                    >
                      View All
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </a>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {Array.from({ length: 16 }, (_, index) => {
                      const achievementId = index + 1;
                      const isUnlocked = unlockedAchievementIds.has(achievementId);

                      return (
                        <div key={index} className="relative">
                          <div
                            className={`w-10 h-10 flex items-center justify-center ${isUnlocked ? "" : "opacity-40"}`}
                          >
                            <Image
                              alt=""
                              className="w-full h-full object-contain"
                              height={40}
                              src={getContentAssetUrl(`/images/achivement/${achievementId}.png`)}
                              width={40}
                            />
                          </div>
                          {isUnlocked && (
                            <span className="absolute top-0 right-0 w-4 h-4 z-10">
                              <Image
                                alt=""
                                className="w-full h-full object-contain"
                                height={16}
                                src={getContentAssetUrl("/images/achivement/achived.svg")}
                                width={16}
                              />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(categoryStats)
                      .sort(() => Math.random() - 0.5)
                      .slice(0, 5)
                      .map(([category, count]) => {
                        const config = categoryConfig[category] || {
                          bg: "bg-gray-100",
                          iconBg: "bg-gray-400",
                          icon: "question",
                        };
                        const total = categoryTotals[category] || 0;

                        return (
                          <div
                            key={category}
                            className={`flex items-center gap-0.5 ${config.bg} px-1.5 py-0.5 rounded-full`}
                          >
                            <div
                              className={`w-3 h-3 ${config.iconBg} rounded flex items-center justify-center`}
                            >
                              <svg
                                className="w-1.5 h-1.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                {/* Icon based on config.icon */}
                                {config.icon === "chart-bar" && (
                                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                )}
                                {config.icon === "rocket" && (
                                  <path
                                    clipRule="evenodd"
                                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                    fillRule="evenodd"
                                  />
                                )}
                                {config.icon === "clock" && (
                                  <path
                                    clipRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    fillRule="evenodd"
                                  />
                                )}
                                {config.icon === "star" && (
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                )}
                                {config.icon === "check-circle" && (
                                  <path
                                    clipRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    fillRule="evenodd"
                                  />
                                )}
                                {config.icon === "book" && (
                                  <path
                                    clipRule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                    fillRule="evenodd"
                                  />
                                )}
                                {config.icon === "question" && (
                                  <path
                                    clipRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 100 2z"
                                    fillRule="evenodd"
                                  />
                                )}
                              </svg>
                            </div>
                            <span className="text-gray-900 text-[9px] font-medium">{category}</span>
                            <span className="text-gray-600 text-[9px]">{count}</span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="bg-white rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700 text-[10px] font-medium">Achievements</span>
                      <div>
                        <span className="text-gray-900 text-sm font-bold">
                          {userGameAchievementsData?.object?.count || 0}
                        </span>
                        <span className="text-gray-400 text-[10px]">/16</span>
                      </div>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${((userGameAchievementsData?.object?.count || 0) / 16) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Module Chart */}
                <div className="col-span-8 row-span-4">
                  <ModuleChart modules={modules} />
                </div>

                {/* This Week Stats */}
                <div className="col-span-4 row-span-4 col-start-9 row-start-7">
                  <div className="bg-white rounded-xl p-3 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect height="18" rx="2" ry="2" strokeWidth="2" width="18" x="3" y="4" />
                          <line
                            strokeLinecap="round"
                            strokeWidth="2"
                            x1="16"
                            x2="16"
                            y1="2"
                            y2="6"
                          />
                          <line strokeLinecap="round" strokeWidth="2" x1="8" x2="8" y1="2" y2="6" />
                          <line strokeWidth="2" x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <h2 className="text-gray-900 text-sm font-semibold">This Week</h2>
                      </div>
                      <div className="relative">
                        <button className="flex items-center gap-1 text-gray-700 text-xs font-medium hover:text-gray-900">
                          Weekly
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M19 9l-7 7-7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px]">Lesson completed</span>
                        <span className="text-gray-900 text-sm font-bold">
                          {(dashboardData as any)?.total_completed_modules || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px]">Study Time</span>
                        <span className="text-gray-900 text-sm font-bold">
                          {(dashboardData as any)?.total_study_time
                            ? ((dashboardData as any).total_study_time / 60).toFixed(1) + "h"
                            : "0h"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[10px]">XP gained</span>
                        <span className="text-purple-600 text-sm font-bold">
                          +{(dashboardData as any)?.xp_total_tokens || 0} XP
                        </span>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-2.5 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M15 17h5l-5 5v-5zM15 7v5h5l-5-5zM5 17h5l-5 5v-5zM5 7v5H0l5-5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-[9px]">Lessons/Day</p>
                          <p className="text-gray-900 text-xs font-semibold">Learning Velocity</p>
                        </div>
                      </div>
                      <span className="text-red-400 text-lg font-bold">
                        {learningVelocity.toFixed(1)}
                      </span>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-purple-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-[9px]">Lessons/Day</p>
                          <p className="text-gray-900 text-xs font-semibold">Best Subject</p>
                        </div>
                      </div>
                      <span className="text-purple-400 text-base font-bold">
                        {bestModuleAttempted || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Assignments */}
                <div className="col-span-8 row-span-5 row-start-10">
                  <div className="bg-white rounded-2xl p-4 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-gray-900">Pending Assignments</h2>
                      <a
                        className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700"
                        href="#"
                      >
                        View All
                        <span className="text-sm">›</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(
                        assignmentsData?.object?.assignments
                          ?.filter(
                            (a: any) =>
                              a.status.name === "PENDING" || a.status.name === "IN_PROGRESS"
                          )
                          .slice(0, 4) || []
                      ).map((assignment: any, index: number) => {
                        const startDate = new Date(assignment.start_date);
                        const endDate = new Date(assignment.end_date);
                        // use numeric timestamps so TypeScript accepts the arithmetic and guard invalid dates
                        const startMs = startDate.getTime();
                        const endMs = endDate.getTime();
                        const days =
                          Number.isFinite(startMs) && Number.isFinite(endMs)
                            ? Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))
                            : 0;
                        const assigned = startDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        });
                        const progress =
                          assignment.status.name === "PENDING"
                            ? 0
                            : assignment.status.name === "IN_PROGRESS"
                              ? 50
                              : 100;

                        return (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-xl p-3 flex justify-between items-center"
                          >
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                🎓
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {assignment.module_name}
                                </h3>
                                <p className="text-[11px] text-gray-400">Assigned {assigned}</p>
                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                  <span>Level 1/1</span>
                                  <span className="flex items-center gap-1">⏱ {days} Days</span>
                                </div>
                                <div className="w-36 h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-400 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <span className="text-blue-400 text-lg">›</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Weekly Progress & Quiz Accuracy */}
                <div className="col-span-4 row-span-4 col-start-9 row-start-11">
                  <div className="grid grid-cols-4 p-2 rounded-xl bg-white gap-2 h-full">
                    <div className="bg-[#F1F5F8] rounded-xl p-3 flex flex-col items-center justify-between col-span-2 h-full">
                      <h3 className="text-xs font-semibold mb-1">Weekly Progress</h3>
                      <CircularProgressChart
                        color="#00CCC4"
                        size={128}
                        value={weeklyProgressPercent}
                      />
                    </div>
                    <div className="bg-[#F1F5F8] rounded-xl p-3 flex flex-col items-center justify-between col-span-2 h-full">
                      <h3 className="text-xs font-semibold mb-1">Quiz Accuracy</h3>
                      <CircularProgressChart
                        color="#7CC5FA"
                        size={128}
                        value={quizzesAccuracyPercent}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Assignments Table */}
              {(() => {
                // Sort all pending/in-progress assignments by start_date ascending (soonest first)
                const allAssignments: any[] = assignmentsData?.object?.assignments || [];
                const pendingAssignments = [...allAssignments]
                  .filter(
                    (a: any) => a.status?.name === "PENDING" || a.status?.name === "IN_PROGRESS"
                  )
                  .sort(
                    (a: any, b: any) =>
                      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                  )
                  .slice(0, 10);

                // Separate module assignments from survey/assessment assignments
                // Module assignments have a module_id; survey assignments have assessment_id (future API field)
                // Currently all items are module assignments; survey section is ready for when API adds type field
                const moduleAssignments = pendingAssignments.filter((a: any) => !a.assessment_id);
                const surveyAssignments = pendingAssignments.filter((a: any) => !!a.assessment_id);

                const formatDate = (dateStr: string) => {
                  const d = new Date(dateStr);

                  return Number.isFinite(d.getTime())
                    ? d.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                };

                const statusBadge = (statusName: string) => {
                  if (statusName === "PENDING")
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-600 border border-yellow-300 whitespace-nowrap">
                        Pending
                      </span>
                    );
                  if (statusName === "IN_PROGRESS")
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-300 whitespace-nowrap">
                        In Progress
                      </span>
                    );

                  return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-300 whitespace-nowrap">
                      {statusName}
                    </span>
                  );
                };

                return (
                  <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 mt-5">
                    {/* Module Pending Assignments */}
                    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold whitespace-nowrap">
                          Pending Assignments
                        </h2>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-left text-[10px] whitespace-nowrap">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                              <tr className="text-gray-500 font-semibold">
                                <th className="px-4 py-2">Campaign Name</th>
                                <th className="px-4 py-2">Module Name</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Start Date</th>
                                <th className="px-4 py-2">End Date</th>
                                <th className="px-4 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {moduleAssignments.length === 0 ? (
                                <tr>
                                  <td className="px-4 py-4 text-center text-gray-400" colSpan={6}>
                                    No pending assignments
                                  </td>
                                </tr>
                              ) : (
                                moduleAssignments.map((assignment: any, index: number) => {
                                  const isFirst = index === 0;

                                  return (
                                    <tr
                                      key={`${assignment.campaign_id}-${assignment.module_id}-${index}`}
                                      className={
                                        isFirst
                                          ? "bg-blue-50 border-l-4 border-blue-500 font-semibold"
                                          : "hover:bg-gray-50"
                                      }
                                    >
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-700"}`}
                                      >
                                        {assignment.campaign_name || "—"}
                                      </td>
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-700"}`}
                                      >
                                        {assignment.module_name || "—"}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {statusBadge(assignment.status?.name || "")}
                                      </td>
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-600"}`}
                                      >
                                        {formatDate(assignment.start_date)}
                                      </td>
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-600"}`}
                                      >
                                        {formatDate(assignment.end_date)}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {(() => {
                                          const key = `${assignment.campaign_id}-${assignment.module_id}`;
                                          const isStarting = startingKeys.has(key);
                                          const statusName = assignment.status?.name;

                                          // IN_PROGRESS + user already begun (progress_percentage != null) → View
                                          if (
                                            statusName === "IN_PROGRESS" &&
                                            assignment.progress_percentage != null
                                          ) {
                                            const slug = generateModuleSlug(
                                              assignment.module_name || ""
                                            );

                                            return (
                                              <a
                                                className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#3FBDFF] text-white hover:bg-opacity-90 transition-colors whitespace-nowrap inline-block"
                                                href={`/awm/module/${slug}?campaign_id=${assignment.campaign_id}`}
                                              >
                                                View
                                              </a>
                                            );
                                          }

                                          // PENDING or IN_PROGRESS with progress_percentage === null → Start
                                          return (
                                            <button
                                              className="px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-60"
                                              disabled={isStarting}
                                              onClick={() => handleStartAssignment(assignment)}
                                            >
                                              {isStarting ? "Starting…" : "Start"}
                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-[10px] whitespace-nowrap">
                          Showing 1–{moduleAssignments.length} out of{" "}
                          {assignmentsData?.object?.count || 0} Entries
                        </p>
                        <a
                          className="text-[10px] text-blue-600 hover:underline"
                          href="/dashboard/campaign-assignments"
                        >
                          View All
                        </a>
                      </div>
                    </div>

                    {/* Pending Assessment or Surveys */}
                    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold whitespace-nowrap">
                          Pending Assessment or Surveys
                        </h2>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-left text-[10px] whitespace-nowrap">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                              <tr className="text-gray-500 font-semibold">
                                <th className="px-4 py-2">Assessment Name / Survey</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Start Date</th>
                                <th className="px-4 py-2">End Date</th>
                                <th className="px-4 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {surveyAssignments.length === 0 ? (
                                <tr>
                                  <td className="px-4 py-4 text-center text-gray-400" colSpan={5}>
                                    No pending assessments or surveys
                                  </td>
                                </tr>
                              ) : (
                                surveyAssignments.map((assignment: any, index: number) => {
                                  const isFirst = index === 0;

                                  return (
                                    <tr
                                      key={`survey-${assignment.campaign_id}-${index}`}
                                      className={
                                        isFirst
                                          ? "bg-blue-50 border-l-4 border-blue-500 font-semibold"
                                          : "hover:bg-gray-50"
                                      }
                                    >
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-700"}`}
                                      >
                                        {assignment.assessment_name ||
                                          assignment.module_name ||
                                          "—"}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {statusBadge(assignment.status?.name || "")}
                                      </td>
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-600"}`}
                                      >
                                        {formatDate(assignment.start_date)}
                                      </td>
                                      <td
                                        className={`px-4 py-2.5 ${isFirst ? "text-blue-900 font-bold" : "text-gray-600"}`}
                                      >
                                        {formatDate(assignment.end_date)}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <button
                                          className="px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                                          onClick={() =>
                                            (window.location.href = `/dashboard/campaign-assignments`)
                                          }
                                        >
                                          Start
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-[10px] whitespace-nowrap">
                          Showing 1–{surveyAssignments.length} Entries
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          // Admin Dashboard
          <>
            <div className="flex flex-col p-4 sm:p-6 gap-4 sm:gap-5">
              <div className="flex items-center justify-between min-w-0">
                <h3 className="text-xl sm:text-2xl font-medium truncate">{t("page.title")}</h3>
              </div>
            </div>

            <div className="flex flex-col p-4 sm:p-6 pt-0 gap-4 sm:gap-5 overflow-x-hidden">
              {/* Main Grid Layout - 1 col mobile, 12 col desktop */}
              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2"
                style={{ gridAutoRows: "minmax(80px, auto)" }}
              >
                {/* Row 1: Total User Licenses (cols 1-4) */}
                <div className="col-span-1 md:col-span-4 row-start-1">
                  <div
                    className={clsx(
                      "bg-[linear-gradient(305deg,#4BABDC_0%,#5DB1FC_94.2%)] text-white rounded-xl p-4 flex gap-3 items-start h-full",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <Image
                      alt=""
                      className="w-12 h-12"
                      height={48}
                      src={getContentAssetUrl("/images/img/users-profile.svg")}
                      width={48}
                    />
                    <div className="flex flex-col">
                      <h3 className="text-base">{t("cards.totalUserLicenses")}</h3>
                      <p className="text-2xl">{totalLicenses}</p>
                    </div>
                  </div>
                </div>

                {/* Row 1: Consumed Licenses (cols 5-8) */}
                <div className="col-span-1 md:col-span-4 md:col-start-5 row-start-2 md:row-start-1">
                  <div
                    className={clsx(
                      "bg-white text-black rounded-xl p-4 flex gap-3 items-start h-full",
                      isRtl && "flex-row-reverse"
                    )}
                  >
                    <Image
                      alt=""
                      className="w-12 h-12"
                      height={48}
                      src={getContentAssetUrl("/images/img/users-licanse.svg")}
                      width={48}
                    />
                    <div className="flex flex-col">
                      <h3 className="text-base">{t("cards.totalConsumedLicenses")}</h3>
                      <p className="text-2xl">{consumedLicenses}</p>
                    </div>
                  </div>
                </div>

                {/* Row 1-2: Organization Score (cols 9-12, spans 2 rows) */}
                <div className="col-span-1 md:col-span-4 md:col-start-9 row-start-3 md:row-start-1 md:row-span-2">
                  <div className="bg-white rounded-xl p-5 space-y-3 h-full flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isUser ? t("cards.myScore") : t("cards.organizationScore")}
                    </h2>
                    <h2 className="text-base text-gray-900">{t("cards.totalComplianceScore")}</h2>

                    <div className="flex w-full items-center">
                      <div className={clsx("text-6xl text-gray-900", isRtl ? "ml-4" : "mr-4")}>
                        {Math.round(compliancePercent / 10)}
                      </div>
                      <div className="mt-1 flex-1">
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${compliancePercent}%` }}
                          />
                        </div>
                        <div
                          className={clsx(
                            "text-base text-gray-500 font-medium mt-1.5",
                            isRtl ? "text-left" : "text-right"
                          )}
                        >
                          {compliancePercent}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-5">
                      <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                        <Image
                          alt=""
                          className="w-6 h-6"
                          height={24}
                          src={getContentAssetUrl("/images/img/score.svg")}
                          width={24}
                        />
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">
                            {globalProgress}%
                          </div>
                          <p className="text-gray-500 text-base">{t("cards.globalProgress")}</p>
                        </div>
                      </div>

                      <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                        <Image
                          alt=""
                          className="w-6 h-6"
                          height={24}
                          src={getContentAssetUrl("/images/img/score.svg")}
                          width={24}
                        />
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">{xpTokens}</div>
                          <p className="text-gray-500 text-base">{t("cards.totalXpTokens")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className={clsx("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                        <div className="w-2 h-8 bg-orange-400 rounded-full" />
                        <p className="text-gray-600 text-base leading-tight">
                          {t("cards.totalAwarenessCampaigns")}
                        </p>
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">{totalCampaigns}</div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Security Posture (cols 1-8) */}
                <div className="col-span-1 md:col-span-8 row-start-4 md:row-start-2">
                  <div className="bg-white rounded-xl p-4 flex items-center gap-5 w-full h-full">
                    <div
                      className={clsx(
                        "relative flex gap-3 items-center",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      <Image
                        alt=""
                        className="w-4 h-4"
                        height={16}
                        src={getContentAssetUrl("/images/shield-check.svg")}
                        width={16}
                      />
                      <h3 className="text-base whitespace-nowrap">{t("cards.securityPosture")}</h3>

                      <Popover placement="bottom">
                        <PopoverTrigger>
                          <Button
                            isIconOnly
                            aria-label="Info"
                            className="min-w-4 w-4 h-4 p-0"
                            variant="light"
                          >
                            <Image
                              alt=""
                              className="w-4 h-4 cursor-pointer"
                              height={16}
                              src={getContentAssetUrl("/images/info-information.svg")}
                              width={16}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="p-5 text-sm bg-white border border-gray-300 rounded-xl w-80">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <svg
                                  className="w-5 h-5 me-2 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                  />
                                </svg>
                                <h3 className="font-medium text-base">{t("cards.infoTitle")}</h3>
                              </div>
                            </div>
                            <div className="mt-2 mb-4 leading-relaxed text-sm">
                              {t("cards.infoBody")}
                            </div>
                            <Button className="text-white bg-blue-600 rounded-2xl text-sm px-3 py-1.5">
                              {t("cards.viewMore")}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1">
                      <div
                        className="flex overflow-hidden rounded-lg w-full h-4"
                        data-level={Math.ceil(compliancePercent / 14.3)}
                        id="segBar"
                      >
                        {[
                          "#9EC232",
                          "#C1C625",
                          "#EACB16",
                          "#FFCD0F",
                          "#EBA75C",
                          "#E4590F",
                          "#D1132A",
                        ].map((color, i) => (
                          <div
                            key={i}
                            className="h-4 w-full transition-all duration-300 opacity-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <p
                      className={`${riskBadgeClass} text-white px-3 py-1 rounded-full text-base whitespace-nowrap`}
                    >
                      {orgRiskLabel}
                    </p>
                  </div>
                </div>

                {/* Row 3-5: Security Awareness Campaign (cols 1-8, spans 3 rows) */}
                <div className="col-span-1 md:col-span-8 row-start-5 md:row-start-3 md:row-span-3">
                  <div className="bg-white rounded-xl p-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {t("cards.securityAwarenessCampaign")}
                      </h3>
                      <Link className="text-blue-600 text-base font-medium" href="#">
                        {t("cards.viewAll")}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {t("cards.lastCampaignDate", { date: "1/23/05" })}
                    </p>
                    <div className="flex-1 min-h-0">
                      {/*
                        For Organization Admins: always render chart using API response (may be empty).
                        Do NOT fall back to static sample data when API returns success with empty monthly_data.
                      */}
                      {isOrgAdmin ? (
                        <AreaChart
                          data={campaignMonthly.data}
                          labels={campaignMonthly.labels}
                          seriesName="Modules Completed"
                          yLabel="Modules"
                        />
                      ) : campaignMonthly.data && campaignMonthly.data.length > 0 ? (
                        <AreaChart
                          data={campaignMonthly.data}
                          labels={campaignMonthly.labels}
                          seriesName="Modules Completed"
                          yLabel="Modules"
                        />
                      ) : (
                        <AreaChart />
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3-4: Weekly Progress & Quiz Accuracy (cols 9-12, spans 2 rows) */}
                <div className="col-span-1 md:col-span-4 md:col-start-9 row-start-6 md:row-start-3 md:row-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 p-3 rounded-xl bg-white gap-3 h-full">
                    <div className="bg-[#F1F5F8] rounded-xl p-4 flex flex-col items-center justify-center">
                      <h3 className="text-base font-semibold mb-3">{t("cards.weeklyProgress")}</h3>
                      <CircularProgressChart color="#00CCC4" size={120} value={weeklyProgress} />
                    </div>

                    <div className="bg-[#F1F5F8] rounded-xl p-4 flex flex-col items-center justify-center">
                      <h3 className="text-base font-semibold mb-3">{t("cards.quizAccuracy")}</h3>
                      <CircularProgressChart color="#7CC5FA" size={120} value={quizAccuracy} />
                    </div>
                  </div>
                </div>

                {/* Row 5: Security Awareness Score (cols 9-12) */}
                <div className="col-span-1 md:col-span-4 md:col-start-9 row-start-8 md:row-start-5">
                  <div className="bg-white rounded-xl p-5 flex flex-col h-full justify-center">
                    <div className="flex justify-between items-center">
                      <div className={clsx("flex items-center gap-4", isRtl && "flex-row-reverse")}>
                        <Image
                          alt=""
                          className="w-12 h-12"
                          height={48}
                          src={getContentAssetUrl("/images/icons/shield.svg")}
                          width={48}
                        />
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {t("cards.securityAwarenessScore")}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <p className="text-2xl text-gray-800">
                              {Number(securityAwarenessScore).toFixed(0)}
                            </p>
                            <p className="text-gray-400 text-base font-medium">
                              /{Number(securityAwarenessMax).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`${complianceBadgeClass} text-white text-lg font-medium px-3 py-1 rounded-full`}
                      >
                        {complianceGrade || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 6: Employee Risk States (cols 1-4) */}
                <div className="col-span-1 md:col-span-4 row-start-9 md:row-start-6">
                  <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-between h-full">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">
                      {t("cards.employeeRiskStates")}
                    </h3>
                    <SemiCircleChart
                      admin={riskStats.high}
                      color1="#3ACE89"
                      color2="#BEC3C7"
                      color3="#FB5050"
                      opened={riskStats.medium}
                      sent={riskStats.low}
                    />
                  </div>
                </div>

                {/* Row 6: Employee Certification (cols 5-8) */}
                <div className="col-span-1 md:col-span-4 md:col-start-5 row-start-10 md:row-start-6">
                  <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-between h-full">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">
                      {t("cards.employeeCertification")}
                    </h3>
                    <CertificationChart
                      color="#3ACE89"
                      color2="#FB5050"
                      value={Math.round(
                        (certStats.certified / (certStats.certified + certStats.uncertified || 1)) *
                          100
                      )}
                    />

                    <div className="flex justify-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        {t("cards.certified", { count: certStats.certified })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                        {t("cards.notCertified", { count: certStats.uncertified })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 6: Right Column - All three widgets stacked (cols 9-12) */}
                <div className="col-span-1 md:col-span-4 md:col-start-9 row-start-11 md:row-start-6">
                  <div className="flex flex-col gap-2 h-full">
                    {/* Top 3 Struggling Topics - Very compact */}
                    <div className="bg-white rounded-xl p-3 flex flex-col flex-1 min-h-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {t("cards.top3StrugglingTopics")}
                        </h3>
                        <Link className="text-blue-600 text-xs font-medium" href="#">
                          {t("cards.viewAll")}
                        </Link>
                      </div>

                      <div className="space-y-1">
                        {strugglingModules.length > 0 ? (
                          strugglingModules.map((topic: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-[#F0F7F9] rounded-lg py-1.5 px-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]`}
                                >
                                  <Image
                                    alt=""
                                    className="w-3 h-3"
                                    height={12}
                                    src={getContentAssetUrl("/images/icons/alert.svg")}
                                    width={12}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-800 truncate max-w-[150px]">
                                  {topic.module_name}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-gray-600">
                                {topic.failure_rate}% Fail
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic">No struggling topics</div>
                        )}
                      </div>

                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <Image
                          alt=""
                          className="w-3 h-3"
                          height={12}
                          src={getContentAssetUrl("/images/icons/alert.svg")}
                          width={12}
                        />
                        {t("cards.employeesNeedAttention")}
                      </p>
                    </div>

                    {/* Active Learners - Compact */}
                    <div className="bg-[#10B981] text-white rounded-xl p-3 flex justify-between items-center flex-shrink-0">
                      <div>
                        <h3 className="text-sm font-medium opacity-90">
                          {t("cards.activeLearnersThisMonth")}
                        </h3>
                        <p className="text-xl">{activeLearners}</p>
                      </div>
                      <div className="w-10 h-10">
                        <Image
                          alt=""
                          className="w-10 h-10"
                          height={40}
                          src={getContentAssetUrl("/images/check-fr.svg")}
                          width={40}
                        />
                      </div>
                    </div>

                    {/* Training Completion Rate - Compact */}
                    <div className="bg-[#A78BFA] text-white rounded-xl p-3 flex justify-between items-center flex-shrink-0">
                      <div>
                        <h3 className="text-sm font-medium opacity-90">
                          {t("cards.trainingCompletionRate")}
                        </h3>
                        <p className="text-xl">{trainingCompletionRate}%</p>
                      </div>
                      <div className="relative w-9 h-9">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                        <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent rotate-45" />
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
          </>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
