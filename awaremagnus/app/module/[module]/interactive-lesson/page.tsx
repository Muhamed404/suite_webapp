"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isOrgUser } from "@/utils/roles";

export default function InteractiveLessonPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const moduleName = module.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); // Convert slug to title
  const t = useTranslations("module");
  const { dir } = useI18n();
  const isRtl = dir === "rtl";
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Load header if needed, but since we're in DashboardLayout, it might already be there
    // Assuming DashboardLayout handles the header
  }, []);

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
                  <span>{moduleName}</span>
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">Interactive Training</span>
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
                    {moduleName}
                  </a>
                  <span className="text-gray-400">›</span>
                  <span className="font-semibold text-gray-900">Interactive Training</span>
                </>
              )}
            </nav>

            <div className="flex flex-col px-3 gap-2">
              <div className="">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {moduleName} : Interactive Training{" "}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        This is an interactive training module that covers the basics of{" "}
                        {moduleName.toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="relative bg-black" style={{ height: "60vh" }}>
                      <embed height="100%" src="/interactive.html" type="text/html" width="100%" />
                    </div>

                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-base font-semibold mb-1">{moduleName} Training</h4>
                      <p className="text-xs text-gray-500">
                        Learn about {moduleName.toLowerCase()} best practices and protocols
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                          <span>Duration: 20 to 60 minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>1,234 views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                          <span>Jan 15, 2026</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <polygon points="5,3 19,12 5,21 5,3" />
                          </svg>
                          Begin Training
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-medium transition">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          Next
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <path d="M8.59 13.51l6.83 3.98" />
                            <path d="M15.41 6.51l-6.82 3.98" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <br />
                </div>
              </div>
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
