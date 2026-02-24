"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, AlertCircle, Play, Trophy } from "lucide-react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useUpdateCampaign, useCampaignDashboard } from "@/hooks/useCampaigns";
import { useI18n } from "@/i18n/I18nProvider";
import { useTranslations } from "@/i18n/useTranslations";
import {
  useOrganizationLeaderboard,
  useAvatarStatistics,
  useAchievementStatistics,
} from "@/hooks/useDashboard";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const t = useTranslations("dashboard");

  const [isActive, setIsActive] = useState(true);
  
  const campaignId = params?.id ? Number(params.id) : 0;
  const updateCampaign = useUpdateCampaign();
  
  // Fetch all campaign data from dashboard API
  const { data: campaignDashboard, isLoading } = useCampaignDashboard(campaignId);
  
  // Fetch gamification and leaderboard data
  const { data: leaderboardData } = useOrganizationLeaderboard({
    campaignId,
    count: 10,
  });
  const { data: avatarData } = useAvatarStatistics();
  const { data: achievementData } = useAchievementStatistics();

  // Achievement display values: total uses design default (50) when API is missing/zero,
  // unlocked comes directly from API (0 is a valid value).
  const achievementUnlocked = achievementData?.data?.total_unique_achievements_unlocked ?? 0;
  const achievementTotal = achievementData?.data?.total_achievements || 50;
  const achievementPercent = achievementTotal > 0 ? Math.round((achievementUnlocked / achievementTotal) * 100) : 0;

  const handleLaunchCampaign = async () => {
    if (!campaignDashboard) return;

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        payload: { campaign: { status_id: 2 } } // ACTIVE status
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

  // Log campaign dashboard for debugging
  // Note: duplicated "Campaign Performance Metrics" block was removed to match HTML design
  useEffect(() => {
    if (campaignDashboard) {
      console.log('Campaign Dashboard:', campaignDashboard);
    }
  }, [campaignDashboard]);



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
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => router.push("/dashboard/launch-awareness/campaigns")}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="text-xs text-gray-500">
                Awareness Campaign &gt; {campaignDashboard?.name || `Campaign ${campaignId}`}
              </div>
            </div>
            
            {/* Launch Button - Show for In Progress campaigns */}
            {campaignDashboard?.status_id === 20 && (
              <Button
                size="sm"
                color="primary"
                startContent={<Play className="w-4 h-4" />}
                onClick={handleLaunchCampaign}
                isLoading={updateCampaign.isPending}
                className="text-white"
              >
                Launch Campaign
              </Button>
            )}

            {/* Leaderboard Button */}
            <Button
              size="sm"
              variant="bordered"
              startContent={<Trophy className="w-4 h-4" />}
              onClick={() => router.push(`/dashboard/launch-awareness/campaigns/leaderboard?campaign=${campaignId}`)}
              className="border-gray-300"
            >
              Leaderboard
            </Button>
          </div>

          {/* First Section - Campaign Details Grid */}
          <div className="grid grid-cols-12 gap-2 mb-2">
            {/* Campaign Details Card */}
            <div className="bg-white p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 col-span-8 row-span-5">
              {/* Left Section - Campaign Info */}
              <div className="space-y-3 text-gray-700">
                <h2 className="text-lg font-semibold mb-4">{campaignDashboard?.name || "Campaign"}</h2>

                <div className="grid grid-cols-3 text-xs gap-y-2">
                  <span className="font-medium">Name:</span>
                  <span className="col-span-2">{campaignDashboard?.name || "-"}</span>

                  <span className="font-medium">Description:</span>
                  <span className="col-span-2">{campaignDashboard?.description || "-"}</span>

                  <span className="font-medium">Departments:</span>
                  <span className="col-span-2">{campaignDashboard?.departments?.total || 0}</span>

                  <span className="font-medium">Groups:</span>
                  <span className="col-span-2">{campaignDashboard?.groups?.total || 0}</span>

                  <span className="font-medium">Users:</span>
                  <span className="col-span-2">{campaignDashboard?.total_users_enrolled || 0}</span>

                  <span className="font-medium">Start Date:</span>
                  <span className="col-span-2">{formatDate(campaignDashboard?.start_date)}</span>

                  <span className="font-medium">End Date:</span>
                  <span className="col-span-2">{formatDate(campaignDashboard?.end_date)}</span>
                </div>
              </div>

              {/* Right Section - Topics Schedule & Settings */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                {/* Topics Schedule */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-4 h-4">
                      <img src="/awm/images/img/calendar.svg" alt="" className="w-full h-full" />
                    </span>
                    <h3 className="font-semibold text-gray-800 text-sm">Topics Schedule</h3>
                  </div>

                  <div className="space-y-2 text-gray-700 text-xs">
                    {campaignDashboard?.upcoming_topics && campaignDashboard.upcoming_topics.length > 0 ? (
                      campaignDashboard.upcoming_topics.map((topic: any, idx: number) => (
                        <p key={idx}>
                          {topic.module_name || `Module ${topic.module_id}`} -{" "}
                          {formatDate(topic.start_date)}
                        </p>
                      ))

                    ) : (
                      <p className="text-gray-400">No schedule available</p>
                    )}
                  </div>

                  {/* Campaign Status (matches design) */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-200">
                    <label className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={campaignDashboard?.status_id === 2}
                        readOnly
                        className="w-3.5 h-3.5 rounded border-gray-400"
                      />
                      Campaign Status
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">{campaignDashboard?.status_id === 2 ? "Active" : "Inactive"}</span>

                      <label className="relative inline-flex items-center">
                        {/* Static toggle (visual only) */}
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={campaignDashboard?.status_id === 2}
                          readOnly
                        />
                        <div className="w-6 h-3 bg-gray-400 peer-checked:bg-blue-500 rounded-full transition"></div>
                        <div className="absolute left-[0px] top-[1.2px] bg-white w-2.5 h-2.5 rounded-full peer-checked:translate-x-3 transition"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Enabled Features */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-gray-700 font-medium text-xs mb-2">Enabled Features</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {campaignDashboard?.settings?.enable_gamification && <span>✓ Gamification</span>}
                    {campaignDashboard?.settings?.enable_quiz && <span>✓ Quiz</span>}
                    {campaignDashboard?.settings?.enable_certificate && <span>✓ Certificate</span>}
                    {campaignDashboard?.settings?.enable_motion_videos && <span>✓ Videos</span>}
                    {campaignDashboard?.settings?.enable_interactive_ispring && <span>✓ Interactive</span>}
                    {campaignDashboard?.settings?.enable_documents && <span>✓ Documents</span>}
                    {campaignDashboard?.settings?.enable_games && <span>✓ Games</span>}
                    {campaignDashboard?.settings?.enable_misc_items && <span>✓ Miscellaneous</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Days Card */}
            <div className="col-span-4 row-span-2 col-start-9">
              <div className="bg-white rounded-xl p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <p className="text-gray-600 text-xs">Remaining days</p>
                  <div className="w-6 h-6">
                    <img src="/awm/images/img/calendar.svg" alt="" className="w-full h-full" />
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <span className="text-3xl text-[#3FBDFF] font-bold">
                    {campaignDashboard?.remaining_days || calculateRemainingDays()}
                  </span>
                  <span className="text-sm text-gray-800 font-semibold">Days</span>
                </div>
              </div>
            </div>

            {/* Campaign Progress */}
            <div className="col-span-8 row-span-2 col-start-1 row-start-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 text-xs">Campaign Progress</span>
                  <span className="text-gray-700 font-medium text-xs">{campaignDashboard?.metrics?.campaign_progress_percent ?? progress}%</span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${campaignDashboard?.metrics?.campaign_progress_percent ?? progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top 3 Struggling Topics */}
            <div className="col-span-4 row-span-4 col-start-9 row-start-3 bg-white rounded-lg p-3 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] font-semibold text-gray-800">
                  Top 3 Struggling Topics
                </h3>
                <a href="#" className="text-blue-600 text-[10px] font-medium">
                  View All
                </a>
              </div>

              <div className="space-y-1 flex-1">
                {campaignDashboard?.top_struggling_topics && campaignDashboard.top_struggling_topics.length > 0 ? (
                  campaignDashboard.top_struggling_topics.slice(0, 3).map((topic: any, idx: number) => {
                    // Map topic names to icon paths and colors
                    const iconMap: Record<string, { icon: string; color: string; textColor: string }> = {
                      "WIFI Security": { icon: "/awm/images/icons/wifi.svg", color: "#C9F1E2", textColor: "#0D9488" },
                      "Physical Security": { icon: "/awm/images/icons/physical.svg", color: "#DCE9FF", textColor: "#2563EB" },
                      "Phishing Security": { icon: "/awm/images/icons/phishing.svg", color: "#FEE2E2", textColor: "#DC2626" },
                    };
                    const config = iconMap[topic.topic_name || ""] || { icon: "/awm/images/icons/default.svg", color: "#F0F0F0", textColor: "#666" };
                    return (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-[#F0F7F9] rounded-md py-1 px-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center`} style={{ backgroundColor: config.color }}>
                        <img src={config.icon} className="w-2 h-2" alt="" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-800">{topic.topic_name || "Unknown Topic"}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-2.5 h-2.5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
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
                <img src="/awm/images/icons/alert.svg" className="w-2.5 h-2.5" alt="" />
                Your employees need attention on these topics
              </p>
            </div>

            {/* Employee Risk States - Placeholder for chart */}
            <div className="col-span-4 row-span-4 col-start-1 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Risk States</h3>
              <div className="flex gap-6 text-xs mb-4">
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-green-600">
                    {campaignDashboard?.metrics?.total_low_risk_employees || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Low Risk</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {campaignDashboard?.metrics?.total_medium_risk_employees || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Medium Risk</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-red-600">
                    {campaignDashboard?.metrics?.total_high_risk_employees || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>High Risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Certification - Placeholder for chart */}
            <div className="col-span-4 row-span-4 col-start-5 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">
                Employee Certification
              </h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Certified: {campaignDashboard?.metrics?.total_certified_employees || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Pending: {(campaignDashboard?.metrics?.total_employees_modules_enrolled || 0) - (campaignDashboard?.metrics?.total_certified_employees || 0)}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="col-span-4 row-span-5 col-start-9 row-start-7 bg-white rounded-xl p-3 space-y-4">

              {/* Weekly Progress & Quiz Accuracy Charts */}
              <div className="grid grid-cols-2 gap-2">
                {/* Weekly Progress */}
                <div className="bg-gray-50 p-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-gray-700 text-[10px] font-medium mb-2">Weekly Progress</span>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#00CCC4"
                        strokeWidth="3"
                        strokeDasharray={`${(campaignDashboard?.metrics?.weekly_progress_percent || 0) * 1.76} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-gray-800">{campaignDashboard?.metrics?.weekly_progress_percent || 0}%</span>
                  </div>
                </div>

                {/* Quiz Accuracy */}
                <div className="bg-gray-50 p-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-gray-700 text-[10px] font-medium mb-2">Quiz Accuracy</span>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#7A5CFF"
                        strokeWidth="3"
                        strokeDasharray={`${(campaignDashboard?.metrics?.quizzes_accuracy_percent || 0) * 1.76} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-gray-800">{campaignDashboard?.metrics?.quizzes_accuracy_percent || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="bg-[#FFEEE7] p-2 rounded-xl flex items-center justify-between border border-orange-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5">
                    <img src="/awm/images/fire-red.svg" alt="" className="w-full h-full" />
                  </div>
                  <span className="text-gray-700 font-medium text-[10px]">Active Learner This Month</span>
                </div>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaignDashboard?.metrics?.total_active_learner || 0}
                </span>
              </div>

              <div className="bg-[#E6FFFA] p-2 rounded-xl flex items-center justify-between border border-teal-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5">
                    <img src="/awm/images/fire-teal.svg" alt="" className="w-full h-full" />
                  </div>
                  <span className="text-gray-700 font-medium text-[10px]">Training Completion Rate</span>
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
                  <span className="text-lg"><img src="/awm/images/gard_cap.svg" alt="" className="w-5 h-5" /></span>
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
                          ? `${(
                              (campaignDashboard?.metrics?.total_completed_employees_modules || 0) /
                              (campaignDashboard?.metrics?.total_employees_modules_enrolled || 1)
                            ) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Study Time */}
              <div className="col-span-3 row-span-1 col-start-4 bg-white rounded-xl p-3 flex flex-col justify-start">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="text-lg">
                    <img src="/awm/images/clock_icon.svg" alt="" className="w-5 h-5" />
                  </span>
                  <div>
                    Study Time
                    <div className="text-xl text-gray-900">
                      {(campaignDashboard?.metrics?.total_study_time)
                        ? Math.round((campaignDashboard?.metrics?.total_study_time) / 60)
                        : 0}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Gallery - Takes up more space */}
              <div className="col-span-6 row-span-3 bg-gradient-to-br from-[#FFFEFC] to-[#FDECE0] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
                      <span className="text-lg"><img src="/awm/images/img/Icon_Trophy.svg" alt="" className="w-5 h-5" /></span>
                      Achievement Gallery
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">Organization locked and unlocked badges</p>
                  </div>
                  <a href="#" className="text-blue-600 text-xs font-medium">View All</a>
                </div>
                <div className="grid grid-cols-8 gap-3 gap-y-4 mt-8">
                  {/* Achievement badges - Static 16 badges */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((idx) => {
                    // First 7 badges are unlocked
                    const isUnlocked = idx <= 7;
                    return (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-full flex items-center justify-center relative"
                      >
                        <img src={`/awm/images/achivement/${idx}.png`} alt="" className="w-full h-full" />
                        {isUnlocked && (
                          <span className="absolute top-0 -right-1 w-4 h-4">
                            <img src="/awm/images/achivement/achived.svg" alt="" className="w-full h-full" />
                          </span>
                        )}
                      </div>
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
                  <h2 className="text-base font-semibold">Employee Avatar Level</h2>
                  <a href="#" className="text-blue-600 text-xs font-medium">View All</a>
                </div>

                <div className="mt-4 flex gap-6 items-start">
                  {/* Large left avatar */}
                  <div className="flex-shrink-0 w-28 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                      <img src={`/awm/images/avatars/1.png`} alt="Vulnerable Newbie" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[12px] leading-tight text-gray-700 mt-4 whitespace-pre-line text-center">Vulnerable\nNewbie</p>
                  </div>

                  {/* vertical divider */}
                  <div className="w-px bg-gray-200 self-stretch my-1" />

                  {/* Grid of smaller avatars (4 cols x 2 rows) */}
                  <div className="grid grid-cols-4 gap-6 flex-1">
                    {[
                      { name: "Alert\nApprentice", img: 2 },
                      { name: "Cautious\nLearner", img: 3 },
                      { name: "Informed\nDefender", img: 4 },
                      { name: "Vigilant\nGuardian", img: 5 },
                      { name: "Skilled\nSentinel", img: 6 },
                      { name: "Resilient\nProtector", img: 7 },
                      { name: "Advanced\nWatchman", img: 8 },
                      { name: "Expert\nEnforcer", img: 9 },
                    ].map((avatar, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "flex flex-col items-center",
                          avatar.img === 9 ? "rounded-xl bg-[#F1FAFF] p-3" : ""
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E6FFFB] flex items-center justify-center overflow-hidden border border-gray-200">
                          <img src={`/awm/images/avatars/${avatar.img}.png`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] leading-tight text-gray-700 mt-2 whitespace-pre-line text-center">{avatar.name}</p>
                      </div>
                    ))}
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
                  size="sm"
                  variant="light"
                  onClick={() =>
                    router.push(`/dashboard/launch-awareness/campaigns/${campaignId}/employees?risk=high`)
                  }
                  className="text-xs text-blue-600"
                >
                  View All
                </Button>
              </div>

              {(leaderboardData?.data?.top_high_risk_employees ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">User ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Risk Level</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Compliance</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">XP Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leaderboardData?.data?.top_high_risk_employees ?? []).slice(0, 10).map((employee: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-700">User {employee.user_id}</td>
                          <td className="py-2 px-2">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                              {employee.risk_level}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-700">{employee.compliance_score}%</td>
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
                  size="sm"
                  variant="light"
                  onClick={() =>
                    router.push(`/dashboard/launch-awareness/campaigns/${campaignId}/employees?risk=low`)
                  }
                  className="text-xs text-blue-600"
                >
                  View All
                </Button>
              </div>

              {(leaderboardData?.data?.top_low_risk_employees ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">User ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Risk Level</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Compliance</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">XP Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leaderboardData?.data?.top_low_risk_employees ?? []).slice(0, 10).map((employee: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-700">User {employee.user_id}</td>
                          <td className="py-2 px-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                              {employee.risk_level}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-700">{employee.compliance_score}%</td>
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
