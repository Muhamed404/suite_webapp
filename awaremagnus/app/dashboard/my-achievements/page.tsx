"use client";

import { useState } from "react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { useAchievementStatistics } from "@/hooks/useDashboard";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { useTranslations } from "@/i18n/useTranslations";
import Image from "next/image";
import { useI18n } from "@/i18n/I18nProvider";
import achievementTranslationsAr from "@/messages/ar/gamification_achievements-ar.json";

type ArabicAchievementTranslation = {
  name: string;
  description: string;
  category: string;
};

interface Achievement {
  achievement_id: number;
  achievement_name: string;
  achievement_description: string;
  achievement_category: string;
  image_small_url: string;
  employee_count: number;
}

function MyAchievementsContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: achievementData } = useAchievementStatistics();
  const t = useTranslations("dashboard");
  const { locale } = useI18n();
  const isArabic = locale === "ar";
  const achievementFallbackLabel = isArabic ? "إنجاز" : "Achievement";
  const arabicAchievementMap = achievementTranslationsAr.achievements as Record<
    string,
    ArabicAchievementTranslation
  >;

  const resolveAchievementName = (item: Achievement) => {
    if (isArabic) {
      const mappedArabic = arabicAchievementMap[String(item.achievement_id)]?.name;
      if (mappedArabic) return mappedArabic;

      const localizedName =
        (item as any)?.achievement_name_ar ??
        (item as any)?.achievement_name_arabic ??
        (item as any)?.name_ar ??
        (item as any)?.name_arabic;
      if (localizedName) return localizedName;
    }

    if (item.achievement_name) return item.achievement_name;
    return `${achievementFallbackLabel} #${item.achievement_id}`;
  };

  const resolveAchievementDescription = (item: Achievement) => {
    if (isArabic) {
      const mappedArabic = arabicAchievementMap[String(item.achievement_id)]?.description;
      if (mappedArabic) return mappedArabic;

      const localizedDescription =
        (item as any)?.achievement_description_ar ??
        (item as any)?.achievement_description_arabic ??
        (item as any)?.description_ar ??
        (item as any)?.description_arabic;
      if (localizedDescription) return localizedDescription;
    }

    return item.achievement_description ?? "";
  };

  const resolveAchievementCategory = (item: Achievement) => {
    if (isArabic) {
      const mappedArabic = arabicAchievementMap[String(item.achievement_id)]?.category;
      if (mappedArabic) return mappedArabic;
    }
    return item.achievement_category;
  };

  const achievements = achievementData?.object?.achievement_statistics || [];

  const categoryConfig: Record<string, { bg: string; text: string }> = {
    Performance: { bg: "bg-orange-100", text: "text-orange-700" },
    Milestone: { bg: "bg-blue-100", text: "text-blue-700" },
    Behavior: { bg: "bg-red-100", text: "text-red-700" },
    Streak: { bg: "bg-purple-100", text: "text-purple-700" },
    Completion: { bg: "bg-teal-100", text: "text-teal-700" },
    Learning: { bg: "bg-indigo-100", text: "text-indigo-700" },
    Security: { bg: "bg-gray-100", text: "text-gray-700" },
    Awareness: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Training: { bg: "bg-cyan-100", text: "text-cyan-700" },
    Compliance: { bg: "bg-green-100", text: "text-green-700" },
    Risk: { bg: "bg-pink-100", text: "text-pink-700" },
    Engagement: { bg: "bg-lime-100", text: "text-lime-700" },
    Consistency: { bg: "bg-rose-100", text: "text-rose-700" },
    Exploration: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Leadership: { bg: "bg-violet-100", text: "text-violet-700" },
    Mastery: { bg: "bg-amber-100", text: "text-amber-700" },
    Resilience: { bg: "bg-sky-100", text: "text-sky-700" },
    Resourcefulness: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">{t("gamification.achievementHistory")}</h1>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
              title="List View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Achievements */}
        <div
          className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              : "grid grid-cols-1 gap-4"
          }
        >
          {achievements.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 relative">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`px-2 py-0.5 text-[11px] rounded-full ${
                    categoryConfig[item.achievement_category]?.bg ?? "bg-gray-100"
                  } ${categoryConfig[item.achievement_category]?.text ?? "text-gray-500"}`}
                >
                  {resolveAchievementCategory(item)}
                </span>
                <span className="text-[11px] text-gray-400">{item.employee_count}x</span>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-3 relative">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <Image
                    unoptimized
                    alt={resolveAchievementName(item)}
                    className="w-14 h-14"
                    height={56}
                    src={getContentAssetUrl(`/images/achivement/${item.image_small_url}`)}
                    width={56}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-center">{resolveAchievementName(item)}</h3>
              <p className="text-xs text-gray-500 text-center mb-3">{resolveAchievementDescription(item)}</p>
            </div>
          ))}
        </div>

        {/* Fallback for empty achievements */}
        {achievements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("gamification.noAchievementsYet")}</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {t("gamification.noAchievementsMessage")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MyAchievementsPage() {
  return (
    <DashboardLayout>
      <MyAchievementsContent />
    </DashboardLayout>
  );
}