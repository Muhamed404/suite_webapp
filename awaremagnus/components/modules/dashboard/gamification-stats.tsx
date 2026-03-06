"use client";

import Image from "next/image";
import Link from "next/link";
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

export const GamificationStats = () => {
  const t = useTranslations("dashboard");
  const { user: _user } = useAuthStore();

  // Determine dashboard source (system / organization / user) and map module stats
  const isPlatformAdmin = getIsPlatformAdmin(_user?.role_id);
  const isOrgAdmin = getIsOrgAdmin(_user?.role_id);
  const isUser = getIsUser(_user?.role_id);

  const { data: systemData } = useSystemOverview();
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

  // Avatar numbers (1-9) present in backend and a lookup map by number.
  // We parse the leading digit from `image_small_url` (e.g. "3-...png").
  const unlockedAvatarNumbers = useMemo(() => {
    const set = new Set<number>();
    const items = avatars?.avatar_statistics ?? [];

    for (const a of items) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d)/);

      if (!m) continue;
      const n = Number(m[1]);

      if (n >= 1 && n <= 9) set.add(n);
    }

    return set;
  }, [avatars]);

  const avatarByNumber = useMemo(() => {
    const map = new Map<number, any>();

    for (const a of avatars?.avatar_statistics ?? []) {
      const img = a?.image_small_url ?? "";
      const m = img.trim().match(/^(\d)/);

      if (!m) continue;
      const n = Number(m[1]);

      map.set(n, a);
    }

    return map;
  }, [avatars]);

  // whether Level 1 avatar is present in the backend response
  const isMainUnlocked = avatarByNumber.has(1);

  const AVATAR_LABEL_OVERRIDES: Record<number, string> = {
    2: "Alert\nApprentice",
    3: "Cautious\nLearner",
    4: "Informed\nDefender",
    5: "Vigilant\nGuardian",
    6: "Skilled\nSentinel",
    7: "Resilient\nProtector",
    8: "Advanced\nWatchman",
    9: "Expert\nEnforcer",
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

  const _totalAchievements = stats?.total_achievements || 0;
  const unlockedAchievements = stats?.total_unique_achievements_unlocked || 0;
  const totalUniqueAchievements =
    (stats?.total_unique_achievements_unlocked || 0) +
    (stats?.total_unique_achievements_locked || 0);

  const achievementPercentage =
    totalUniqueAchievements > 0
      ? Math.round((unlockedAchievements / totalUniqueAchievements) * 100)
      : 0;

  // For avatar, we want to show the one with highest employee count? Or just the distribution?
  // The UI shows ONE big avatar "Vulnerable Newbie" and then a grid.
  // I will pick the level with the highest employee count to display as "Main" or just the first one.

  const mainAvatar = useMemo(() => {
    if (!avatars?.avatar_statistics || avatars.avatar_statistics.length === 0) return null;

    // Find highest count? Or just first "unlocked"?
    // Let's Sort by employee_count desc
    return [...avatars.avatar_statistics].sort((a, b) => b.employee_count - a.employee_count)[0];
  }, [avatars]);

  const mainAvatarCount = avatarByNumber.get(1)?.employee_count ?? mainAvatar?.employee_count;

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
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
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
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
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
              <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <Image
                  alt=""
                  className="text-lg"
                  height={28}
                  src={getContentAssetUrl("/images/img/Icon_Trophy.svg")}
                  width={28}
                />
                {t("gamification.achievementGallery")}
              </h2>
              <p className="text-gray-500 text-sm mt-1.5">
                {t("gamification.achievementSubtitle")}
              </p>
            </div>
            <Link className="text-blue-600 text-sm font-medium" href="#">
              {t("cards.viewAll")}
            </Link>
          </div>

          {/* Badges - Always show 16 local achievement icons (1..16). If the
              backend response contains an item whose `image_small_url` starts
              with that number, show the `achived.svg` overlay. */}
          <div className="grid grid-cols-8 gap-4 gap-y-5 mt-10">
            {Array.from({ length: 16 }).map((_, idx) => {
              const num = idx + 1;
              const isUnlocked = unlockedAchievementNumbers.has(num);

              return (
                <div
                  key={num}
                  aria-disabled={!isUnlocked}
                  className={`w-14 h-14 rounded-full flex items-center justify-center relative ${isUnlocked ? "" : "opacity-40"}`}
                  title={isUnlocked ? `Unlocked (#${num})` : `Locked (#${num})`}
                >
                  <Image
                    unoptimized
                    alt={`Achievement ${num}`}
                    className="w-14 h-14"
                    height={56}
                    src={getContentAssetUrl(`/images/achivement/${num}.png`)}
                    width={56}
                  />
                </div>
              );
            })}
          </div>

          {/* Achievement Progress */}
          <div className="mt-12 p-5 bg-white rounded-lg">
            <div className="flex justify-between text-gray-500 text-sm font-medium mb-2">
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
            <h2 className="text-lg font-semibold">{t("gamification.employeeAvatarLevel")}</h2>
            <Link className="text-blue-600 text-sm font-medium" href="#">
              {t("cards.viewAll")}
            </Link>
          </div>

          <div className="flex mt-5 gap-8">
            {/* Main Avatar — always show Level 1 in the large area; use backend metadata when available */}
            <div className="flex flex-col items-center justify-center">
              <div
                aria-disabled={!isMainUnlocked}
                className={`w-24 h-24 bg-gray-200 rounded-full ${!isMainUnlocked ? "opacity-40" : ""}`}
              >
                <Image
                  unoptimized
                  alt="Avatar 1"
                  className="w-24 h-24 rounded-full"
                  height={96}
                  src={getContentAssetUrl(`/images/avatars/1.png`)}
                  width={96}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      getContentAssetUrl("/images/avatars/1.png");
                  }}
                />
              </div>

              <p className="mt-5 text-gray-700 text-sm text-center leading-tight whitespace-pre-line">
                {"Vulnerable\nNewbie"}
              </p>
            </div>

            {/* Levels Grid — show avatars 2..9 (Level 1 is the main slot); overlay `achived.svg` when unlocked */}
            <div className="grid grid-cols-4 gap-5 flex-1 pl-5 border-l border-[#E6E6E6]">
              {Array.from({ length: 8 }).map((_, i) => {
                const num = i + 2; // start from 2 because Level 1 is shown above
                const isUnlocked = unlockedAvatarNumbers.has(num);
                const meta = avatarByNumber.get(num);
                // DO NOT use backend-provided labels; use local overrides or fall back to `Level X`
                const displayLabel = AVATAR_LABEL_OVERRIDES[num] ?? `Level ${num}`;

                return (
                  <div
                    key={num}
                    aria-disabled={!isUnlocked}
                    className={`col-span-1 text-center px-1 py-2.5 transform duration-300 rounded-lg flex flex-col items-center group relative ${isUnlocked ? "hover:bg-[#EFFAFF]" : "opacity-40"}`}
                    title={
                      meta?.employee_count
                        ? `${meta.employee_count} employees`
                        : (meta?.level_name ?? `Level ${num}`)
                    }
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto relative">
                      <Image
                        unoptimized
                        alt={`Avatar ${num}`}
                        className="w-10 h-10 rounded-full"
                        height={40}
                        src={getContentAssetUrl(`/images/avatars/${num}.png`)}
                        width={40}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            getContentAssetUrl("/images/avatars/1.png");
                        }}
                      />
                    </div>

                    <p
                      className={`text-xs leading-tight mt-2 w-[90%] whitespace-pre-line ${isUnlocked ? "text-gray-700" : "text-gray-400"}`}
                    >
                      {displayLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
