"use client";

import type { ReportCardModuleResult } from "@/types/reportCard";

import { useMemo } from "react";
import { Shield, Clock, TrendingUp, Download, Share2 } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyReportCard } from "@/hooks/useReportCard";
import { useAuthStore } from "@/hooks/useAuthStore";
import { DEMO_REPORT_CARD_DATA } from "@/services/reportCardDemoData";

/* ─── Print Stylesheet ─── */
const printStyles = `
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    html, body {
      background: white !important;
      width: 100% !important;
      height: 100% !important;
    }
    
    @page {
      size: A4;
      margin: 10mm;
    }
    
    #__next, main, [role="main"] {
      display: block !important;
      width: 100% !important;
      background: white !important;
    }
    
    /* Hide sidebar and non-essential UI */
    nav, header, [role="navigation"], .sidebar {
      display: none !important;
    }
    
    /* Show content */
    .flex, .grid, .relative, .absolute {
      display: var(--tw-display) !important;
    }
    
    /* Force display for flex containers */
    .flex {
      display: flex !important;
    }
    
    /* Force display for grid */
    .grid {
      display: grid !important;
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
      gap: 0.5rem !important;
    }
    
    /* Grid positioning */
    .col-span-12 { grid-column: span 12 !important; }
    .col-span-8 { grid-column: span 8 !important; }
    .col-span-4 { grid-column: span 4 !important; }
    .row-span-2 { grid-row: span 2 !important; }
    .row-span-4 { grid-row: span 4 !important; }
    .row-span-6 { grid-row: span 6 !important; }
    .row-span-9 { grid-row: span 9 !important; }
    .col-start-9 { grid-column-start: 9 !important; }
    .col-start-1 { grid-column-start: 1 !important; }
    .row-start-1 { grid-row-start: 1 !important; }
    .row-start-3 { grid-row-start: 3 !important; }
    .row-start-4 { grid-row-start: 4 !important; }
    .row-start-5 { grid-row-start: 5 !important; }
    .row-start-7 { grid-row-start: 7 !important; }
    
    /* Spacing */
    .p-3 { padding: 0.75rem !important; }
    .p-4 { padding: 1rem !important; }
    .p-5 { padding: 1.25rem !important; }
    .gap-1 { gap: 0.25rem !important; }
    .gap-2 { gap: 0.5rem !important; }
    .gap-4 { gap: 1rem !important; }
    .mt-2 { margin-top: 0.5rem !important; }
    .mt-3 { margin-top: 0.75rem !important; }
    .mb-1 { margin-bottom: 0.25rem !important; }
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mb-4 { margin-bottom: 1rem !important; }
    
    /* Background & Border */
    .bg-white { background: white !important; }
    .border { border: 1px solid #e5e7eb !important; }
    .rounded-xl { border-radius: 0.75rem !important; }
    .rounded-2xl { border-radius: 1rem !important; }
    .rounded-lg { border-radius: 0.5rem !important; }
    .rounded-full { border-radius: 9999px !important; }
    
    /* Colors - Text */
    .text-white { color: white !important; }
    .text-[11px] { font-size: 11px !important; }
    .text-xs { font-size: 12px !important; }
    .text-sm { font-size: 14px !important; }
    .text-3xl { font-size: 30px !important; }
    .text-lg { font-size: 18px !important; }
    .text-[10px] { font-size: 10px !important; }
    .text-[9px] { font-size: 9px !important; }
    
    .text-gray-900 { color: #111827 !important; }
    .text-gray-600 { color: #4b5563 !important; }
    .text-gray-500 { color: #6b7280 !important; }
    .text-gray-400 { color: #9ca3af !important; }
    .text-sky-500 { color: #0ea5e9 !important; }
    .text-sky-400 { color: #38bdf8 !important; }
    .text-blue-400 { color: #60a5fa !important; }
    .text-blue-600 { color: #2563eb !important; }
    .text-blue-700 { color: #1d4ed8 !important; }
    .text-red-400 { color: #f87171 !important; }
    .text-red-600 { color: #dc2626 !important; }
    .text-emerald-500 { color: #10b981 !important; }
    .text-emerald-600 { color: #059669 !important; }
    .text-teal-400 { color: #2dd4bf !important; }
    .text-teal-500 { color: #14b8a6 !important; }
    .text-teal-600 { color: #0d9488 !important; }
    .text-green-600 { color: #16a34a !important; }
    .text-amber-400 { color: #facc15 !important; }
    .text-orange-500 { color: #f97316 !important; }
    .text-amber-500 { color: #f59e0b !important; }
    .text-sky-600 { color: #0284c7 !important; }
    
    /* Background colors */
    .bg-sky-400 { background: #38bdf8 !important; }
    .bg-sky-100 { background: #e0f2fe !important; }
    .bg-blue-100 { background: #dbeafe !important; }
    .bg-red-100 { background: #fee2e2 !important; }
    .bg-red-600 { background: #dc2626 !important; }
    .bg-teal-100 { background: #ccfbf1 !important; }
    .bg-teal-500 { background: #14b8a6 !important; }
    .bg-green-50 { background: #f0fdf4 !important; }
    .bg-green-100 { background: #dcfce7 !important; }
    .bg-gray-100 { background: #f3f4f6 !important; }
    .bg-amber-50 { background: #fffbeb !important; }
    .bg-amber-100 { background: #fef3c7 !important; }
    .bg-[#F5F8FB] { background: #f5f8fb !important; }
    .bg-emerald-100 { background: #d1fae5 !important; }
    .bg-emerald-400 { background: #34d399 !important; }
    .bg-emerald-500 { background: #10b981 !important; }
    .bg-orange-100 { background: #ffedd5 !important; }
    .bg-orange-600 { background: #ea580c !important; }
    .bg-amber-400 { background: #facc15 !important; }
    
    /* Borders */
    .border-gray-200 { border-color: #e5e7eb !important; }
    .border-emerald-400 { border-color: #34d399 !important; }
    .border-sky-400 { border-color: #38bdf8 !important; }
    .border-gray-300 { border-color: #d1d5db !important; }
    
    /* Font weight and style */
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-bold { font-weight: 700 !important; }
    
    /* Width/Height */
    .w-full { width: 100% !important; }
    .h-full { height: 100% !important; }
    .w-3 { width: 0.75rem !important; }
    .h-3 { height: 0.75rem !important; }
    .w-4 { width: 1rem !important; }
    .h-4 { height: 1rem !important; }
    .w-5 { width: 1.25rem !important; }
    .h-5 { height: 1.25rem !important; }
    .w-8 { width: 2rem !important; }
    .h-8 { height: 2rem !important; }
    .w-10 { width: 2.5rem !important; }
    .h-10 { height: 2.5rem !important; }
    .min-h-\[120px\] { min-height: 120px !important; }
    
    /* Flex utilities */
    .flex-1 { flex: 1 1 0% !important; }
    .flex-shrink-0 { flex-shrink: 0 !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-between { justify-content: space-between !important; }
    
    /* Position utilities */
    .relative { position: relative !important; }
    .absolute { position: absolute !important; }
    .static { position: static !important; }
    
    /* Overflow */
    .overflow-hidden { overflow: hidden !important; }
    .overflow-auto { overflow: auto !important; }
    
    /* Display control for interactive elements */
    button { display: none !important; }
    .group:hover { opacity: 1 !important; visibility: visible !important; }
    
    /* SVG colors */
    svg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    svg path { stroke: inherit !important; fill: inherit !important; }
    
    /* Container */
    .overflow-auto { overflow: visible !important; }
  }
`;

/* ─── Demo Mode Flag (set to false to use real API) ─── */
const USE_DEMO_DATA = true;

/* ─── Helpers ─── */
function formatStudyTime(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRiskBadge(level: string | null): { text: string; cls: string } {
  if (!level) return { text: "Unknown", cls: "bg-gray-500 text-white" };
  const l = level.toLowerCase();
  if (l.includes("very high") || l.includes("high")) return { text: "In Risk", cls: "bg-red-600 text-white" };
  if (l.includes("medium")) return { text: "At Risk", cls: "bg-amber-500 text-white" };
  return { text: "Low Risk", cls: "bg-green-600 text-white" };
}

/* ─── SVG Area Chart ─── */
interface AreaChartProps {
  data: number[];
  labels: string[];
  color?: string;
}

function AreaChart({ data, labels, color = "#38bdf8" }: AreaChartProps) {
  const width = 300;
  const height = 130;
  const pad = { top: 16, right: 12, bottom: 32, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const yTicks = [0, 10, 20, 30, 40];
  const maxY = 40;

  const points = data.map((v, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.top + innerH - (Math.min(v, maxY) / maxY) * innerH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = [
    `M ${(points[0]?.x ?? pad.left).toFixed(2)},${(pad.top + innerH).toFixed(2)}`,
    ...points.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`),
    `L ${(points[points.length - 1]?.x ?? pad.left + innerW).toFixed(2)},${(pad.top + innerH).toFixed(2)}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="rcAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Y-axis grid lines and labels */}
      {yTicks.map((t) => {
        const cy = pad.top + innerH - (t / maxY) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} y1={cy} x2={pad.left + innerW} y2={cy} stroke="#f1f5f9" strokeWidth="1" />
            <text x={pad.left - 4} y={cy + 3} textAnchor="end" fontSize="7" fill="#94a3b8">{t}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill="url(#rcAreaGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="white" strokeWidth="1.5" />
      ))}
      {/* X-axis labels */}
      {labels.map((lbl, i) => (
        <text
          key={i}
          x={pad.left + (i / Math.max(labels.length - 1, 1)) * innerW}
          y={height - 5}
          textAnchor="middle"
          fontSize="7"
          fill="#94a3b8"
        >
          {lbl}
        </text>
      ))}
    </svg>
  );
}

/* ─── Timeline Item ─── */
interface TimelineItemProps {
  module: ReportCardModuleResult;
  isLast: boolean;
}

function TimelineItem({ module: m, isLast }: TimelineItemProps) {
  const hasAchievement = m.achievements_unlocked_in_module > 0;
  const title = hasAchievement ? "Achievement Unlocked!" : "Achievement";
  const badge =
    m.quiz_percentage !== undefined && m.quiz_percentage >= 90 ? "Perfect Score"
    : m.quiz_percentage !== undefined && m.quiz_percentage >= 70 ? "Good Score"
    : null;
  const rarity =
    m.achievements_unlocked_in_module >= 3 ? "Rare"
    : m.achievements_unlocked_in_module >= 1 ? "Common"
    : null;
  const durationMin = m.duration_minutes;
  const desc =
    m.quiz_percentage !== undefined
      ? `Scored ${m.quiz_percentage.toFixed(0)}% on the module quiz assessment`
      : "Completed and achieved full module progress";

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <span className="absolute left-[-19px] top-6 h-full w-[1.5px] bg-emerald-400" />
      )}
      {/* Dot */}
      <span className="absolute left-[-28px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-emerald-500 text-white font-bold">
        ✓
      </span>
      {/* Card */}
      <div className="border border-gray-200 rounded-xl p-3 mb-4">
        {/* Top row: title + rarity badge | date */}
        <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-medium text-xs">{title}</h3>
            {rarity && (
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full ${
                  rarity === "Rare" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"
                }`}
              >
                {rarity}
              </span>
            )}
          </div>
          {m.module_completion_date && (
            <span className="text-[10px] text-gray-400">📅 {m.module_completion_date}</span>
          )}
        </div>

        {/* Badge pill (green border) */}
        {badge && (
          <span className="inline-block mb-1.5 px-2.5 py-0.5 text-[10px] rounded-full border border-emerald-400 text-emerald-500">
            {badge}
          </span>
        )}

        {/* Meta stats row */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1 flex-wrap">
          <span className="text-orange-500">⭐ +{m.achieved_xp_tokens} XP</span>
          {m.quiz_percentage !== undefined && (
            <span>📘 {m.quiz_percentage.toFixed(0)}% Quiz Score</span>
          )}
          {durationMin && <span>⏱ {durationMin} minutes</span>}
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-500">{desc}</p>

        {/* Completed badge */}
        <div className="mt-1.5">
          <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-600">
            Completed
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="p-3 overflow-auto animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-8 row-span-2">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="bg-white rounded-2xl p-5 h-24" />)}
          </div>
        </div>
        <div className="col-span-4 row-span-4 col-start-9 row-start-1 bg-white rounded-xl h-64" />
        <div className="col-span-8 col-start-1 row-start-3 bg-white rounded-xl h-16" />
        <div className="col-span-8 row-span-9 row-start-4 bg-white rounded-2xl h-96" />
        <div className="col-span-4 row-span-2 col-start-9 row-start-5 bg-white rounded-2xl h-40" />
        <div className="col-span-4 row-span-4 col-start-9 row-start-7 bg-white rounded-xl h-48" />
      </div>
    </div>
  );
}

/* ─── Empty timeline placeholder ─── */
function NoCompletedModules() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <p className="text-sm font-medium text-gray-700">No completed modules yet</p>
      <p className="text-[11px] text-gray-400 text-center max-w-xs leading-relaxed">
        Complete a module in one of your campaigns to see your journey here.
      </p>
    </div>
  );
}

/* ─── Seven-segment Security Posture Bar colors ─── */
const SEG_COLORS = ["#9EC232", "#C1C625", "#EACB16", "#FFCD0F", "#EBA75C", "#E4590F", "#D1132A"] as const;

/* ─── Main Page ─── */
export function ReportCardPage() {
  useTranslations("dashboard");
  useI18n();
  const { user } = useAuthStore();
  const { data: response, isLoading, isError } = useMyReportCard();

  /* Data source: demo or live API */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = USE_DEMO_DATA
    ? DEMO_REPORT_CARD_DATA
    : response?.success
      ? response.data
      : undefined;

  const meta = result?.meta_statistics as Record<string, unknown> | undefined;
  const campaigns = (result?.campaigns as Array<{ campaign_name: string; completed_modules: ReportCardModuleResult[] }>) ?? [];

  /* Flatten all completed modules */
  const allModules = useMemo(() => {
    const arr: Array<{ module: ReportCardModuleResult; campaign: string }> = [];
    campaigns.forEach((c) => c.completed_modules.forEach((m) => arr.push({ module: m, campaign: c.campaign_name })));
    return arr;
  }, [campaigns]);

  /* Stat card values */
  const totalSurveySent = useMemo(
    () => allModules.reduce((sum, { module: m }) => sum + m.total_attempted_quizzes, 0),
    [allModules]
  );
  const surveysCompleted = (meta?.total_modules_completed as number | undefined) ?? allModules.length;
  const quizAccuracy   = (meta?.quizzes_accuracy_percent as number | undefined) ?? 0;
  const xpLevel        = (meta?.user_avatar_level as number | undefined) ?? 0;
  const xpTokens       = (meta?.xp_total_tokens as number | undefined) ?? 0;
  const studyTime      = (meta?.total_study_time as number | undefined) ?? 0;
  const riskLevel      = (meta?.user_risk_level as string | null | undefined) ?? null;
  const riskBadge      = getRiskBadge(riskLevel);

  /* Chart: XP per module, date labels */
  const chartData = allModules.slice(-6).map(({ module: m }) => m.achieved_xp_tokens);
  const chartLabels = allModules.slice(-6).map(({ module: m }) => {
    if (!m.module_completion_date) return "—";
    const parts = m.module_completion_date.split("-");
    if (parts.length >= 2) {
      const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${parts[0]} ${months[parseInt(parts[1], 10)] ?? parts[1]}`;
    }
    return m.module_completion_date.substring(0, 6);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyUser = user as any;
  const userName: string = anyUser?.name ?? anyUser?.username ?? user?.email ?? "User";

  /* Loading / error states (only when not using demo) */
  if (!USE_DEMO_DATA && isLoading) {
    return <ProtectedRoute><DashboardLayout><LoadingSkeleton /></DashboardLayout></ProtectedRoute>;
  }
  if (!USE_DEMO_DATA && isError) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-3 flex items-center justify-center h-64">
            <p className="text-sm text-gray-600">Failed to load report card. Please try again.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {/* Inject print styles */}
      <style>{printStyles}</style>
      
      <DashboardLayout>

        {/* ── Page Title ── */}
        <div className="flex flex-col p-3 pb-0 gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Report Card</h3>
          </div>
        </div>

        <div className="p-3 overflow-auto">
          <div className="grid grid-cols-12 gap-2">

            {/* ══ Stat Cards  col-span-8, row-span-2 ══ */}
            <div className="col-span-12 md:col-span-8 md:row-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

                {/* Total Survey Sent */}
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">Total Survey Sent</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{totalSurveySent}</h3>
                    <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Surveys Completed */}
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">Surveys Completed</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{surveysCompleted}</h3>
                    <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                </div>

                {/* Response Rate */}
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">Response Rate</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{quizAccuracy.toFixed(0)}%</h3>
                    <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
                      {/* Graduation cap SVG matching HTML */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ══ Report Summary Card  col-span-4, row-span-4, col-start-9, row-start-1 ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-4 md:col-start-9 md:row-start-1">
              <div className="bg-white rounded-xl p-3 h-full flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-start gap-2.5">
                    {/* Sky-blue shield circle */}
                    <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                        Security Awareness Report
                      </h2>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {userName}&apos;s comprehensive progress report
                      </p>
                      {/* Generated on date */}
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Generated on: {formatToday()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Level badge */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-5 h-5 rounded-md bg-teal-500 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-900">
                      Level <span className="font-semibold">{xpLevel}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-50 transition w-full text-[11px] border border-gray-200"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "Security Awareness Report", text: "Check out my security awareness progress report!" });
                      } else {
                        alert("Share feature not available on this device.");
                      }
                    }}
                  >
                    <span className="font-semibold">0</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-400 text-white font-medium hover:bg-sky-500 transition w-full text-[11px]"
                    onClick={() => window.print()}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* ══ Security Posture Bar  col-span-8, col-start-1, row-start-3 ══ */}
            <div className="col-span-12 md:col-span-8 md:col-start-1 md:row-start-3">
              <div className="bg-white rounded-xl p-3 flex items-center gap-4 w-full">
                {/* Label + Info Icon */}
                <div className="relative flex gap-2 items-center flex-shrink-0">
                  <Shield className="w-3 h-3 text-gray-500" />
                  <h3 className="text-xs whitespace-nowrap">Security Posture</h3>
                  {/* Info icon with tooltip */}
                  <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {/* Hidden tooltip - shown on hover */}
                    <div className="absolute left-1/2 top-6 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 pointer-events-none group-hover:pointer-events-auto">
                      <div className="p-4 text-xs text-gray-900 rounded-xl bg-white border border-gray-300 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="font-medium">Security Posture Info</h3>
                        </div>
                        <p className="leading-relaxed text-gray-600">
                          The 7-segment bar represents your organization&apos;s overall security posture. Green indicates low risk, transitioning through yellow to red for higher risk levels.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 7-segment rainbow bar */}
                <div className="flex-1">
                  <div className="flex overflow-hidden rounded-lg w-full">
                    {SEG_COLORS.map((c) => (
                      <div key={c} className="h-3 w-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                {/* Risk badge */}
                <p className={`${riskBadge.cls} px-2 py-0.5 rounded-full text-xs whitespace-nowrap`}>
                  {riskBadge.text}
                </p>
              </div>
            </div>

            {/* ══ Learning Journey Timeline  col-span-8, row-span-9, row-start-4 ══ */}
            <div className="col-span-12 md:col-span-8 md:row-span-9 md:row-start-4">
              <div className="bg-white rounded-2xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">Learning Journey Timeline</h2>
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600">
                      {allModules.length} Task
                    </span>
                  </div>
                  <button className="text-xs text-sky-500 hover:underline">View All</button>
                </div>

                {/* Timeline list */}
                {allModules.length === 0 ? (
                  <NoCompletedModules />
                ) : (
                  <div className="relative pl-8">
                    {allModules.map(({ module }, i) => (
                      <TimelineItem
                        key={`${module.module_id}-${i}`}
                        module={module}
                        isLast={i === allModules.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ══ Stats Panel  col-span-4, row-span-2, col-start-9, row-start-5 ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-2 md:col-start-9 md:row-start-5">
              <div className="bg-white rounded-2xl p-3 h-full flex flex-col justify-center">
                <div className="space-y-2.5">

                  {/* XP Level */}
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">XP Level</p>
                        <p className="text-[11px] text-gray-500">{xpTokens} total XP learned</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-red-400">{xpLevel}</span>
                  </div>

                  {/* Avg Quiz Score */}
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Avg Quiz Score</p>
                        <p className="text-[11px] text-gray-500">Performance across all quizzes</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-teal-400">{quizAccuracy.toFixed(0)}%</span>
                  </div>

                  {/* Total Learning Time */}
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Total Learning Time</p>
                        <p className="text-[11px] text-gray-500">{xpTokens} total XP learned</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-blue-400">{formatStudyTime(studyTime)}</span>
                  </div>

                </div>
              </div>
            </div>

            {/* ══ Module Chart  col-span-4, row-span-4, col-start-9, row-start-7 ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-4 md:col-start-9 md:row-start-7">
              <div className="bg-white rounded-xl p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-800">Module Chart</h3>
                  <button className="text-blue-600 text-xs font-medium hover:underline">View All</button>
                </div>
                {chartData.length > 0 ? (
                  <div className="flex-1 min-h-[120px]">
                    <AreaChart data={chartData} labels={chartLabels} color="#38bdf8" />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-[10px] text-gray-400 text-center">
                      XP chart will appear after completing your first module
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
