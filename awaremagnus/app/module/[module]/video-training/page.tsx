"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useModules } from "@/hooks/useQuiz";
import { quizService } from "@/services/quizService";
import { isOrgUser } from "@/utils/roles";

const SERVICE_AWM_URL = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

export default function VideoTrainingPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const moduleName = module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Convert slug to title
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Video tracking state
  const [videoProgress, setVideoProgress] = useState<{ [key: number]: { currentTime: number; duration: number; watchedPercentage: number } }>({});
  const [sentProgressMilestones, setSentProgressMilestones] = useState<{ [key: number]: { lastReported: number } }>({});
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  // Get module ID from slug
  const { data: modulesRes } = useModules({ filter: module });
  const moduleId = useMemo(() => {
    if (modulesRes?.success && modulesRes.data) {
      const found = modulesRes.data.find(m => {
        const codeMatch = m.code?.toLowerCase() === module.toLowerCase();
        const titleMatch = m.title?.toLowerCase() === moduleName.toLowerCase();
        const translationMatch = m.translations?.some(t => t.name.toLowerCase() === moduleName.toLowerCase());
        return codeMatch || titleMatch || translationMatch;
      });
      return found?.id || 1;
    }
    return 1;
  }, [modulesRes, module, moduleName]);

  const roleId = user?.role_id;
  const isOrgUserView = isOrgUser(roleId);

  // Video tracking functions
  const handleVideoLoadedMetadata = (contentId: number, video: HTMLVideoElement) => {
    const duration = video.duration;
    setVideoProgress(prev => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        duration,
        currentTime: prev[contentId]?.currentTime || 0,
        watchedPercentage: prev[contentId]?.watchedPercentage || 0
      }
    }));
  };

  const handleVideoTimeUpdate = (contentId: number, video: HTMLVideoElement) => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    const watchedPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    setVideoProgress(prev => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        currentTime,
        duration,
        watchedPercentage
      }
    }));

    // Send progress update every 25%
    const currentProgress = Math.floor(watchedPercentage / 25) * 25;
    const lastReported = sentProgressMilestones[contentId]?.lastReported || 0;

    if (currentProgress > lastReported && currentProgress <= 100 && currentProgress > 0) {
      updateVideoProgress(contentId, currentProgress);
      setSentProgressMilestones(prev => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          lastReported: currentProgress
        }
      }));
    }
  };

  const handleVideoEnded = (contentId: number) => {
    // Mark as completed when video ends
    setVideoProgress(prev => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        watchedPercentage: 100
      }
    }));

    // Send 100% completion
    if ((sentProgressMilestones[contentId]?.lastReported || 0) < 100) {
      updateVideoProgress(contentId, 100);
      setSentProgressMilestones(prev => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          lastReported: 100
        }
      }));
    }
  };

  // Update video progress to backend
  const updateVideoProgress = async (contentId: number, progressPercentage: number) => {
    try {
      const payload = {
        campaign_id: campaignId,
        module_id: moduleId,
        content_id: contentId,
        progress_percentage: progressPercentage
      };

      await quizService.updateContentProgress(payload);
      console.log(`Progress updated: ${progressPercentage}% for content ${contentId}`);
    } catch (error) {
      console.error('Failed to update video progress:', error);
    }
  };

  // Get campaign ID from URL
  const campaignId = useMemo(() => {
    const campaignIdFromUrl = searchParams?.get('campaign_id');
    if (campaignIdFromUrl) {
      return parseInt(campaignIdFromUrl, 10);
    }
    return 1; // Default campaign ID
  }, [searchParams]);

  // Fetch video training contents (content_type_id = 1)
  useEffect(() => {
    if (moduleId) {
      setLoading(true);
      quizService
        .getContents({ mod_id: moduleId, contype_id: 2 }) // 2 = Motion Videos
        .then((res) => {
          if (res.success && res.data) {
            setContents(res.data);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching video training contents:', err);
          setLoading(false);
        });
    }
  }, [moduleId]);

  useEffect(() => {
    // Load header if needed, but since we're in DashboardLayout, it might already be there
    // Assuming DashboardLayout handles the header
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@6.7.0/css/flag-icons.min.css" />
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">

          <main className="flex-1 overflow-y-auto">
            <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0">
              <a href="#" className="hover:text-gray-700 transition">Awareness Library</a>
              <span className="text-gray-400">›</span>
              <a href="#" className="hover:text-gray-700 transition">System Library</a>
              <span className="text-gray-400">›</span>
              <a href="#" className="hover:text-gray-700 transition">{moduleName}</a>
              <span className="text-gray-400">›</span>
              <span className="font-semibold text-gray-900">Motion Videos</span>
            </nav>

            <div className="flex flex-col px-3 gap-2">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : contents.length > 0 ? (
                contents.map((content, index) => (
                  <div key={content.id || index} className="bg-white rounded-xl overflow-hidden mb-4">
                    <div className="relative bg-black" style={{ height: '60vh' }}>
                      <video
                        ref={(el) => { videoRefs.current[content.id] = el; }}
                        controls
                        className="w-full h-full object-contain"
                        src={`${SERVICE_AWM_URL}${content.source_url}`}
                        poster={content.logo_url}
                        onLoadedMetadata={(e) => handleVideoLoadedMetadata(content.id, e.target as HTMLVideoElement)}
                        onTimeUpdate={(e) => handleVideoTimeUpdate(content.id, e.target as HTMLVideoElement)}
                        onEnded={() => handleVideoEnded(content.id)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-base font-semibold mb-1">{content.name || `${moduleName} Motion Video ${index + 1}`}</h4>
                      <p className="text-xs text-gray-500">{content.description || `Learn about ${moduleName.toLowerCase()} best practices and protocols`}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                          </svg>
                          <span>Duration: {content.duration || '20 to 60 minutes'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>{content.views || '1,234'} views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>{content.created_date ? new Date(content.created_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : 'Jan 15, 2026'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21 5,3"></polygon>
                          </svg>
                          Begin Training
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Next
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <path d="M8.59 13.51l6.83 3.98"></path>
                            <path d="M15.41 6.51l-6.82 3.98"></path>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No motion video content found for this module.</p>
                </div>
              )}
            </div>
          </main>
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (window.lucide) {
              lucide.createIcons();
            }
          `
        }} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}