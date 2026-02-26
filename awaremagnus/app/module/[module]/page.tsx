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
import { useContentsWithProgress, useModule, useModules, useModuleReport, useContentsReport } from "@/hooks/useQuiz";
import { campaignService } from "@/services/campaignService";
import { awmClient, API_BASE } from "@/services/httpClient";
import { isOrgUser } from "@/utils/roles";
import { quizService } from "@/services/quizService";

export default function PhysicalSecurityPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const moduleName = module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Convert slug to title
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [language, setLanguage] = useState("en");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Get campaign ID from URL or assigned modules
  const { data: assignedModulesRes } = useModules({
    assigned_only: true,
  });

  const campaignId = useMemo(() => {
    // searchParams may be null in some Next.js modes (e.g. during server rendering)
    const campaignIdFromUrl = searchParams?.get('campaign_id');
    if (campaignIdFromUrl) {
      return parseInt(campaignIdFromUrl, 10);
    }

    if (!isOrgUserView || !assignedModulesRes?.success) return 1; // Default to 1
    const modules = assignedModulesRes.data ?? [];
    const currentModule = modules.find((m) => m.id === Number(moduleId));
    if (currentModule && currentModule.assignments && currentModule.assignments.length > 0) {
      return currentModule.assignments[0].campaign_id;
    }
    return 1; // Default campaign ID
  }, [searchParams, isOrgUserView, assignedModulesRes, moduleId]);

  // Fetch content with progress data
  const { data: contentsWithProgressRes, isLoading } = useContentsWithProgress(
    moduleId,
    campaignId,
    {
      enabled: !!campaignId
    }
  );

  // Get module basic info
  const { data: moduleRes } = useModule(moduleId, true);

  // Get module report with progress_percentage
  const { data: moduleReportRes } = useModuleReport(moduleId, !!moduleId);

  // If we have a report ID, fetch individual content statuses
  const reportModuleId = moduleReportRes?.data?.id;
  const { data: contentsReportRes } = useContentsReport(reportModuleId, !!reportModuleId);

  // Transform API data to items format, merging report content statuses if available
  const items = useMemo(() => {
    if (!contentsWithProgressRes?.success) return [];
    
    const data = contentsWithProgressRes.data;
    const transformedItems: any[] = [];

    // build a map of content_id -> report status name (lowercase)
    // map content_id -> { statusName, contypeId }
    const statusMap = new Map<number, { statusName: string; contypeId?: number }>();
    if (contentsReportRes?.success && contentsReportRes.data?.reportContents) {
      contentsReportRes.data.reportContents.forEach((rc: any) => {
        if (rc.content_id != null && rc.status?.name) {
          statusMap.set(rc.content_id, {
            statusName: rc.status.name.toLowerCase(),
            contypeId: rc.content?.contype_id,
          });
        }
      });
    }

    // Add non-aggregated contents (Interactive content, Videos, Documents, etc.)
    if (data.non_aggregated_contents) {
      data.non_aggregated_contents.forEach((content: any) => {
        // prefer status from report if available
        const reported = statusMap.get(content.id);
        let statusValue: string;
        if (reported) {
          // use the raw status string from report (lowercased)
          statusValue = reported.statusName;
        } else if (content.user_completion_status) {
          // use user_completion_status if available
          statusValue = content.user_completion_status.toLowerCase();
        } else if (content.status && typeof content.status === 'string') {
          // status may occasionally be non-string (e.g. numeric codes) so guard before calling toLowerCase
          statusValue = content.status.toLowerCase();
        } else if (content.status != null) {
          // convert anything else gracefully
          statusValue = String(content.status).toLowerCase();
        } else {
          statusValue = 'pending';
        }
        // format label for display (capitalize words, replace underscores)
        const statusLabel = statusValue.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        transformedItems.push({
          id: content.content_id,
          title: content.content_type,
          status: statusValue,
          statusLabel,
          date: content.created_date ? new Date(content.created_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short", 
            year: "numeric"
          }) : "—",
          chapters: `${content.content_type}`,
          lessons: content.description || `1 ${content.content_type?.toLowerCase()}`,
          languages: content.language_name ? [content.language_name.toLowerCase() === 'arabic' ? 'ar' : 'en'] : ["en"],
          type: content.content_type,
          content_type_id: content.content_type_id
        });
      });
    }

    // Add aggregated contents (Posters, Brochures, etc.)
    if (data.aggregated_contents) {
      Object.values(data.aggregated_contents).forEach((agg: any) => {
        if (agg.total_count > 0) {
          // determine status based on report entries matching this content type
          let aggStatus: string | undefined;
          // iterate using forEach to avoid downlevelIteration issues
          statusMap.forEach((rc) => {
            if (aggStatus == null && rc.contypeId === agg.content_type_id) {
              aggStatus = rc.statusName;
            }
          });
          if (!aggStatus) {
            aggStatus = agg.statuses?.some((s: any) => s.status === 2) ? 'completed' : 'pending';
          }
          const aggLabel = aggStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          transformedItems.push({
            id: `agg_${agg.content_type_id}`,
            title: agg.content_type,
            status: aggStatus,
            statusLabel: aggLabel,
            date: agg.date_range?.latest_created ? new Date(agg.date_range.latest_created).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }) : moduleRes?.data?.created_at ? new Date(moduleRes.data.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }) : "—",
            chapters: `${agg.total_count} ${agg.content_type}`,
            lessons: `${agg.total_count} items`,
            languages: agg.languages_supported?.map((lang: string) => 
              lang.toLowerCase() === 'arabic' ? 'ar' : 'en'
            ) || ["en"],
            type: agg.content_type,
            content_type_id: agg.content_type_id,
            isAggregated: true,
            aggregatedData: agg
          });
        }
      });
    }

    // Add user progress summary if available for quizzes
    if (data.user_progress_summary?.quizzes?.total > 0) {
      // Collect content_ids from non_aggregated_contents that have quizzes
      const quizContents = (data.non_aggregated_contents ?? [])
        .filter((c: any) => (c.quizzes?.total_count ?? 0) > 0);

      const quizContentIds = quizContents
        .map((c: any) => c.content_id ?? c.id)
        .filter(Boolean);

      // Find the latest created_date from quiz contents
      const latestQuizDate = quizContents
        .map((c: any) => c.created_date)
        .filter(Boolean)
        .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0];

      transformedItems.push({
        id: 'quizzes',
        title: 'Quizzes',
        status: data.user_progress_summary.quizzes.status === 'completed' ? 'completed' : 'pending',
        date: latestQuizDate ? new Date(latestQuizDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }) : "—",
        chapters: `${data.user_progress_summary.quizzes.total} Quizzes`,
        lessons: `${data.user_progress_summary.quizzes.total} questions`,
        languages: ["en", "ar"],
        type: 'Quiz',
        isQuizSummary: true,
        contentIds: quizContentIds,
      });
    }

    return transformedItems;
  }, [contentsWithProgressRes, contentsReportRes, moduleRes]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(item => item.status !== "completed");
      } else {
        filtered = filtered.filter(item => item.status === statusFilter);
      }
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.title.toLowerCase().includes(term));
    }

    return filtered;
  }, [items, statusFilter, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter(item => item.status !== "completed").length,
      completed: items.filter(item => item.status === "completed").length
    };
  }, [items]);

  // Calculate overall progress from API data
  const overallProgress = useMemo(() => {
    if (moduleReportRes?.success && moduleReportRes.data?.progress_percentage) {
      return parseFloat(moduleReportRes.data.progress_percentage);
    }
    if (!contentsWithProgressRes?.success) return 0;
    return contentsWithProgressRes.data?.user_progress_summary?.overall_progress_percent || 0;
  }, [moduleReportRes, contentsWithProgressRes]);

  // Get module info from API
  const moduleInfo = useMemo(() => {
    if (!contentsWithProgressRes?.success) {
      return {
        name: moduleName,
        description: "Physical security involves protecting personnel, hardware, software, networks, and data from physical actions and events such as theft, vandalism, terrorism, and natural disasters—that could cause loss or damage to an enterprise."
      };
    }
    
    const data = contentsWithProgressRes.data;
    return {
      name: data.module_name || moduleName,
      description: data.module_description || "Physical security involves protecting personnel, hardware, software, networks, and data from physical actions and events such as theft, vandalism, terrorism, and natural disasters—that could cause loss or damage to an enterprise."
    };
  }, [contentsWithProgressRes, moduleName]);

  useEffect(() => {
    // Animate progress bar with real data
    const progressBar = document.querySelector('.progress-bar') as HTMLElement;
    if (progressBar) {
      setTimeout(() => {
        const targetWidth = overallProgress; // Use real progress from API
        const duration = 2500; // 2.5 seconds
        const startTime = Date.now();

        function easeOutCubic(t: number) {
          return 1 - Math.pow(1 - t, 3);
        }

        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          const currentWidth = eased * targetWidth;

          progressBar.style.width = currentWidth + '%';

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        }

        animate();
      }, 100);
    }
  }, [overallProgress]);

  const updateTabIndicator = () => {
    if (!tabIndicatorRef.current || !tabsContainerRef.current) return;
    const tabs = tabsContainerRef.current.querySelectorAll('.tab-btn');
    const activeTab = statusFilter;
    const activeIndex = Array.from(tabs).findIndex(tab => tab.getAttribute('data-status') === activeTab);
    if (activeIndex === -1) return;
    const activeTabEl = tabs[activeIndex] as HTMLElement;
    const left = activeTabEl.offsetLeft + 4;
    const width = activeTabEl.offsetWidth - 8;
    tabIndicatorRef.current.style.left = `${left}px`;
    tabIndicatorRef.current.style.width = `${width}px`;
  };

  useEffect(() => {
    updateTabIndicator();
  }, [statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown && !(event.target as Element).closest('.language-dropdown-container')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageDropdown]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@6.14.0/css/flag-icons.min.css" />
        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes progressFill {
            from {
              width: 0%;
            }
            to {
              width: var(--progress-width, 50%);
            }
          }

          .item {
            animation: slideIn 0.3s ease-out;
          }

          .progress-bar {
            width: 0%;
            will-change: width;
          }

          /* Modern Dropdown Styles */
          .modern-dropdown-button {
            width: 100%;
            height: 47px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 0 2.5rem 0 0.75rem;
            font-size: 0.75rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
            outline: none;
            line-height: 1.5;
          }

          .modern-dropdown-wrapper.small .modern-dropdown-button {
            height: 39px;
            padding: 0 2rem 0 0.625rem;
            font-size: 0.75rem;
          }

          .modern-dropdown-wrapper.rounded-full .modern-dropdown-button {
            border-radius: 9999px;
            padding: 0 2rem 0 0.875rem;
          }

          .modern-dropdown-button:hover {
            border-color: #d1d5db;
          }

          .modern-dropdown-button.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .modern-dropdown-arrow {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            transition: transform 0.2s ease;
          }

          .modern-dropdown-arrow svg {
            width: 1rem;
            height: 1rem;
            color: #6b7280;
            transition: color 0.2s;
          }

          .modern-dropdown-menu {
            position: absolute;
            top: calc(100% + 0.25rem);
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            max-height: 240px;
            overflow-y: auto;
            z-index: 50;
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
            transition: all 0.2s ease;
          }

          .modern-dropdown-menu.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
          }

          /* Base table action button */
          .table-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.375rem;              /* gap-1.5 */
            min-width: 120px;
            padding: 0.375rem 0.5rem;   /* px-2 py-1.5 */
            border-radius: 9999px;      /* rounded-full */
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
          }

          /* Primary variant (blue background) */
          .table-btn--primary {
            background-color: var(--blue);
          }

          .table-btn--primary:hover {
            opacity: 0.9;
          }
        `}</style>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading module content...</p>
            </div>
          </div>
        ) : (
        <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">

          <main className="flex-1 overflow-y-auto">
            <div className="flex gap-4 p-3 min-h-screen">
              {/* Main Content */}
              <div className="flex-1">
                {/* Breadcrumb */}
                <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5">
                  <Link href="#" className="hover:text-gray-700 transition">Awareness Campaign</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link href="#" className="hover:text-gray-700 transition">Campaign 123</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="font-semibold text-gray-900">{moduleName}</span>
                </nav>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold text-gray-900">{moduleName}</h1>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between rounded-xl mb-4">
                  {/* Tabs */}
                  <div ref={tabsContainerRef} className="flex gap-0 bg-white p-0.5 rounded-full relative" id="tabGroup">
                    <div ref={tabIndicatorRef} className="absolute bg-[#051226] rounded-full transition-all duration-300" style={{ top: '3px', height: 'calc(100% - 6px)', width: "0px" }}></div>
                    <button
                      onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                      className={`tab-btn ${statusFilter === "all" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                      data-status="all"
                    >
                      All <span className="tab-count w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-200">{tabCounts.all}</span>
                    </button>
                    <button
                      onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
                      className={`tab-btn ${statusFilter === "pending" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                      data-status="pending"
                    >
                      Pending <span className="tab-count w-5 h-5 rounded-full bg-green-100 text-green-400 text-[10px] font-bold flex items-center justify-center transition-all duration-200">{tabCounts.pending}</span>
                    </button>
                    <button
                      onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
                      className={`tab-btn ${statusFilter === "completed" ? "active text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200 inline-flex items-center gap-2 relative z-10`}
                      data-status="completed"
                    >
                      Completed <span className="tab-count w-5 h-5 rounded-full bg-green-100 text-green-400 text-[10px] font-bold flex items-center justify-center transition-all duration-200">{tabCounts.completed}</span>
                    </button>
                  </div>

                  {/* Search + Language */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute text-gray-600 pointer-events-none z-10 w-4 h-4" style={{ left: '16px', top: '45%', transform: 'translateY(-50%)' }} />
                      <input
                        id="searchInput"
                        type="text"
                        placeholder="Search Campaign..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="datatable-input w-full pr-4 py-2 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-9 placeholder-gray-400"
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>

                    <div className="relative w-40 modern-dropdown-wrapper small rounded-full language-dropdown-container">
                      <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="modern-dropdown-button"
                      >
                        <span>{language === 'en' ? 'English' : 'Arabic'}</span>
                        <div className="modern-dropdown-arrow">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showLanguageDropdown && (
                        <div className="modern-dropdown-menu open">
                          <button
                            onClick={() => { setLanguage('en'); setShowLanguageDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            English
                          </button>
                          <button
                            onClick={() => { setLanguage('ar'); setShowLanguageDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Arabic
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 w-full h-[80vh]">
                  {/* Left Sidebar */}
                  <div className="col-span-3 flex flex-col gap-4 justify-between bg-white rounded-2xl p-4 h-full">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 mb-3">🎉 Welcome to the</h2>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{moduleInfo.name}</h3>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="progress-bar h-full bg-green-500 rounded-full" style={{ "--progress-width": `${overallProgress}%` } as React.CSSProperties}></div>
                          </div>
                        </div>
                        <div className="flex w-full justify-between items-center">
                          <p className="text-[10px] text-gray-500">Progress</p>
                          <p className="text-[10px] text-gray-700 font-semibold">{overallProgress}%</p>
                        </div>
                      </div>

                      <div className="">
                        <p className="text-xs text-gray-600">To complete this module you need to complete interactive lesson, than quizzes to complete 100%</p>
                      </div>
                    </div>

                    <div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-6">
                        <h4 className="text-xs font-bold text-gray-900 mb-3">About The Module</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{moduleInfo.description}</p>
                      </div>

                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2">
                        <span>Next Module</span>
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-9 flex flex-col justify-between">
                    <div className="space-y-2 w-full">
                      {paginatedItems.map((item, index) => {
                        const iconMap: Record<string, string> = {
                          "Video Training": "🎥",
                          "Interactive Lesson": "📘",
                          "Quizzes": "💡",
                          "Posters": "🖼",
                          "Survey": "📊"
                        };
                        const colorMap: Record<string, string> = {
                          "Video Training": "bg-red-100 text-red-600",
                          "Interactive Lesson": "bg-cyan-100 text-cyan-600",
                          "Quizzes": "bg-blue-100 text-blue-600",
                          "Posters": "bg-orange-100 text-orange-600",
                          "Survey": "bg-purple-100 text-purple-600"
                        };
                        const langMap: Record<string, { label: string; flag: string }> = {
                          en: { label: "English", flag: "us" },
                          ar: { label: "Arabic", flag: "sa" }
                        };

                        const icon = iconMap[item.title] || "📘";
                        const color = colorMap[item.title] || "bg-cyan-100 text-cyan-600";
                        const langChips = (item.languages || []).map((code: string) => {
                          const cfg = langMap[code];
                          if (!cfg) return null;
                          return (
                            <span key={code} className="inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-1 bg-white">
                              <span className={`fi fi-${cfg.flag} rounded-full`}></span>
                              <span className="text-gray-600">{cfg.label}</span>
                            </span>
                          );
                        });

                        // format status for display (e.g. "not_started" -> "Not Started")
                        const displayStatus = item.status
                          ? item.status
                              .split('_')
                              .map((s: string) => s[0].toUpperCase() + s.slice(1))
                              .join(' ')
                          : '';

                        const statusBadge = displayStatus === "Completed"
                          ? <span className="text-[11px] text-green-600 bg-green-100 px-3 py-1 rounded-full">{displayStatus}</span>
                          : <span className="text-[11px] text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{displayStatus || 'Pending'}</span>;

                        return (
                          <div key={`${item.id}-${index}`} className="item bg-white rounded-2xl p-4 flex justify-between items-center border border-gray-100 hover:border-blue-200 transition-all hover:shadow-sm">
                            <div className="flex gap-4 flex-1">
                              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center flex-shrink-0 text-lg`}>
                                {icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 mb-3">
                                  <span>Created {item.date} &nbsp; &nbsp;·</span>
                                  {langChips}
                                </div>
                                <p className="text-xs text-gray-600">{item.chapters} · {item.lessons}</p>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-4">
                              {statusBadge}
                              <button 
                                className="table-btn--primary table-btn"
                                onClick={async () => {
                                  console.log('[module] Start clicked, moduleId:', moduleId, 'campaignId:', campaignId, 'item.id:', item.id, 'typeof item.id:', typeof item.id);

                                  // notify backend that user began this content
                                  if (
                                    campaignId != null &&
                                    moduleId != null &&
                                    typeof item.id === 'number'
                                  ) {
                                    try {
                                      await campaignService.beginContent(
                                        campaignId,
                                        moduleId,
                                        item.id
                                      );
                                      console.log('[module] beginContent success');
                                    } catch (err) {
                                      console.error('[module] beginContent error', err);
                                    }
                                  }

                                  // Call the report-actions/begin-content API
                                  if (moduleId != null) {
                                    let contentId: number | null = null;
                                    if (typeof item.id === 'number') {
                                      contentId = item.id;
                                    } else if (item.isAggregated && item.content_type_id) {
                                      contentId = item.content_type_id;
                                    }
                                    if (contentId != null && item.status !== "in_progress") {
                                      console.log('[module] Calling report-actions/begin-content with', { contentId });
                                      try {
                                      await awmClient.post(`${API_BASE}/useraction/report-actions/begin-content`, {
                                          content_id: contentId,
                                          module_id: moduleId,
                                          campaign_id: campaignId
                                        });
                                        console.log('[module] report-actions begin-content success');
                                      } catch (err) {
                                        console.error('[module] report-actions begin-content error', err);
                                      }
                                    } else {
                                      console.log('[module] Skipping report-actions call: no valid contentId or status is in_progress', item);
                                    }
                                  } else {
                                    console.log('[module] Skipping report-actions call: moduleId is', moduleId);
                                  }

                                  // Fetch module contents for this content type before navigating
                                  if (item.content_type_id != null) {
                                    quizService
                                      .getContents({ mod_id: moduleId, contype_id: item.content_type_id })
                                      .then((res) => {
                                        console.log('[module] getContents by type', res);
                                      })
                                      .catch((err) => {
                                        console.error('[module] getContents error', err);
                                      });
                                  }
                                  if (item.title === "Video Training") {
                                    router.push(`/module/${module}/video-training?campaign_id=${campaignId}`);
                                  } else if (item.title === "Interactive Lesson") {
                                    window.location.href = `http://localhost:8001/awm/module/${module}?campaign_id=${campaignId}`;
                                  } else if (item.title === "Quizzes") {
                                    const quizParams = new URLSearchParams();
                                    quizParams.set('campaign_id', String(campaignId));
                                    if (item.contentIds && item.contentIds.length > 0) {
                                      quizParams.set('content_id', String(item.contentIds[0]));
                                    }
                                    router.push(`/module/${module}/quizzes?${quizParams.toString()}`);
                                  } else if (item.title === "Motion Videos") {
                                    router.push(`/module/${module}/video-training?campaign_id=${campaignId}`);
                                  } else {
                                    const contentTypes = ['Posters', 'Brochures', 'Documents', 'Screen savers'];
                                    if (contentTypes.includes(item.title)) {
                                      router.push(`/module/${module}/content/${item.title.toLowerCase().replace(/\s+/g, '-')}`);
                                    } else {
                                      // Handle other types
                                    }
                                  }
                                }}
                              >
                                Start
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-gray-600">Showing {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, filteredItems.length)} of {filteredItems.length} Entries</p>
                      <div className="flex items-center gap-1">
                        <button 
                          className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                          onClick={() => setCurrentPage(currentPage - 1)} 
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: Math.ceil(filteredItems.length / rowsPerPage) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${
                              page === currentPage
                                ? "bg-blue-50 text-blue-600 border-blue-500 font-semibold"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button 
                          className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                          onClick={() => setCurrentPage(currentPage + 1)} 
                          disabled={currentPage === Math.ceil(filteredItems.length / rowsPerPage)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}