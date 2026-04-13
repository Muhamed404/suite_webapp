"use client";

import { useState } from "react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { useAchievementStatistics } from "@/hooks/useDashboard";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";
import { useTranslations } from "@/i18n/useTranslations";
import Image from "next/image";

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

  const achievements = achievementData?.object?.achievement_statistics || [];

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
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-orange-100 text-orange-500">
                  {item.achievement_category}
                </span>
                <span className="text-[11px] text-gray-400">{item.employee_count}x</span>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-3 relative">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <Image
                    unoptimized
                    alt={item.achievement_name}
                    className="w-14 h-14"
                    height={56}
                    src={getContentAssetUrl(`/images/achivement/${item.image_small_url}`)}
                    width={56}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-center">{item.achievement_name}</h3>
              <p className="text-xs text-gray-500 text-center mb-3">{item.achievement_description}</p>
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