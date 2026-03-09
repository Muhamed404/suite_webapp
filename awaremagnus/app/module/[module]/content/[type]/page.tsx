"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  List,
  LayoutGrid,
  Eye,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  MoreVertical,
  Clock,
  Calendar,
} from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { quizService } from "@/services/quizService";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTranslations } from "@/i18n/useTranslations";
import { isOrgUser } from "@/utils/roles";

// Maps URL slug → contype_id (matches API content_type_id values)
const CONTENT_TYPE_ID: Record<string, number> = {
  brochures: 3,
  posters: 4,
  "screen-savers": 5,
  documents: 6,
};

// Maps language name → ISO code
function toLangCode(name?: string): string {
  if (!name) return "en";
  const n = name.toLowerCase();

  if (n === "arabic") return "ar";
  if (n === "french") return "fr";

  return "en";
}

export default function ContentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("module");
  const { user } = useAuthStore();

  const module = params?.module;
  const type = params?.type;
  const campaignIdFromUrl = searchParams?.get("campaign_id") ?? null;

  // determine slug (array or string) and check if we're on posters page
  const slug = Array.isArray(type) ? type[0] : (type ?? "");
  const isPostersPage = slug === "posters";
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewingItem, setViewingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiItems, setApiItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Read mod_id and contype_id directly from URL query params
  const moduleId = searchParams?.get("mod_id") ? Number(searchParams.get("mod_id")) : 1;
  const contypeIdFromUrl = searchParams?.get("contype_id")
    ? Number(searchParams.get("contype_id"))
    : null;

  useEffect(() => {
    const slug = Array.isArray(type) ? type[0] : (type ?? "");
    const contype_id = contypeIdFromUrl ?? CONTENT_TYPE_ID[slug];

    if (!contype_id || !moduleId) {
      setIsLoading(false);

      return;
    }
    setIsLoading(true);
    quizService
      .getContents({ mod_id: moduleId, contype_id })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((c: any) => ({
            id: c.id,
            title: c.title ?? c.name ?? `Content ${c.id}`,
            description: c.description ?? "",
            languageCode: toLangCode(c.language?.name),
            language: c.language?.name ?? "English",
            updated: c.createdAt ?? c.creation_date ?? c.created_at ?? "",
            thumbnail: c.logo_url ?? null,
            contentType: slug,
            source_url: c.source_url ?? null,
          }));

          setApiItems(mapped);
        } else {
          setApiItems([]);
        }
      })
      .catch((err) => {
        console.error("[content page] getContents error", err);
        setApiItems([]);
      })
      .finally(() => setIsLoading(false));
  }, [type, moduleId, contypeIdFromUrl]);

  // items are populated via API; legacy static array removed

  const libraryItems = apiItems;

  const filteredItems = useMemo(() => {
    let filtered = [...libraryItems];

    if (languageFilter !== "all") {
      filtered = filtered.filter((item) => item.languageCode === languageFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        let valA: any, valB: any;

        if (sortBy === "title") {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (sortBy === "language") {
          valA = a.language.toLowerCase();
          valB = b.language.toLowerCase();
        } else if (sortBy === "updated") {
          valA = new Date(a.updated);
          valB = new Date(b.updated);
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;

        return 0;
      });
    }

    return filtered;
  }, [libraryItems, languageFilter, searchQuery, sortBy, sortOrder]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        !(event.target as Element).closest(".language-dropdown-container")
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleView = (action: string, item: any) => {
    if (action === "view") {
      const moduleSlug = Array.isArray(module) ? module[0] : (module ?? "");
      const contype_id = contypeIdFromUrl ?? CONTENT_TYPE_ID[slug];
      const detailParams = new URLSearchParams();

      if (moduleId) detailParams.set("mod_id", String(moduleId));
      if (contype_id) detailParams.set("contype_id", String(contype_id));
      const campaignId = searchParams?.get("campaign_id");

      if (campaignId) detailParams.set("campaign_id", campaignId);
      router.push(`/module/${moduleSlug}/content/${slug}/${item.id}?${detailParams.toString()}`);
    } else if (action === "edit") {
      // editing is not supported on posters page
      if (isPostersPage) return;
      console.log("Edit", item);
    }
  };

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const flagClassMap: Record<string, string> = {
    en: "fi-us",
    ar: "fi-sa",
    fr: "fi-fr",
  };

  const getFlagClass = (languageCode: string) => {
    return flagClassMap[languageCode] || flagClassMap.en;
  };

  const resolveLogoUrl = (raw: string | null): string | null => {
    if (!raw?.trim()) return null;
    const s = raw.trim();

    if (s.startsWith("http")) return s;
    if (s.startsWith("/contents/")) return `/awm${s}`;

    return `/awm/contents/${s.startsWith("/") ? s.slice(1) : s}`;
  };

  const ItemThumbnail = ({ src }: { src: string | null }) => {
    const url = resolveLogoUrl(src);

    if (url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="w-10 h-10 rounded-lg object-cover"
          src={url}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute("style");
          }}
        />
      );
    }

    return <ThumbnailSVG />;
  };

  const ThumbnailSVG = () => (
    <svg
      className="rounded-lg"
      fill="none"
      height="40"
      viewBox="0 0 32 32"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z"
        stroke="#656972"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0002 14.6666C13.4729 14.6666 14.6668 13.4727 14.6668 12C14.6668 10.5272 13.4729 9.33331 12.0002 9.33331C10.5274 9.33331 9.3335 10.5272 9.3335 12C9.3335 13.4727 10.5274 14.6666 12.0002 14.6666Z"
        stroke="#656972"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 19.9999L23.8853 15.8853C23.3853 15.3853 22.7071 15.1045 22 15.1045C21.2929 15.1045 20.6147 15.3853 20.1147 15.8853L8 27.9999"
        stroke="#656972"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <link
          href="https://cdn.jsdelivr.net/npm/flag-icons@6.14.0/css/flag-icons.min.css"
          rel="stylesheet"
        />
        <style jsx>{`
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
            box-shadow:
              0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
        `}</style>

        <div className="flex-1 flex flex-col h-screen bg-[#F1F5F8] lg:m-2 lg:ml-0 overflow-hidden lg:rounded-r-3xl">
          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {viewingItem ? (
              <div>
                <nav className="flex items-center text-xs text-gray-500 mb-6 gap-1.5 p-3 pb-0">
                  <button
                    className="hover:text-gray-700 transition flex items-center gap-1"
                    onClick={() => setViewingItem(null)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <span className="text-gray-400">›</span>
                  {isOrgUser(user?.role_id) ? (
                    <Link
                      className="hover:text-gray-700 transition"
                      href="/dashboard/campaign-assignments"
                    >
                      {t("moduleDetails.breadcrumbMyAssignments") ?? "My Assignments"}
                    </Link>
                  ) : (
                    <>
                      <a className="hover:text-gray-700 transition" href="#">
                        Awareness Library
                      </a>
                      <span className="text-gray-400">›</span>
                      <a className="hover:text-gray-700 transition" href="#">
                        System Library
                      </a>
                    </>
                  )}
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">
                    {(viewingItem as any).contentType === "brochure"
                      ? "Interactive Training"
                      : (viewingItem as any).title}
                  </span>
                </nav>

                <div className="flex flex-col px-3 gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {(viewingItem as any).contentType === "brochure"
                            ? "Physical Security : Brochure Training"
                            : `Physical Security : ${(viewingItem as any).title}`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {(viewingItem as any).description}
                        </p>
                      </div>
                    </div>

                    {/* Image Display Container */}
                    <div className="bg-white rounded-xl overflow-hidden">
                      {(() => {
                        const rawUrl = (viewingItem as any).source_url;
                        const contentBase =
                          process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";
                        const fullUrl = rawUrl ? `${contentBase}${rawUrl}` : null;
                        const isPdf = fullUrl?.toLowerCase().endsWith(".pdf");

                        if (!fullUrl) {
                          return (
                            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                              No content available
                            </div>
                          );
                        }

                        if (isPdf) {
                          return (
                            <iframe
                              height="800px"
                              src={fullUrl}
                              style={{ border: "none" }}
                              width="100%"
                            />
                          );
                        }

                        return (
                          <img
                            alt={(viewingItem as any).title}
                            src={fullUrl}
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              display: "block",
                              margin: "auto",
                            }}
                          />
                        );
                      })()}

                      {/* Image Info */}
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-base font-semibold mb-1">
                          {(viewingItem as any).contentType === "brochure"
                            ? "Physical Security Training"
                            : (viewingItem as any).title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {(viewingItem as any).contentType === "brochure"
                            ? "Learn about physical security best practices and protocols"
                            : (viewingItem as any).description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                          {(viewingItem as any).contentType === "brochure" && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>Duration: 20 to 60 minutes</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span>1,234 views</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Language: {(viewingItem as any).language}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Jan 15, 2026</span>
                          </div>
                        </div>
                      </div>

                      {/* Image Controls */}
                      <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition">
                            <span>
                              Download{" "}
                              {(viewingItem as any).contentType === "brochure"
                                ? "Brochure"
                                : (type as string)
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </button>
                          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition">
                            <span>Next</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-full transition">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-full transition">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-full transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(viewingItem as any).contentType === "brochure" && (
                      <div className="mt-4 bg-white rounded-xl p-4">
                        <h5 className="text-sm font-semibold mb-3">Next Brochure Training</h5>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
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
                      {campaignIdFromUrl ? (
                        <Link
                          className="hover:text-gray-700 transition"
                          href={`/module/${Array.isArray(module) ? module[0] : module}?campaign_id=${campaignIdFromUrl}`}
                        >
                          {(Array.isArray(module) ? module[0] : (module ?? ""))
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Link>
                      ) : (
                        <span>
                          {(Array.isArray(module) ? module[0] : (module ?? ""))
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <a className="hover:text-gray-700 transition" href="#">
                        Awareness Library
                      </a>
                      <span className="text-gray-400">›</span>
                      <a className="hover:text-gray-700 transition" href="#">
                        System Library
                      </a>
                      <span className="text-gray-400">›</span>
                      <a className="hover:text-gray-700 transition" href="#">
                        {(Array.isArray(module) ? module[0] : (module ?? ""))
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </a>
                    </>
                  )}
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">
                    {(type as string).replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </nav>

                <div className="flex flex-col px-3 gap-2">
                  <div className="flex flex-col">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {(type as string)
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Physical security description</p>
                      </div>
                      {!isPostersPage && (
                        <a
                          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full text-xs"
                          href="add-new-module-content.html"
                        >
                          <img alt="" className="size-3" src="./images/img/add.svg" />
                          <span className="hidden md:inline">Add New</span>
                        </a>
                      )}
                    </div>

                    {/* Filters row */}
                    <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Search */}
                        <div className="relative w-64">
                          <Search
                            className="absolute text-gray-400 pointer-events-none z-10 w-4 h-4"
                            style={{
                              left: "16px",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                          <input
                            className="w-full pl-10 pr-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            id="searchInput"
                            placeholder="Search content..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Language dropdown */}
                        <div className="relative w-44 modern-dropdown-wrapper small rounded-full language-dropdown-container">
                          <button
                            className="modern-dropdown-button"
                            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                          >
                            <span>
                              {languageFilter === "all"
                                ? "All Languages"
                                : languageFilter === "en"
                                  ? "English"
                                  : languageFilter === "ar"
                                    ? "Arabic"
                                    : languageFilter === "fr"
                                      ? "French"
                                      : "All Languages"}
                            </span>
                            <div className="modern-dropdown-arrow">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M19 9l-7 7-7-7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          </button>

                          {showLanguageDropdown && (
                            <div className="modern-dropdown-menu open">
                              {[
                                { code: "all", label: "All Languages" },
                                { code: "en", label: "English" },
                                { code: "ar", label: "Arabic" },
                                { code: "fr", label: "French" },
                              ].map((opt) => (
                                <button
                                  key={opt.code}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={() => {
                                    setLanguageFilter(opt.code);
                                    setShowLanguageDropdown(false);
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View toggle */}
                      <div
                        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-1 py-1 z-40 relative"
                        id="viewToggle"
                      >
                        <div
                          className="absolute bg-[#051226] rounded-full"
                          id="viewIndicator"
                          style={{
                            top: "4px",
                            height: "calc(100% - 8px)",
                            left: viewMode === "table" ? "4px" : "calc(50% - 2px)",
                            width: "calc(50% - 4px)",
                            transition:
                              "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                        <button
                          className={`view-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition relative z-10 ${
                            viewMode === "table" ? "text-white" : "text-gray-700"
                          }`}
                          onClick={() => setViewMode("table")}
                        >
                          <List className="w-4 h-4" />
                          Table
                        </button>
                        <button
                          className={`view-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition relative z-10 ${
                            viewMode === "grid" ? "text-white" : "text-gray-700"
                          }`}
                          onClick={() => setViewMode("grid")}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          Grid
                        </button>
                      </div>
                    </div>

                    {/* Table / Grid container */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <div
                        className="overflow-x-auto overflow-y-auto relative"
                        style={{ height: "55vh", minHeight: "400px" }}
                      >
                        {viewMode === "table" ? (
                          <table
                            aria-label="Library table"
                            className="w-full text-xs"
                            id="libraryTable"
                          >
                            <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
                              <tr>
                                <th
                                  className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => handleSort("title")}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>Module</span>
                                    <span className="text-gray-400">
                                      {sortBy === "title" ? (
                                        sortOrder === "asc" ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )
                                      ) : (
                                        <ChevronsUpDown className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                  </div>
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold">Description</th>
                                <th
                                  className="px-4 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => handleSort("language")}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>Language</span>
                                    <span className="text-gray-400">
                                      {sortBy === "language" ? (
                                        sortOrder === "asc" ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )
                                      ) : (
                                        <ChevronsUpDown className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                  </div>
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold">Thumbnail</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100" id="tableBody">
                              {paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-700">
                                    {item.title}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">{item.description}</td>
                                  <td className="px-4 py-3 text-gray-700">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-gray-700 bg-white text-xs">
                                      <span className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                                        <span
                                          className={`fi rounded-full w-8 h-8 ${getFlagClass(
                                            item.languageCode
                                          )}`}
                                        />
                                      </span>
                                      <span>{item.language}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <ItemThumbnail src={item.thumbnail} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="inline-flex items-center">
                                      <button
                                        className="flex items-center gap-1 px-2 py-1 text-gray-700 text-[11px]"
                                        onClick={() => handleView("view", item)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          /* Grid view */
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4"
                            id="gridWrapper"
                          >
                            {paginatedItems.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                      <ItemThumbnail src={item.thumbnail} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {item.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Updated {formatDate(item.updated)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-gray-700 bg-white text-xs">
                                    <span className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                                      <span
                                        className={`fi rounded-full w-8 h-8 ${getFlagClass(
                                          item.languageCode
                                        )}`}
                                      />
                                    </span>
                                    <span>{item.language}</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-sky-500 text-sky-500 text-[11px] hover:bg-sky-50"
                                      onClick={() => handleView("view", item)}
                                    >
                                      <Eye className="w-4 h-4" />
                                      View
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loading state */}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <div className="text-center py-12">
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                              <p className="text-sm text-gray-500">Loading content…</p>
                            </div>
                          </div>
                        )}

                        {/* Empty state */}
                        {!isLoading && filteredItems.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <div className="text-center py-12">
                              <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                                <Search className="w-10 h-10 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Content Found
                              </h3>
                              <p className="text-sm text-gray-500">
                                Try adjusting your filters or search query
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      <div className="mt-4 flex items-center justify-between px-4 pb-4">
                        <p className="text-xs text-gray-600">
                          Showing {(currentPage - 1) * itemsPerPage + 1}–
                          {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
                          {filteredItems.length} Entries
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={currentPage === 1}
                            onClick={() => changePage(currentPage - 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all ${
                                page === currentPage
                                  ? "bg-blue-50 text-blue-600 border-blue-500 font-semibold"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                              onClick={() => changePage(page)}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            className="min-w-[32px] h-8 px-2 border rounded-full text-xs transition-all bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={currentPage === totalPages}
                            onClick={() => changePage(currentPage + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
