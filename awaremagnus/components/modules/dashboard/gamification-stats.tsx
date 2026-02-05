"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { useTranslations } from "@/i18n/useTranslations";
import {
  useAchievementStatistics,
  useAvatarStatistics,
} from "@/hooks/useDashboard";
import { useAuthStore } from "@/hooks/useAuthStore";

export const GamificationStats = () => {
  const t = useTranslations("dashboard");
  const { user: _user } = useAuthStore();

  // Platform admins see aggregated stats by default unless orgId is passed (can be enhancement later)
  // Org admins see their org stats.
  // Users see their own stats (API handles it).

  const { data: achievementData } = useAchievementStatistics();
  const { data: avatarData } = useAvatarStatistics();

  const stats = achievementData?.data;
  const avatars = avatarData?.data;

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
    if (!avatars?.avatar_statistics || avatars.avatar_statistics.length === 0)
      return null;

    // Find highest count? Or just first "unlocked"?
    // Let's Sort by employee_count desc
    return [...avatars.avatar_statistics].sort(
      (a, b) => b.employee_count - a.employee_count,
    )[0];
  }, [avatars]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">{t("gamification.title")}</h3>
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
              src="/images/gard_cap.svg"
              width={28}
            />
            <div>
              {t("gamification.courseCompleted")}
              <div className="text-2xl text-gray-900">8/12</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-5">
            <div
              className="h-1.5 bg-green-500 rounded-full"
              style={{ width: "70%" }}
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
              src="/images/clock_icon.svg"
              width={28}
            />
            <div>
              {t("gamification.studyTime")}
              <div className="text-2xl text-gray-900">127h</div>
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
                  src="/images/img/Icon_Trophy.svg"
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

          {/* Badges - Display fetched achievements */}
          <div className="grid grid-cols-8 gap-4 gap-y-5 mt-10">
            {stats?.achievement_statistics?.slice(0, 15).map((ach, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-full flex items-center justify-center relative group"
              >
                {/* Use the image URL from API if valid, else placeholder */}
                {ach.image_small_url ? (
                  <Image
                    alt={ach.achievement_name}
                    className="w-14 h-14"
                    height={56}
                    src={`/images/achivement/${ach.image_small_url}`}
                    width={56}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/achivement/1.png";
                    }}
                  />
                ) : (
                  <Image
                    alt=""
                    className="w-14 h-14"
                    height={56}
                    src={`/images/achivement/${(i % 5) + 1}.png`}
                    width={56}
                  />
                )}

                {/* Show tooltip or count? */}
                {ach.employee_count > 0 && (
                  <span className="absolute top-0 -right-1 w-5 h-5 flex items-center justify-center bg-blue-500 text-white text-[10px] rounded-full">
                    {ach.employee_count}
                  </span>
                )}
              </div>
            ))}

            {(!stats?.achievement_statistics ||
              stats.achievement_statistics.length === 0) && (
              <div className="col-span-8 text-center text-gray-400 text-sm">
                No achievements found
              </div>
            )}
          </div>

          {/* Achievement Progress */}
          <div className="mt-12 p-5 bg-white rounded-lg">
            <div className="flex justify-between text-gray-500 text-sm font-medium mb-2">
              <span>{t("gamification.achievements")}</span>
              <div>
                <span className="text-gray-700 text-xl">
                  {unlockedAchievements}/
                </span>
                <span className="text-gray-700 text-base">
                  {totalUniqueAchievements}
                </span>
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
            <h2 className="text-lg font-semibold">
              {t("gamification.employeeAvatarLevel")}
            </h2>
            <Link className="text-blue-600 text-sm font-medium" href="#">
              {t("cards.viewAll")}
            </Link>
          </div>

          <div className="flex mt-5 gap-8">
            {/* Main Avatar */}
            {mainAvatar ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full">
                  <Image
                    alt=""
                    className="w-24 h-24 rounded-full"
                    height={96}
                    src={`/images/avatars/${mainAvatar.image_small_url}`}
                    width={96}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/avatars/1.png";
                    }}
                  />
                </div>
                <p className="mt-5 text-gray-700 text-sm text-center leading-tight whitespace-pre-line">
                  {mainAvatar.level_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {mainAvatar.employee_count} Users
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-24">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
              </div>
            )}

            {/* Levels Grid */}
            <div className="grid grid-cols-4 gap-5 flex-1 pl-5 border-l border-[#E6E6E6]">
              {avatars?.avatar_statistics?.map((level, index) => (
                <div
                  key={index}
                  className="col-span-1 text-center px-1 py-2.5 hover:bg-[#EFFAFF] transform duration-300 rounded-lg flex flex-col items-center group relative"
                  title={`${level.employee_count} employees`}
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto">
                    <Image
                      alt=""
                      className="w-10 h-10 rounded-full"
                      height={40}
                      src={`/images/avatars/${level.image_small_url}`}
                      width={40}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/avatars/1.png";
                      }}
                    />
                  </div>
                  <p className="text-xs leading-tight text-gray-700 mt-2 w-[90%] truncate">
                    {level.level_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
