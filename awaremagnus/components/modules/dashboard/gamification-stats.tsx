"use client";

import Image from "next/image";
import Link from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { useMemo } from "react";

import { useTranslations } from "@/i18n/useTranslations";
import {
  useAchievementStatistics,
  useAvatarStatistics,
  useSystemOverview,
  useOrganizationDashboards,
  useUserDashboards,
} from "@/hooks/useDashboard";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  isPlatformAdmin as getIsPlatformAdmin,
  isOrgAdmin as getIsOrgAdmin,
  isUser as getIsUser,
} from "@/utils/roles";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { AvatarStat } from "@/types/dashboard";

export const GamificationStats = () => {
  const t = useTranslations("dashboard");
  const { user: _user } = useAuthStore();

  // Determine dashboard source (system / organization / user) and map module stats
  const isPlatformAdmin = getIsPlatformAdmin(_user?.role_id);
  const isOrgAdmin = getIsOrgAdmin(_user?.role_id);
  const isUser = getIsUser(_user?.role_id);

  const { data: systemData } = useSystemOverview({ enabled: isPlatformAdmin });
  const { data: orgDataResponse } = useOrganizationDashboards();
  const { data: userDataResponse } = useUserDashboards({ userId: _user?.id });

  const dashboardData = useMemo(() => {
    if (isPlatformAdmin && systemData?.statusCode === 200) return systemData.object;
    if (
      isOrgAdmin &&
      orgDataResponse?.statusCode === 200 &&
      orgDataResponse.object.dashboardOrganizations.length > 0
    )
      return orgDataResponse.object.dashboardOrganizations[0];
    if (
      isUser &&
      userDataResponse?.statusCode === 200 &&
      userDataResponse.object.dashboardUsers.length > 0
    )
      return userDataResponse.object.dashboardUsers[0];

    return null;
  }, [isPlatformAdmin, isOrgAdmin, isUser, systemData, orgDataResponse, userDataResponse]);

  const totalEmployeesModulesEnrolled =
    dashboardData && "total_employees_modules_enrolled" in dashboardData
      ? dashboardData.total_employees_modules_enrolled
      : dashboardData && "total_modules_enrolled" in dashboardData
        ? dashboardData.total_modules_enrolled
        : 0;

  const totalCompletedEmployeesModules =
    dashboardData && "total_completed_employees_modules" in dashboardData
      ? dashboardData.total_completed_employees_modules
      : dashboardData && "total_completed_modules" in dashboardData
        ? dashboardData.total_completed_modules
        : 0;

  const courseCompletionPercentage =
    totalEmployeesModulesEnrolled > 0
      ? Math.round((totalCompletedEmployeesModules / totalEmployeesModulesEnrolled) * 100)
      : 0;

  const studyTimeHours =
    dashboardData && "total_study_time" in dashboardData
      ? Math.floor(dashboardData.total_study_time / 3600)
      : 0;

  const { data: achievementData } = useAchievementStatistics();
  const { data: avatarData } = useAvatarStatistics();

  const stats = (achievementData as any)?.object ?? (achievementData as any)?.data;
  const avatars = (avatarData as any)?.object ?? (avatarData as any)?.data;

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

  const resolveAvatarImage = (avatar?: AvatarStat) => {
    if (!avatar) return "1.png";
    return avatarImageByLevel[avatar.level_number] ?? avatar.image_small_url ?? "1.png";
  };




  // Set of achievement numbers (1-16) present in the backend response. We
  // parse the leading number from `image_small_url` (e.g. "1-quick-learner.png").
  const unlockedAchievementNumbers = useMemo(() => {
    const set = new Set<number>();
    const items = stats?.achievement_statistics ?? [];

    for (const a of items) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d{1,2})/);

      if (!m) continue;
      const n = Number(m[1]);

      if (n >= 1 && n <= 16) set.add(n);
    }

    return set;
  }, [stats]);

  // Map: achievement number → full stats object (for tooltip data)
  const achievementByNumber = useMemo(() => {
    const map = new Map<number, any>();
    const items = stats?.achievement_statistics ?? [];

    for (const a of items) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d{1,2})/);

      if (!m) continue;
      const n = Number(m[1]);

      if (n >= 1 && n <= 16) map.set(n, a);
    }

    return map;
  }, [stats]);

  // Display order: unlocked achievements first, then locked — capped at 16
  const achievementDisplayOrder = useMemo(() => {
    const all = Array.from({ length: 16 }, (_, i) => i + 1);

    return all.sort((a, b) => {
      const aUnlocked = unlockedAchievementNumbers.has(a) ? 0 : 1;
      const bUnlocked = unlockedAchievementNumbers.has(b) ? 0 : 1;

      return aUnlocked - bUnlocked;
    });
  }, [unlockedAchievementNumbers]);

  const unlockedAchievements = stats?.total_unique_achievements_unlocked || 0;
  const totalUniqueAchievements =
    (stats?.total_unique_achievements_unlocked || 0) +
    (stats?.total_unique_achievements_locked || 0);

  const achievementPercentage =
    totalUniqueAchievements > 0
      ? Math.round((unlockedAchievements / totalUniqueAchievements) * 100)
      : 0;

  // Find the unlocked avatar with the highest level to show in the main slot
  const avatarStats = useMemo(() => {
    const items = (avatars?.avatar_statistics ?? []) as AvatarStat[];
    return [...items].sort((a, b) => {
      const aUnlocked = (a.employee_count ?? 0) > 0 ? 0 : 1;
      const bUnlocked = (b.employee_count ?? 0) > 0 ? 0 : 1;

      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return b.level_number - a.level_number;
    });
  }, [avatars]);

  const mainAvatar = useMemo(() => {
    if (avatarStats.length === 0) {
      return {
        level_number: 1,
        level_name: "Vulnerable Newbie",
        min_score_or_percentage: 0,
        max_score_or_percentage: 6,
        image_small_url: "Vulnerablenewbe_Level1_Robot.png",
        employee_count: 0,
      } as AvatarStat;
    }

    return avatarStats[0];
  }, [avatarStats]);

  // Check if main avatar is unlocked (has employee_count > 0)
  const isMainAvatarUnlocked = (mainAvatar?.employee_count ?? 0) > 0;
  
  // Get the actual image filename for the main avatar from API response
  const mainAvatarImageName = useMemo(() => resolveAvatarImage(mainAvatar), [mainAvatar]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--mainblue)]">{t("gamification.title")}</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Course Completed 
            This data usually comes from main dashboard, but here we can't easily access it without props.
            For now, I will hardcode or hide it if not available in these specific endpoints. 
            Actually, "Course Completed" is not in gamification endpoints. 
            I will leave it static or 0 for now as per instructions "leave it static".
        */}
        <div className="col-span-3 row-span-1 bg-white rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Image
              alt=""
              className="text-lg"
              height={28}
              src={getContentAssetUrl("/images/gard_cap.svg")}
              width={28}
            />
            <div>
              {t("gamification.courseCompleted")}
              <div className="text-base font-semibold text-gray-900">
                {totalCompletedEmployeesModules}/{totalEmployeesModulesEnrolled}
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-5">
            <div
              className="h-1.5 bg-green-500 rounded-full"
              style={{ width: `${courseCompletionPercentage}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="col-span-3 col-start-4 row-span-1 bg-white rounded-xl p-4 flex flex-col justify-start">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Image
              alt=""
              className="text-lg"
              height={28}
              src={getContentAssetUrl("/images/clock_icon.svg")}
              width={28}
            />
            <div>
              {t("gamification.studyTime")}
              <div className="text-base font-semibold text-gray-900">{studyTimeHours}h</div>
            </div>
          </div>
        </div>

        {/* Achievement Gallery */}
        <div className="col-span-6 col-start-7 row-span-3 bg-[linear-gradient(114.67deg,#FFFEFC_5.61%,#FDECE0_98.45%)] rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-md flex items-center gap-2">
                <Image
                  alt=""
                  className="text-lg"
                  height={28}
                  src={getContentAssetUrl("/images/img/Icon_Trophy.svg")}
                  width={28}
                />
                {t("gamification.achievementGallery")}
              </h2>
              <p className="text-gray-500 text-xs mt-1.5">
                {t("gamification.achievementSubtitle")}
              </p>
            </div>
            <Link className="text-blue-600 text-xs font-medium" href="#">
              {t("cards.viewAll")}
            </Link>
          </div>

          {/* Badges - Always show 16 local achievement icons (1..16). If the
              backend response contains an item whose `image_small_url` starts
              with that number, show the `achived.svg` overlay. Unlocked badges
              are shown first; tooltip shows name, description, count & status. */}
          <div className="grid grid-cols-8 gap-4 gap-y-5 mt-10">
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
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isUnlocked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
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
                    className={`w-14 h-14 rounded-full flex items-center justify-center relative cursor-default ${isUnlocked ? "" : "opacity-40"}`}
                  >
                    <Image
                      unoptimized
                      alt={meta?.achievement_name ?? `Achievement ${num}`}
                      className="w-14 h-14"
                      height={56}
                      src={getContentAssetUrl(`/images/achivement/${num}.png`)}
                      width={56}
                    />
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {/* Achievement Progress */}
          <div className="mt-12 p-5 bg-white rounded-lg">
            <div className="flex justify-between text-gray-500 text-xs font-medium mb-2">
              <span>{t("gamification.achievements")}</span>
              <div>
                <span className="text-gray-700 text-base font-semibold">
                  {unlockedAchievements}/
                </span>
                <span className="text-gray-700 text-base">{totalUniqueAchievements}</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full">
              <div
                className="h-2.5 bg-purple-500 rounded-full"
                style={{ width: `${achievementPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Employee Avatar Level */}
        <div className="col-span-6 row-span-2 row-start-2 bg-white rounded-xl p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-md font-semibold">{t("gamification.employeeAvatarLevel")}</h2>
            <Link className="text-blue-600 text-xs font-medium" href="#">
              {t("cards.viewAll")}
            </Link>
          </div>

          <div className="flex mt-5 gap-8">
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
                  <Image
                    unoptimized
                    alt={`Level ${mainAvatar?.level_number ?? 1}`}
                    className="w-24 h-24 rounded-full object-cover object-top"
                    height={96}
                    src={getContentAssetUrl(`/images/avatars/${mainAvatarImageName}`)}
                    width={96}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        getContentAssetUrl("/images/avatars/1.png");
                    }}
                  />
                </div>
              </Tooltip>

              <p className="mt-5 text-gray-700 text-sm text-center leading-tight whitespace-pre-line">
                {mainAvatar?.level_name ?? "Vulnerable\nNewbie"}
              </p>
            </div>

            {/* Levels Grid — show 8 remaining avatars excluding the one in main slot */}
            <div className="grid grid-cols-4 gap-5 flex-1 pl-5 border-l border-[#E6E6E6]">
              {(() => {
                const availableAvatars = avatarStats
                  .filter((avatar) => avatar.level_number !== mainAvatar?.level_number)
                  .slice(0, 8);

                return (availableAvatars as AvatarStat[]).map((avatar) => {
                  const isUnlocked = avatar.employee_count > 0;
                  const avatarImageName = resolveAvatarImage(avatar);

                  const tooltipContent = (
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
                        <span className="text-xs text-gray-500">
                          {avatar.employee_count}x
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <Tooltip key={avatar.level_number} content={tooltipContent} placement="top">
                      <div
                        aria-disabled={!isUnlocked}
                        className={`col-span-1 text-center px-1 py-2.5 transform duration-300 rounded-lg flex flex-col items-center group relative cursor-default ${
                          isUnlocked ? "hover:bg-[#EFFAFF]" : "opacity-40"
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto relative">
                          <Image
                            unoptimized
                            alt={`Level ${avatar.level_number}`}
                            className="w-10 h-10 rounded-full"
                            height={40}
                            src={getContentAssetUrl(`/images/avatars/${avatarImageName}`)}
                            width={40}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                getContentAssetUrl("/images/avatars/1.png");
                            }}
                          />
                        </div>

                        <p
                          className={`text-xs leading-tight mt-2 w-[90%] whitespace-pre-wrap ${
                            isUnlocked ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {avatar.level_name}
                        </p>
                      </div>
                    </Tooltip>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
