"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, Calendar, AlertCircle, Play, Trophy } from "lucide-react";
import clsx from "clsx";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { useI18n } from "@/i18n/I18nProvider";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { dir } = useI18n();
  const isRtl = dir === "rtl";

  const [isActive, setIsActive] = useState(true);

  const campaignId = Number(params.id);
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateCampaign = useUpdateCampaign();

  const handleLaunchCampaign = async () => {
    if (!campaign) return;

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
    if (!campaign?.end_date) return 0;
    const end = new Date(campaign.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const calculateProgress = () => {
    if (!campaign?.start_date || !campaign?.end_date) return 0;
    const start = new Date(campaign.start_date).getTime();
    const end = new Date(campaign.end_date).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const progress = calculateProgress();

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
                Awareness Campaign &gt; {campaign?.name || `Campaign ${campaignId}`}
              </div>
            </div>
            
            {/* Launch Button - Show for In Progress campaigns */}
            {campaign?.status_id === 20 && (
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
                <h2 className="text-lg font-semibold mb-4">{campaign?.name || "Campaign"}</h2>

                <div className="grid grid-cols-3 text-xs gap-y-2">
                  <span className="font-medium">Name:</span>
                  <span className="col-span-2">{campaign?.name || "-"}</span>

                  <span className="font-medium">Description:</span>
                  <span className="col-span-2">{campaign?.description || "-"}</span>

                  <span className="font-medium">Departments:</span>
                  <span className="col-span-2">{campaign?.departments?.length || 0}</span>

                  <span className="font-medium">Groups:</span>
                  <span className="col-span-2">{campaign?.groups?.length || 0}</span>

                  <span className="font-medium">Users:</span>
                  <span className="col-span-2">{campaign?.invitees?.length || 0}</span>

                  <span className="font-medium">Start Date:</span>
                  <span className="col-span-2">{formatDate(campaign?.start_date)}</span>

                  <span className="font-medium">End Date:</span>
                  <span className="col-span-2">{formatDate(campaign?.end_date)}</span>
                </div>
              </div>

              {/* Right Section - Topics Schedule & Settings */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                {/* Topics Schedule */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-800 text-sm">Topics Schedule</h3>
                  </div>

                  <div className="space-y-2 text-gray-700 text-xs">
                    {campaign?.moduleSchedules && campaign.moduleSchedules.length > 0 ? (
                      campaign.moduleSchedules.map((schedule: any, idx: number) => (
                        <p key={idx}>
                          {schedule.module?.code || `Module ${schedule.module_id}`} -{" "}
                          {formatDate(schedule.start_date)}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-400">No schedule available</p>
                    )}
                  </div>
                </div>

                {/* Enabled Features */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-gray-700 font-medium text-xs mb-2">Enabled Features</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    {campaign?.enable_gamification && <span>✓ Gamification</span>}
                    {campaign?.enable_quiz && <span>✓ Quiz</span>}
                    {campaign?.enable_certificate && <span>✓ Certificate</span>}
                    {campaign?.enable_motion_videos && <span>✓ Videos</span>}
                    {campaign?.enable_interactive_ispring && <span>✓ Interactive</span>}
                    {campaign?.enable_documents && <span>✓ Documents</span>}
                    {campaign?.enable_games && <span>✓ Games</span>}
                    {campaign?.enable_misc_items && <span>✓ Miscellaneous</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Days Card */}
            <div className="col-span-4 row-span-2 col-start-9">
              <div className="bg-white rounded-xl p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <p className="text-gray-600 text-xs">Remaining days</p>
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <span className="text-3xl text-[#3FBDFF] font-bold">
                    {calculateRemainingDays()}
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
                  <span className="text-gray-700 font-medium text-xs">{progress}%</span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
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
                {[
                  { name: "Phishing Awareness", value: 65 },
                  { name: "Password Security", value: 58 },
                  { name: "Data Privacy", value: 52 },
                ].map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-[#F0F7F9] rounded-md py-1 px-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] text-gray-700">{topic.name}</span>
                      <span className="text-[9px] text-gray-500">({topic.value}%)</span>
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
                ))}
              </div>

              <p className="text-[8px] text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                Your employees need attention on these topics
              </p>
            </div>

            {/* Employee Risk States - Placeholder for chart */}
            <div className="col-span-4 row-span-4 col-start-1 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">Employee Risk States</h3>
              <div className="text-center text-gray-400 text-xs py-8">Chart visualization</div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Low Risk</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>High Risk</span>
                </div>
              </div>
            </div>

            {/* Employee Certification - Placeholder for chart */}
            <div className="col-span-4 row-span-4 col-start-5 row-start-8 bg-white rounded-xl p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-gray-800 mb-2">
                Employee Certification
              </h3>
              <div className="text-center text-gray-400 text-xs py-8">Chart visualization</div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Certified: {campaign?.statistics?.total_completed_certifications || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="col-span-4 row-span-5 col-start-9 row-start-7 bg-white rounded-xl p-3 space-y-4">
              {/* Campaign Configuration */}
              <div className="space-y-2">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-700 text-[10px] font-medium">Quiz Pass Threshold</span>
                  <div className="text-lg font-bold text-[#7A5CFF]">{campaign?.quiz_passing_threhold_percentage || 0}%</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-700 text-[10px] font-medium">Max Quiz Retries</span>
                  <div className="text-lg font-bold text-[#00CCC4]">{campaign?.quiz_retry_threshold || 0}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-700 text-[10px] font-medium">Quizzes per Module</span>
                  <div className="text-lg font-bold text-[#3FBDFF]">{campaign?.total_number_of_quizzes_per_module || 0}</div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="bg-[#FFEEE7] p-2 rounded-xl flex items-center justify-between border border-orange-200">
                <span className="text-gray-700 font-medium text-[10px]">
                  Departments
                </span>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaign?.departments?.length || 0}
                </span>
              </div>

              <div className="bg-[#E6FFFA] p-2 rounded-xl flex items-center justify-between border border-teal-300">
                <span className="text-gray-700 font-medium text-[10px]">
                  Groups
                </span>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaign?.groups?.length || 0}
                </span>
              </div>

              <div className="bg-[#FFF4E6] p-2 rounded-xl flex items-center justify-between border border-yellow-300">
                <span className="text-gray-700 font-medium text-[10px]">
                  Invitees
                </span>
                <span className="text-gray-800 text-lg font-semibold">
                  {campaign?.invitees?.length || 0}
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
              {/* Total Modules */}
              <div className="col-span-3 bg-white rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="text-2xl font-bold text-gray-800">{campaign?.modules?.length || 0}</span>
                  <span className="ml-auto">Total Modules</span>
                </div>
              </div>

              {/* Total Targets */}
              <div className="col-span-3 bg-white rounded-xl p-3 flex flex-col justify-start">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span className="text-2xl font-bold text-gray-800">{(campaign?.departments?.length || 0) + (campaign?.groups?.length || 0) + (campaign?.invitees?.length || 0)}</span>
                  <span className="ml-auto">Total Targets</span>
                </div>
              </div>

              {/* Content Type Weights */}
              <div className="col-span-6 bg-white rounded-xl p-3">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Content Type Weights</h4>
                <div className="space-y-1.5 text-[10px]">
                  {campaign?.motion_video_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Motion Videos</span>
                      <span className="font-bold text-gray-800">{campaign.motion_video_weight}%</span>
                    </div>
                  )}
                  {campaign?.interactive_content_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Interactive Content</span>
                      <span className="font-bold text-gray-800">{campaign.interactive_content_weight}%</span>
                    </div>
                  )}
                  {campaign?.quiz_progress_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Quiz Progress</span>
                      <span className="font-bold text-gray-800">{campaign.quiz_progress_weight}%</span>
                    </div>
                  )}
                  {campaign?.document_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Documents</span>
                      <span className="font-bold text-gray-800">{campaign.document_weight}%</span>
                    </div>
                  )}
                  {campaign?.game_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Games</span>
                      <span className="font-bold text-gray-800">{campaign.game_weight}%</span>
                    </div>
                  )}
                  {campaign?.vr_game_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">VR Games</span>
                      <span className="font-bold text-gray-800">{campaign.vr_game_weight}%</span>
                    </div>
                  )}
                  {campaign?.brochure_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Brochures</span>
                      <span className="font-bold text-gray-800">{campaign.brochure_weight}%</span>
                    </div>
                  )}
                  {campaign?.poster_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Posters</span>
                      <span className="font-bold text-gray-800">{campaign.poster_weight}%</span>
                    </div>
                  )}
                  {campaign?.misc_weight > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Miscellaneous</span>
                      <span className="font-bold text-gray-800">{campaign.misc_weight}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievement Gallery - Takes up more space */}
              <div className="col-span-6 row-span-3 bg-gradient-to-br from-[#FFFEFC] to-[#FDECE0] rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-4">Achievement Gallery</h3>
                <div className="grid grid-cols-8 gap-2">
                  {/* Badge placeholders */}
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xl"
                    >
                      🏆
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Achievement Progress</div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>0 / 50 Achievements Unlocked</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>

              {/* Employee Avatar Level */}
              <div className="col-span-6 row-span-2 row-start-2 bg-white rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2">Employee Avatar Level</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    "Novice Learner",
                    "Informed Defender",
                    "Vigilant Guardian",
                    "Skilled Sentinel",
                    "Resilient Protector",
                    "Advanced Watchman",
                    "Expert Enforcer",
                  ].map((level, idx) => (
                    <div
                      key={idx}
                      className="text-center px-2 py-2 hover:bg-[#EFFAFF] rounded-lg flex flex-col items-center min-w-[80px]"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full mb-1">
                        <img src={`/images/avatars/${idx + 1}.png`} alt={level} className="w-full h-full rounded-full" />
                      </div>
                      <p className="text-[9px] leading-tight text-gray-700">{level}</p>
                    </div>
                  ))}
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

              <div className="text-center text-gray-400 text-xs py-8">
                No employee analytics data available
              </div>
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

              <div className="text-center text-gray-400 text-xs py-8">
                No employee analytics data available
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
