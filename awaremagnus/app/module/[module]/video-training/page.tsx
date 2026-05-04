"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useModules, useContentReportByContentId } from "@/hooks/useQuiz";
import { useCampaign } from "@/hooks/useCampaigns";
import { quizService } from "@/services/quizService";
import { isOrgUser } from "@/utils/roles";
import { getContentAssetUrl } from "@/services/awmStorage";

export default function VideoTrainingPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const moduleName = module.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); // Convert slug to title
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [videoProgress, setVideoProgress] = useState<{
    [key: number]: { currentTime: number; duration: number; watchedPercentage: number };
  }>({});
  const [sentProgressMilestones, setSentProgressMilestones] = useState<{
    [key: number]: { lastReported: number };
  }>({});
  const [sendingProgress, setSendingProgress] = useState<Set<number>>(new Set());
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const videoContainerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const lastSentPercentRef = useRef<{ [key: number]: number }>({});
  const videoIntervals = useRef<{ [key: number]: ReturnType<typeof setInterval> | null }>({});
  const hasSoughtRef = useRef<Set<number>>(new Set());
  const moduleIdRef = useRef<number | null>(null);
  const campaignIdRef = useRef<number>(
    (() => {
      const v = searchParams?.get("campaign_id");

      return v ? parseInt(v, 10) : 1;
    })()
  );

  const contentIdFromUrl = useMemo(() => {
    const id = searchParams?.get("content_id");

    return id ? parseInt(id, 10) : null;
  }, [searchParams]);

  const [contentDerivedModuleId, setContentDerivedModuleId] = useState<number | null>(null);

  const { data: modulesRes } = useModules({ filter: module }, !contentIdFromUrl);
  const moduleId = useMemo<number | null>(() => {
    // When navigating with content_id, prefer the mod_id extracted from the content response
    if (contentIdFromUrl && contentDerivedModuleId != null) return contentDerivedModuleId;
    // Fallback: derive from the modules list (used when no content_id is in the URL)
    if (modulesRes?.success && modulesRes.data) {
      const found = modulesRes.data.find((m) => {
        const codeMatch = m.code?.toLowerCase() === module.toLowerCase();
        const titleMatch = m.title?.toLowerCase() === moduleName.toLowerCase();
        const translationMatch = m.translations?.some(
          (t) => t.name.toLowerCase() === moduleName.toLowerCase()
        );

        return codeMatch || titleMatch || translationMatch;
      });

      return found?.id ?? null;
    }

    return null;
  }, [contentIdFromUrl, contentDerivedModuleId, modulesRes, module, moduleName]);

  const roleId = user?.role_id;
  const isOrgUserView = isOrgUser(roleId);

  useEffect(() => {
    moduleIdRef.current = moduleId;
  }, [moduleId]);

  const { data: contentReportData } = useContentReportByContentId(
    contentIdFromUrl ?? 0,
    !!contentIdFromUrl
  );

  const savedProgressMap = useMemo(() => {
    const map = new Map<number, number>();

    if (!contentReportData) return map;
    const currentCampaignId = campaignIdRef.current;
    const items: any[] =
      contentReportData?.object?.reportContents ??
      (Array.isArray(contentReportData?.object) ? contentReportData.object : []);

    items.forEach((rc: any) => {
      const itemCampaignId = rc.reportModule?.report_campaign_id;

      if (itemCampaignId != null && itemCampaignId !== currentCampaignId) return;
      const cid = rc.content_id ?? rc.id;

      if (cid != null && rc.progress_percentage != null) {
        const pct = parseFloat(rc.progress_percentage);

        if (!map.has(cid) || pct > map.get(cid)!) {
          map.set(cid, pct);
        }
      }
    });

    return map;
  }, [contentReportData]);

  useEffect(() => {
    if (savedProgressMap.size === 0) return;
    setSentProgressMilestones((prev) => {
      const next = { ...prev };

      savedProgressMap.forEach((savedPct, contentId) => {
        const currentLastReported = prev[contentId]?.lastReported ?? 0;

        if (savedPct > currentLastReported) {
          next[contentId] = { lastReported: savedPct };
        }
      });

      return next;
    });
    savedProgressMap.forEach((savedPct, contentId) => {
      const current = lastSentPercentRef.current[contentId] ?? 0;

      if (savedPct > current) {
        lastSentPercentRef.current[contentId] = savedPct;
      }
    });
  }, [savedProgressMap]);

  useEffect(() => {
    savedProgressMap.forEach((savedPct, contentId) => {
      if (savedPct <= 0 || savedPct >= 100) return;
      if (hasSoughtRef.current.has(contentId)) return;

      const video = videoRefs.current[contentId];

      if (video && video.readyState >= 1 && isFinite(video.duration)) {
        video.currentTime = (savedPct / 100) * video.duration;
        hasSoughtRef.current.add(contentId);
      }
    });
  }, [savedProgressMap]);

  const handleVideoLoadedMetadata = (contentId: number, video: HTMLVideoElement) => {
    const duration = video.duration;

    setVideoProgress((prev) => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        duration,
        currentTime: prev[contentId]?.currentTime || 0,
        watchedPercentage: prev[contentId]?.watchedPercentage || 0,
      },
    }));

    // Seek to saved position (only when partially watched, not completed)
    if (hasSoughtRef.current.has(contentId)) return;

    const savedPct = savedProgressMap.get(contentId);

    if (savedPct != null && savedPct > 0 && savedPct < 100) {
      const seekTime = (savedPct / 100) * duration;

      if (isFinite(seekTime)) {
        video.currentTime = seekTime;
        hasSoughtRef.current.add(contentId);
      }
    }
  };

  const handleVideoTimeUpdate = (contentId: number, video: HTMLVideoElement) => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    const watchedPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    setVideoProgress((prev) => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        currentTime,
        duration,
        watchedPercentage,
      },
    }));

    // Send progress update every 25%
    const currentProgress = Math.floor(watchedPercentage / 25) * 25;
    const lastReported = sentProgressMilestones[contentId]?.lastReported || 0;

    if (currentProgress > lastReported && currentProgress <= 100 && currentProgress > 0) {
      updateVideoProgress(contentId, currentProgress);
      setSentProgressMilestones((prev) => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          lastReported: currentProgress,
        },
      }));
    }
  };

  const handleVideoEnded = (contentId: number) => {
    // Mark as completed when video ends
    setVideoProgress((prev) => ({
      ...prev,
      [contentId]: {
        ...prev[contentId],
        watchedPercentage: 100,
      },
    }));

    // Send 100% completion
    if ((sentProgressMilestones[contentId]?.lastReported || 0) < 100) {
      updateVideoProgress(contentId, 100);
      setSentProgressMilestones((prev) => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          lastReported: 100,
        },
      }));
    }
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startVideoInterval = (contentId: number) => {
    if (videoIntervals.current[contentId]) return;
    videoIntervals.current[contentId] = setInterval(() => {
      const video = videoRefs.current[contentId];

      if (!video || video.paused || video.ended) return;
      const dur = video.duration;

      if (!dur || isNaN(dur) || dur <= 0) return;
      const pct = Math.round((video.currentTime / dur) * 100);
      const last = lastSentPercentRef.current[contentId] ?? 0;

      if (pct > last) {
        lastSentPercentRef.current[contentId] = pct;
        updateVideoProgress(contentId, pct);
      }
    }, 5000);
  };

  const stopVideoInterval = (contentId: number) => {
    if (videoIntervals.current[contentId]) {
      clearInterval(videoIntervals.current[contentId]!);
      videoIntervals.current[contentId] = null;
    }
  };

  const updateVideoProgress = async (contentId: number, progressPercentage: number) => {
    const mid = moduleIdRef.current;
    const cid = campaignIdRef.current;

    if (!mid || !cid) {
      console.warn(
        "[video] updateVideoProgress skipped — moduleId or campaignId not yet resolved",
        { mid, cid }
      );

      return;
    }
    try {
      const payload = {
        campaign_id: cid,
        module_id: mid,
        content_id: contentId,
        progress_percentage: progressPercentage,
      };

      await quizService.updateContentProgress(payload);
      console.log(`Progress updated: ${progressPercentage}% for content ${contentId}`);
    } catch (error) {
      console.error("Failed to update video progress:", error);
    }
  };

  const openVideoFullscreen = async (contentId: number) => {
    const container = videoContainerRefs.current[contentId];
    if (!container) return;

    const fsElement = container as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    try {
      if (fsElement.requestFullscreen) {
        await fsElement.requestFullscreen();
      } else if (fsElement.webkitRequestFullscreen) {
        fsElement.webkitRequestFullscreen();
      } else if (fsElement.msRequestFullscreen) {
        fsElement.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Failed to enter fullscreen mode:", error);
    }
  };

  const campaignId = useMemo(() => {
    const campaignIdFromUrl = searchParams?.get("campaign_id");

    if (campaignIdFromUrl) {
      return parseInt(campaignIdFromUrl, 10);
    }

    return 1; // Default campaign ID
  }, [searchParams]);

  const { data: campaignRes } = useCampaign(campaignId, !!campaignId);
  const isVideoSkippingEnabled = campaignRes?.success ? !!campaignRes.data.enable_video_skipping : false;

  useEffect(() => {
    campaignIdRef.current = campaignId;
  }, [campaignId]);

  const contentId = contentIdFromUrl;

  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    quizService
      .getContentById(contentId)
      .then((res) => {
        if (res.success && res.data) {
          setContents([res.data]);
          // Derive moduleId from the content response so we don't need /module?filter=...
          const modId = (res.data as any).mod_id as number | undefined;

          if (modId) setContentDerivedModuleId(modId);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching video content by id:", err);
        setLoading(false);
      });
  }, [contentId]);

  useEffect(() => {
    if (contentId || !moduleId) return;
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
        console.error("Error fetching video training contents:", err);
        setLoading(false);
      });
  }, [moduleId, contentId]);

  useEffect(() => {}, []);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link
          href="https://cdn.jsdelivr.net/npm/flag-icons@6.7.0/css/flag-icons.min.css"
          rel="stylesheet"
        />
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" />
        <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">
          <main className="flex-1 overflow-y-auto">
            <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0">
              {isOrgUser(user?.role_id) ? (
                <>
                  <Link
                    className="hover:text-gray-700 transition"
                    href="/dashboard/campaign-assignments"
                  >
                    {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
                  </Link>
                  <span className="text-gray-400">›</span>
                  {searchParams?.get("campaign_id") ? (
                    <Link
                      className="hover:text-gray-700 transition"
                      href={`/module/${module}?campaign_id=${searchParams.get("campaign_id")}`}
                    >
                      {moduleName}
                    </Link>
                  ) : (
                    <span>{moduleName}</span>
                  )}
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">{t("videoTraining.motionVideos")}</span>
                </>
              ) : (
                <>
                  <a className="hover:text-gray-700 transition" href="#">
                    {t("videoTraining.awarenessLibrary")}
                  </a>
                  <span className="text-gray-400">›</span>
                  <a className="hover:text-gray-700 transition" href="#">
                    {t("videoTraining.systemLibrary")}
                  </a>
                  <span className="text-gray-400">›</span>
                  <a className="hover:text-gray-700 transition" href="#">
                    {moduleName}
                  </a>
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">{t("videoTraining.motionVideos")}</span>
                </>
              )}
            </nav>

            <div className="flex flex-col px-3 gap-2">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
              ) : contents.length > 0 ? (
                contents.map((content, index) => (
                  <div
                    key={content.id || index}
                    className="bg-white rounded-xl overflow-hidden mb-4"
                  >
                    <div
                      ref={(el) => {
                        videoContainerRefs.current[content.id] = el;
                      }}
                      className="relative bg-black"
                      style={{ height: "60vh" }}
                    >
                      <video
                        ref={(el) => {
                          videoRefs.current[content.id] = el;
                        }}
                        className="w-full h-full object-contain"
                        poster={content.logo_url}
                        src={
                          !content.source_url
                            ? undefined
                            : getContentAssetUrl(content.source_url) || undefined
                        }
                        onEnded={() => handleVideoEnded(content.id)}
                        onLoadedMetadata={(e) =>
                          handleVideoLoadedMetadata(content.id, e.currentTarget)
                        }
                        onPause={() => stopVideoInterval(content.id)}
                        onPlay={() => startVideoInterval(content.id)}
                        onTimeUpdate={(e) => handleVideoTimeUpdate(content.id, e.currentTarget)}
                      >
                        {t("videoTraining.videoNotSupported")}
                      </video>
                    </div>

                    {}
                    <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => videoRefs.current[content.id]?.play()}
                        >
                          {t("videoTraining.play")}
                        </button>
                        <button
                          className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => videoRefs.current[content.id]?.pause()}
                        >
                          {t("videoTraining.pause")}
                        </button>
                        <button
                          className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => {
                            const v = videoRefs.current[content.id];

                            if (v) v.currentTime = Math.max(0, v.currentTime - 10);
                          }}
                        >
                          {t("videoTraining.back10s")}
                        </button>
                        {isVideoSkippingEnabled && (
                          <button
                            className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                            onClick={() => {
                              const v = videoRefs.current[content.id];

                              if (v && isFinite(v.duration))
                                v.currentTime = Math.min(v.duration, v.currentTime + 10);
                            }}
                          >
                            {t("videoTraining.forward10s")}
                          </button>
                        )}
                        <button
                          className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => {
                            const v = videoRefs.current[content.id];

                            if (v) {
                              v.currentTime = 0;
                              v.play();
                            }
                          }}
                        >
                          {t("videoTraining.restart")}
                        </button>
                        <button
                          className="border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition"
                          onClick={() => openVideoFullscreen(content.id)}
                        >
                          {t("videoTraining.openFullScreen")}
                        </button>
                        <span className="ml-1 text-sm text-gray-700">
                          {formatTime(videoProgress[content.id]?.currentTime ?? 0)} /{" "}
                          {formatTime(videoProgress[content.id]?.duration ?? 0)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {t("videoTraining.progress", {
                          percentage: Math.round(videoProgress[content.id]?.watchedPercentage ?? 0),
                          current: Math.floor(videoProgress[content.id]?.currentTime ?? 0),
                          total: Math.floor(videoProgress[content.id]?.duration ?? 0),
                        })}
                      </p>
                      <div className="mt-2">
                        <button
                          className={`border border-gray-400 bg-white text-gray-800 px-2.5 py-0.5 text-sm hover:bg-gray-50 transition ${
                            sendingProgress.has(content.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={sendingProgress.has(content.id)}
                          onClick={async () => {
                            const v = videoRefs.current[content.id];

                            if (!v || !v.duration || isNaN(v.duration)) return;
                            const pct = Math.round((v.currentTime / v.duration) * 100);
                            const lastReported =
                              sentProgressMilestones[content.id]?.lastReported ?? 0;

                            // Only send if current progress is strictly higher than what was already saved
                            if (pct <= lastReported) return;

                            setSendingProgress(prev => new Set(prev).add(content.id));
                            try {
                              await updateVideoProgress(content.id, pct);
                              setSentProgressMilestones((prev) => ({
                                ...prev,
                                [content.id]: { lastReported: pct },
                              }));
                              lastSentPercentRef.current[content.id] = pct;
                            } finally {
                              setSendingProgress(prev => {
                                const next = new Set(prev);
                                next.delete(content.id);
                                return next;
                              });
                            }
                          }}
                        >
                          {sendingProgress.has(content.id) ? t("videoTraining.sendingProgress") : t("videoTraining.sendProgress")}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-base font-semibold mb-1">
                        {content.name || t("videoTraining.defaultTitle", { moduleName, index: index + 1 })}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {content.description || t("videoTraining.defaultDescription", { moduleName })}
                      </p>
                    </div>

                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">{t("videoTraining.noContent")}</p>
                </div>
              )}
            </div>
          </main>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (window.lucide) {
              lucide.createIcons();
            }
          `,
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
