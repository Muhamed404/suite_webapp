"use client";

import type { ReportCardModuleResult } from "@/types/reportCard";

import { useMemo } from "react";
import { Shield, Clock, TrendingUp, Download, Share2, BadgeCheck, Medal } from "lucide-react";

import { DashboardLayout } from "@/components/modules/dashboard/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslations } from "@/i18n/useTranslations";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyReportCard, useUserReportCard } from "@/hooks/useReportCard";
import { useAuthStore } from "@/hooks/useAuthStore";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

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
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function getRiskBadge(level: string | null): { text: string; bg: string } {
  if (!level) return { text: "Unknown", bg: "#6b7280" };
  const l = level.toLowerCase();

  if (l.includes("not evaluated")) return { text: "Not Evaluated", bg: "#6b7280" };
  if (l.includes("very high")) return { text: "Very High", bg: "#b91c1c" };
  if (l.includes("high")) return { text: "High", bg: "#dc2626" };
  if (l.includes("medium")) return { text: "Medium", bg: "#f59e0b" };
  if (l.includes("very low")) return { text: "Very Low", bg: "#15803d" };
  if (l.includes("low")) return { text: "Low", bg: "#16a34a" };

  return { text: level, bg: "#6b7280" };
}

const AVATAR_IMAGE_BY_LEVEL: Record<number, string> = {
  1: "Vulnerablenewbe_Level1_Robot.png",
  2: "AlertApprentice_Level2_Robot.png",
  3: "CautiousLearner_Level3_Robot.png",
  4: "InformedDefender_Level4_Robot.png",
  5: "VigilantGuardian_Level5_Robot.png",
  6: "SkilledSentinel._Level6_Robot.png",
  7: "ResilientProtector_Level7_Robot.png",
  8: "AdvancedWatchman_Level8_Robot.png",
  9: "ExpertEnforcer_Level9_Robot.png",
  10: "MasterStrategist_Level10_Robot.png",
  11: "EliteVanguard_Level11_Robot.png",
  12: "LegendaryShieldbearer_Level12_Robot.png",
  13: "SupremeCyberKnight_Level13_Robot.png",
  14: "UltimateCyberSentinel_Level14_Robot.png",
};

/* ─── SVG Area Chart ─── */
interface AreaChartProps {
  data: number[];
  labels: string[];
  dates?: Date[];
}

function buildCountTicks(maxValue: number): number[] {
  const safeMax = Math.max(1, Math.ceil(maxValue));
  const step = safeMax <= 6 ? 1 : Math.ceil(safeMax / 6);
  const ticks: number[] = [];

  for (let t = 0; t <= safeMax; t += step) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== safeMax) {
    ticks.push(safeMax);
  }

  return ticks;
}

function parseModuleCompletionDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(trimmed);

  if (match) {
    const day = parseInt(match[1], 10);
    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const month = monthMap[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);

    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  const fallback = new Date(trimmed);

  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatChartDateLabel(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });

  return `${day} ${month}`;
}

function AreaChart({ data, labels, dates }: AreaChartProps) {
  const color = "#38bdf8";
  const W = 300,
    H = 140,
    pT = 16,
    pR = 12,
    pB = 40,
    pL = 32;
  const iW = W - pL - pR,
    iH = H - pT - pB,
    maxY = Math.max(...data, 5);
  const yTicks = buildCountTicks(maxY);

  const dateIndices = useMemo(() => {
    const indices: Record<number, number[]> = {};

    (dates || []).forEach((d, idx) => {
      const t = d.getTime();

      if (!indices[t]) indices[t] = [];
      indices[t].push(idx);
    });

    return indices;
  }, [dates]);

  const uniqueTimes = useMemo(() =>
    Array.from(new Set((dates || []).map((d) => d.getTime()))).sort((a, b) => a - b),
  [dates]);

  const getX = (i: number): number => {
    if (!dates || dates.length === 0) return pL + (i / Math.max(data.length - 1, 1)) * iW;
    const t = dates[i].getTime();
    const dateIdx = uniqueTimes.indexOf(t);
    const baseX = pL + (dateIdx / Math.max(uniqueTimes.length - 1, 1)) * iW;

    if (dateIdx === 0) return baseX;

    const currentIndices = dateIndices[t];
    const isLastForDate = i === currentIndices[currentIndices.length - 1];

    if (isLastForDate) return baseX;

    const prevT = uniqueTimes[dateIdx - 1];
    const prevIndices = dateIndices[prevT];
    const prevLastIdx = prevIndices[prevIndices.length - 1];
    const prevX = pL + ((dateIdx - 1) / Math.max(uniqueTimes.length - 1, 1)) * iW;

    const yStart = data[prevLastIdx];
    const yEnd = data[currentIndices[currentIndices.length - 1]];
    const yCurrent = data[i];

    if (yEnd === yStart) return baseX;

    const ratio = (yCurrent - yStart) / (yEnd - yStart);

    return prevX + ratio * (baseX - prevX);
  };

  const pts = data.map((v, i) => ({
    x: getX(i),
    y: pT + iH - (Math.min(v, maxY) / maxY) * iH,
  }));
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = [
    `M ${(pts[0]?.x ?? pL).toFixed(1)},${(pT + iH).toFixed(1)}`,
    ...pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L ${(pts[pts.length - 1]?.x ?? pL + iW).toFixed(1)},${(pT + iH).toFixed(1)} Z`,
  ].join(" ");

  return (
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="rcGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => {
        const cy = pT + iH - (t / maxY) * iH;

        return (
          <g key={t}>
            <line stroke="#f1f5f9" strokeWidth="1" x1={pL} x2={pL + iW} y1={cy} y2={cy} />
            <text fill="#94a3b8" fontSize="7" textAnchor="end" x={pL - 4} y={cy + 3}>
              {t}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#rcGrad)" />
      <path d={line} fill="none" stroke={color} strokeLinejoin="round" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} fill={color} r="2.5" stroke="white" strokeWidth="1.5" />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          fill="#94a3b8"
          fontSize="7"
          textAnchor="middle"
          x={getX(i)}
          y={H - 5}
        >
          {l}
        </text>
      ))}
      <text fill="#6b7280" fontSize="8" textAnchor="middle" x={pL + iW / 2} y={H + 3}>
        Module Completion Dates
      </text>
      <text
        fill="#6b7280"
        fontSize="8"
        textAnchor="middle"
        transform={`translate(8 ${pT + iH / 2}) rotate(-90)`}
      >
        Module Counts
      </text>
    </svg>
  );
}

/* ─── Timeline Item ─── */
function TimelineItem({ module: m, isLast, t }: { module: ReportCardModuleResult; isLast: boolean; t: any }) {
  const title = m.module_name || "Module";
  const badge =
    m.quiz_percentage !== undefined
      ? m.quiz_percentage >= 90
        ? null
        : m.quiz_percentage >= 70
          ? t("reportCard.goodScore")
          : null
      : null;
  const rarity =
    m.achievements_unlocked_in_module >= 3
      ? "Rare"
      : m.achievements_unlocked_in_module >= 1
        ? "Common"
        : null;
  const rarityText = rarity ? t(rarity === "Rare" ? "reportCard.rare" : "reportCard.common") : null;
  const rawScoredStr = t("reportCard.scoredOnQuiz") || "Scored {score}% on the module quiz assessment";
  const desc =
    m.quiz_percentage !== undefined
      ? rawScoredStr.replace("{score}", m.quiz_percentage.toFixed(0))
      : t("reportCard.completedFullProgress");

  return (
    <div className="relative">
      {!isLast && <span className="absolute left-[-19px] top-6 h-full w-[1.5px] bg-emerald-400" />}
      <span className="absolute left-[-28px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-emerald-500 text-white font-bold">
        ✓
      </span>
      <div className="border border-gray-200 rounded-xl p-3 mb-4">
        <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-medium text-xs">{title}</h3>
            {rarity && (
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full ${rarity === "Rare" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"}`}
              >
                {rarityText}
              </span>
            )}
          </div>
          {m.module_completion_date && (
            <span className="text-[10px] text-gray-400">📅 {m.module_completion_date}</span>
          )}
        </div>
        {badge && (
          <span className="inline-block mb-1.5 px-2.5 py-0.5 text-[10px] rounded-full border border-emerald-400 text-emerald-500">
            {badge}
          </span>
        )}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1 flex-wrap">
          <span className="text-orange-500">⭐ +{m.achieved_xp_tokens} XP</span>
          <span className="text-purple-500">🏆 {m.achieved_compliance_score} pts</span>
          {m.quiz_percentage !== undefined && (
            <span>📘 {m.quiz_percentage.toFixed(0)}% {t("reportCard.quizScore")}</span>
          )}
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-gray-600">
              {t("reportCard.certificateIssue")}: {m.certificate_issued || t("reportCard.notApplicable")}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-fuchsia-600">
            <Medal className="w-3.5 h-3.5 text-fuchsia-500" />
            <span className="text-gray-600">
              {t("reportCard.achievementUnlocked")}: {m.achievements_unlocked_in_module ?? 0}
            </span>
          </span>
          {m.duration_minutes && <span>⏱ {m.duration_minutes} {t("reportCard.minutes")}</span>}
        </div>
        <p className="text-[11px] text-gray-500">{desc}</p>
        <div className="mt-1.5">
          <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-600">
            {t("reportCard.completed")}
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
        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 h-24" />
            ))}
          </div>
        </div>
        <div className="col-span-4 col-start-9 bg-white rounded-xl h-64" />
        <div className="col-span-8 col-start-1 bg-white rounded-xl h-16" />
        <div className="col-span-8 bg-white rounded-2xl h-96" />
        <div className="col-span-4 col-start-9 bg-white rounded-2xl h-40" />
        <div className="col-span-4 col-start-9 bg-white rounded-xl h-48" />
      </div>
    </div>
  );
}

function NoCompletedModules({ t }: { t: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <p className="text-sm font-medium text-gray-700">{t("reportCard.noCompletedModules")}</p>
      <p className="text-[11px] text-gray-400 text-center max-w-xs leading-relaxed">
        {t("reportCard.noCompletedModulesDesc")}
      </p>
    </div>
  );
}

const SEG_COLORS = [
  "#9EC232",
  "#C1C625",
  "#EACB16",
  "#FFCD0F",
  "#EBA75C",
  "#E4590F",
  "#D1132A",
] as const;

/* ─── PDF Print: build standalone HTML document ─── */
function buildPrintHTML(args: {
  userName: string;
  userEmail: string;
  reportOwner: string;
  leaderboardRank: number;
  modulesCompleted: number;
  certificates: number;
  quizAccuracy: number;
  xpLevel: number;
  xpTokens: number;
  studyTime: number;
  userAvatarUrl: string;
  riskBadge: { text: string; bg: string };
  campaigns: Array<{ campaign_name: string; completed_modules: ReportCardModuleResult[] }>;
  chartData: number[];
  chartLabels: string[];
  chartDates: Date[];
  totalComplianceScore: number;
  t: any;
  dir?: "ltr" | "rtl";
  locale?: string;
}): string {
  const {
    userName,
    userEmail,
    reportOwner,
    leaderboardRank,
    modulesCompleted,
    certificates,
    quizAccuracy,
    xpLevel,
    xpTokens,
    studyTime,
    userAvatarUrl,
    riskBadge,
    campaigns,
    chartData,
    chartLabels,
    chartDates,
    totalComplianceScore,
    t,
    dir = "ltr",
    locale = "en",
  } = args;
  const today = formatToday();
  const studyStr = formatStudyTime(studyTime);

  /* Timeline HTML */
  const timelineHTML = campaigns
    .flatMap((campaign) =>
      campaign.completed_modules.map((m, idx) => ({
        module: m,
        campaign: campaign.campaign_name,
        isLastInCampaign: idx === campaign.completed_modules.length - 1,
      }))
    )
    .map(({ module: m, campaign: campName }, i) => {
      const title = m.module_name || "Module";
      const badge =
        m.quiz_percentage !== undefined
          ? m.quiz_percentage >= 90
            ? null
            : m.quiz_percentage >= 70
              ? t("reportCard.goodScore")
              : null
          : null;
      const rarity =
        m.achievements_unlocked_in_module >= 3
          ? "Rare"
          : m.achievements_unlocked_in_module >= 1
            ? "Common"
            : null;
      const rarityText = rarity ? t(rarity === "Rare" ? "reportCard.rare" : "reportCard.common") : null;
      const rawScoredStr = t("reportCard.scoredOnQuiz") || "Scored {score}% on the module quiz assessment";
      const desc =
        m.quiz_percentage !== undefined
          ? rawScoredStr.replace("{score}", m.quiz_percentage.toFixed(0))
          : t("reportCard.completedFullProgress");
      const rarityBg = rarity === "Rare" ? "#ffedd5" : "#e0f2fe";
      const rarityFg = rarity === "Rare" ? "#ea580c" : "#0284c7";

      return `
      <div style="position:relative;margin-bottom:16px;">
        ${!m.module_completion_date ? `<span style="position:absolute;left:-19px;top:24px;height:100%;width:1.5px;background:#34d399;display:block;"></span>` : ""}
        <span style="position:absolute;left:-28px;top:4px;width:20px;height:20px;border-radius:50%;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">✓</span>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="font-weight:500;font-size:12px;">${title}</span>
              ${rarity ? `<span style="padding:2px 8px;font-size:10px;border-radius:9999px;background:${rarityBg};color:${rarityFg};">${rarityText}</span>` : ""}
            </div>
            ${m.module_completion_date ? `<span style="font-size:10px;color:#9ca3af;">📅 ${m.module_completion_date}</span>` : ""}
          </div>
          ${badge ? `<span style="display:inline-block;margin-bottom:6px;padding:2px 10px;font-size:10px;border-radius:9999px;border:1px solid #34d399;color:#10b981;">${badge}</span>` : ""}
          <div style="display:flex;align-items:center;gap:12px;font-size:10px;color:#6b7280;margin-bottom:4px;flex-wrap:wrap;">
            <span style="color:#f97316;">⭐ +${m.achieved_xp_tokens} XP</span>
            <span style="color:#a855f7;">🏆 ${m.achieved_compliance_score} pts</span>
            ${m.quiz_percentage !== undefined ? `<span>📘 ${m.quiz_percentage.toFixed(0)}% ${t("reportCard.quizScore")}</span>` : ""}
            ${m.duration_minutes ? `<span>⏱ ${m.duration_minutes} ${t("reportCard.minutes")}</span>` : ""}
          </div>
          <p style="font-size:11px;color:#6b7280;">${desc}</p>
          <div style="margin-top:6px;">
            <span style="padding:2px 10px;font-size:10px;border-radius:9999px;background:#d1fae5;color:#059669;">${t("reportCard.completed")}</span>
          </div>
        </div>
      </div>`;
    })
    .join("");

  /* SVG area chart */
  const W = 280,
    H = 150,
    pT = 16,
    pR = 12,
    pB = 44,
    pL = 32;
  const iW = W - pL - pR,
    iH = H - pT - pB,
    maxY = Math.max(...chartData, 5);
  const dateIndices: Record<number, number[]> = {};

  chartDates.forEach((d, idx) => {
    const t = d.getTime();

    if (!dateIndices[t]) dateIndices[t] = [];
    dateIndices[t].push(idx);
  });
  const uniqueTimes = Array.from(new Set(chartDates.map((d) => d.getTime()))).sort((a, b) => a - b);

  const getPdfX = (i: number): number => {
    if (chartDates.length === 0) return pL + (i / Math.max(chartData.length - 1, 1)) * iW;
    const t = chartDates[i].getTime();
    const dateIdx = uniqueTimes.indexOf(t);
    const baseX = pL + (dateIdx / Math.max(uniqueTimes.length - 1, 1)) * iW;

    if (dateIdx === 0) return baseX;

    const currentIndices = dateIndices[t];
    const isLastForDate = i === currentIndices[currentIndices.length - 1];

    if (isLastForDate) return baseX;

    const prevT = uniqueTimes[dateIdx - 1];
    const prevIndices = dateIndices[prevT];
    const prevLastIdx = prevIndices[prevIndices.length - 1];
    const prevX = pL + ((dateIdx - 1) / Math.max(uniqueTimes.length - 1, 1)) * iW;

    const yStart = chartData[prevLastIdx];
    const yEnd = chartData[currentIndices[currentIndices.length - 1]];
    const yCurrent = chartData[i];

    if (yEnd === yStart) return baseX;

    const ratio = (yCurrent - yStart) / (yEnd - yStart);

    return prevX + ratio * (baseX - prevX);
  };
  const pts = chartData.map((v, i) => ({
    x: getPdfX(i),
    y: pT + iH - (Math.min(v, maxY) / maxY) * iH,
  }));
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = [
    `M ${(pts[0]?.x ?? pL).toFixed(1)},${(pT + iH).toFixed(1)}`,
    ...pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    `L ${(pts[pts.length - 1]?.x ?? pL + iW).toFixed(1)},${(pT + iH).toFixed(1)} Z`,
  ].join(" ");
  const yTicks = buildCountTicks(maxY);
  const svgChart = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:150px;overflow:visible;">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02"/>
    </linearGradient></defs>
    ${yTicks
      .map((t) => {
        const cy = pT + iH - (t / maxY) * iH;

        return `<line x1="${pL}" y1="${cy.toFixed(1)}" x2="${pL + iW}" y2="${cy.toFixed(1)}" stroke="#f1f5f9" stroke-width="1"/><text x="${pL - 4}" y="${(cy + 3).toFixed(1)}" text-anchor="end" font-size="7" fill="#94a3b8">${t}</text>`;
      })
      .join("")}
    <path d="${areaPath}" fill="url(#pg)"/>
    <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round"/>
    ${pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="#38bdf8" stroke="white" stroke-width="1.5"/>`).join("")}
    ${chartLabels
      .map((l, i) => {
        const x = getPdfX(i);

        return `<text x="${x.toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="7" fill="#94a3b8">${l}</text>`;
      })
      .join("")}
    <text x="${(pL + iW / 2).toFixed(1)}" y="${H + 3}" text-anchor="middle" font-size="8" fill="#6b7280">Module Completion Dates</text>
    <text x="8" y="${(pT + iH / 2).toFixed(1)}" text-anchor="middle" font-size="8" fill="#6b7280" transform="rotate(-90 8 ${(pT + iH / 2).toFixed(1)})">Module Counts</text>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8"/>
  <title>${t("reportCard.pageTitle")} – ${userName}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F1F5F8;margin:0;padding:20px;color:#111827;}
    .page-title{font-size:20px;font-weight:500;margin-bottom:12px;}
    .row{display:flex;gap:8px;margin-bottom:8px;align-items:stretch;}
    .stat-cards{display:flex;gap:8px;flex:0 0 66%;}
    .stat-card{flex:1;background:white;border-radius:16px;padding:20px;}
    .stat-label{font-size:14px;color:#4b5563;margin-bottom:8px;}
    .stat-value{font-size:28px;font-weight:600;}
    .stat-row{display:flex;justify-content:space-between;align-items:center;}
    .icon-circle{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .summary-card{flex:0 0 34%;background:white;border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,.1);}
    .posture-row{background:white;border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;margin-bottom:8px;}
    .seg-bar{display:flex;overflow:hidden;border-radius:8px;flex:1;height:12px;}
    .seg{flex:1;}
    .main-content{display:flex;gap:8px;align-items:flex-start;}
    .timeline-card{flex:1;background:white;border-radius:16px;padding:16px;}
    .timeline-inner{position:relative;padding-left:32px;}
    .right-col{flex:0 0 33.333%;display:flex;flex-direction:column;gap:8px;}
    .stats-panel{background:white;border-radius:16px;padding:12px;}
    .stat-item{display:flex;align-items:center;justify-content:space-between;background:#f5f8fb;border-radius:12px;padding:12px;margin-bottom:10px;}
    .stat-item:last-child{margin-bottom:0;}
    .stat-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px;}
    .stat-val{font-size:18px;font-weight:600;}
    .chart-card{background:white;border-radius:12px;padding:12px;}
    .tl-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .badge-pill{padding:2px 8px;font-size:11px;border-radius:9999px;background:#f3f4f6;color:#4b5563;}
    @media print{
      *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
      body{background:white!important;padding:10mm!important;}
      @page{size:A4;margin:10mm;}
    }
  </style>
</head>
<body>
  <h3 class="page-title">${t("reportCard.pageTitle")}</h3>

  <!-- Top row: 3 stat cards + summary card -->
  <div class="row">
    <div class="stat-cards">
      <div class="stat-card">
        <p class="stat-label">${t("reportCard.leaderboardRank")}</p>
        <div class="stat-row">
          <span class="stat-value">${leaderboardRank}</span>
          <div class="icon-circle" style="background:#fffbeb;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#facc15" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <p class="stat-label">${t("reportCard.modulesCompleted")}</p>
        <div class="stat-row">
          <span class="stat-value">${modulesCompleted}</span>
          <div class="icon-circle" style="background:#f0fdfa;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2dd4bf" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <p class="stat-label">${t("reportCard.certificates")}</p>
        <div class="stat-row">
          <span class="stat-value">${certificates}</span>
          <div class="icon-circle" style="background:#fef2f2;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f87171" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
          </div>
        </div>
      </div>
    </div>
    <!-- Summary card -->
    <div class="summary-card">
      <div>
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:#38bdf8;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <div>
            <h2 style="font-size:13px;font-weight:600;color:#111827;line-height:1.3;">${t("reportCard.securityAwarenessReport")}</h2>
            <p style="font-size:11px;color:#111827;margin-top:2px;">${userName}</p>
            <p style="font-size:11px;color:#6b7280;margin-top:2px;">${userEmail || reportOwner}</p>
            <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#6b7280;margin-top:6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>${t("reportCard.generatedOn", { date: today }).replace("{date}", today)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:20px;height:20px;border-radius:4px;background:#14b8a6;display:flex;align-items:center;justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8M3 17l6-6"/></svg>
            </div>
            <p style="font-size:12px;font-weight:500;color:#111827;">${t("reportCard.level")} <strong>${xpLevel}</strong></p>
          </div>
          <div style="width:25px;height:25px;border-radius:9999px;overflow:hidden;border:1px solid #e5e7eb;flex-shrink:0;">
            <img src="${userAvatarUrl}" alt="Level ${xpLevel}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Security Posture Bar -->
  <div class="posture-row">
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6b7280" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      <span style="font-size:12px;white-space:nowrap;">${t("reportCard.securityPosture")}</span>
    </div>
    <div class="seg-bar">
      <div class="seg" style="background:#9EC232;"></div>
      <div class="seg" style="background:#C1C625;"></div>
      <div class="seg" style="background:#EACB16;"></div>
      <div class="seg" style="background:#FFCD0F;"></div>
      <div class="seg" style="background:#EBA75C;"></div>
      <div class="seg" style="background:#E4590F;"></div>
      <div class="seg" style="background:#D1132A;"></div>
    </div>
    <span style="background:${riskBadge.bg};color:white;padding:2px 10px;border-radius:9999px;font-size:12px;white-space:nowrap;">${riskBadge.text}</span>
  </div>

  <!-- Timeline + Right column -->
  <div class="main-content">
    <div class="timeline-card">
      <div class="tl-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <h2 style="font-size:14px;font-weight:600;">${t("reportCard.learningJourneyTimeline")}</h2>
          <span class="badge-pill">${campaigns.reduce((sum, c) => sum + c.completed_modules.length, 0)} ${t("reportCard.task")}</span>
        </div>
      </div>
      <div class="timeline-inner">
        ${campaigns.length === 0 ? `<p style="font-size:13px;color:#6b7280;text-align:center;padding:32px 0;">${t("reportCard.noCompletedModules")}</p>` : campaigns.map(campaign => `
          <div style="margin-bottom:24px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="font-size:11px;color:#166534;background:#d1fae5;padding:2px 10px;border-radius:9999px;border:1px solid #a7f3d0;">${campaign.campaign_name}</span>
              <span style="font-size:10px;color:#9ca3af;">${campaign.completed_modules.length} Module</span>
            </div>
            <div style="position:relative;padding-left:32px;">
              ${campaign.completed_modules.map((m, idx) => {
    const t = m.module_name || "Module";
    const b = m.quiz_percentage !== undefined ? m.quiz_percentage >= 90 ? null : m.quiz_percentage >= 70 ? "Good Score" : null : null;
    const r = m.achievements_unlocked_in_module >= 3 ? "Rare" : m.achievements_unlocked_in_module >= 1 ? "Common" : null;
    const rBg = r === "Rare" ? "#ffedd5" : "#e0f2fe";
    const rFg = r === "Rare" ? "#ea580c" : "#0284c7";
    const d = m.quiz_percentage !== undefined ? `Scored ${m.quiz_percentage.toFixed(0)}% on the module quiz assessment` : "Completed and achieved full module progress";
    return `
              <div style="position:relative;margin-bottom:16px;">
                ${idx < campaign.completed_modules.length - 1 ? `<span style="position:absolute;left:-19px;top:24px;height:100%;width:1.5px;background:#34d399;display:block;"></span>` : ""}
                <span style="position:absolute;left:-28px;top:4px;width:20px;height:20px;border-radius:50%;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">✓</span>
                <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-weight:500;font-size:12px;">${t}</span>
                      ${r ? `<span style="padding:2px 8px;font-size:10px;border-radius:9999px;background:${rBg};color:${rFg};">${r}</span>` : ""}
                    </div>
                    ${m.module_completion_date ? `<span style="font-size:10px;color:#9ca3af;">📅 ${m.module_completion_date}</span>` : ""}
                  </div>
                  ${b ? `<span style="display:inline-block;margin-bottom:6px;padding:2px 10px;font-size:10px;border-radius:9999px;border:1px solid #34d399;color:#10b981;">${b}</span>` : ""}
                  <div style="display:flex;align-items:center;gap:12px;font-size:10px;color:#6b7280;margin-bottom:4px;flex-wrap:wrap;">
                    <span style="color:#f97316;">⭐ +${m.achieved_xp_tokens} XP</span>
                    <span style="color:#a855f7;">🏆 ${m.achieved_compliance_score} pts</span>
                    ${m.quiz_percentage !== undefined ? `<span>📘 ${m.quiz_percentage.toFixed(0)}% Quiz Score</span>` : ""}
                    <span style="display:inline-flex;align-items:center;gap:4px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2">
                        <circle cx="12" cy="12" r="9" fill="#d1fae5" stroke="none"/>
                        <path d="M8 12l2.5 2.5L16 9" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span>Certificate Issue: ${m.certificate_issued || "Not applicable"}</span>
                    </span>
                    <span style="display:inline-flex;align-items:center;gap:4px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#d946ef" stroke-width="2">
                        <circle cx="12" cy="12" r="9" fill="#f5d0fe" stroke="none"/>
                        <path d="M12 8l1.6 3.2 3.5.5-2.5 2.4.6 3.4L12 16l-3.2 1.5.6-3.4-2.5-2.4 3.5-.5L12 8z" stroke-linejoin="round"/>
                      </svg>
                      <span>Achievement Unlocked: ${m.achievements_unlocked_in_module ?? 0}</span>
                    </span>
                    ${m.duration_minutes ? `<span>⏱ ${m.duration_minutes} minutes</span>` : ""}
                  </div>
                  <p style="font-size:11px;color:#6b7280;">${d}</p>
                  <div style="margin-top:6px;">
                    <span style="padding:2px 10px;font-size:10px;border-radius:9999px;background:#d1fae5;color:#059669;">Completed</span>
                  </div>
                </div>
              </div>`;
  }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="right-col">
      <!-- Stats Panel -->
      <div class="stats-panel">
        <div class="stat-item">
          <div style="display:flex;align-items:center;">
            <div class="stat-icon" style="background:#fed7aa;">
              <svg width="16" height="16" fill="none" stroke="#f97316" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <p style="font-size:12px;font-weight:500;color:#111827;">${t("reportCard.xpTokensEarned")}</p>
              <p style="font-size:11px;color:#6b7280;">${t("reportCard.totalAcrossAllCampaigns")}</p>
            </div>
          </div>
          <span class="stat-val" style="color:#f97316;">${xpTokens.toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <div style="display:flex;align-items:center;">
            <div class="stat-icon" style="background:#e9d5ff;">
              <svg width="16" height="16" fill="none" stroke="#a855f7" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m7.228-4.228A10 10 0 1121.213 21.213a10 10 0 01-12.485-14.228z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div>
              <p style="font-size:12px;font-weight:500;color:#111827;">${t("reportCard.complianceScore")}</p>
              <p style="font-size:11px;color:#6b7280;">${t("reportCard.totalPointsEarned")}</p>
            </div>
          </div>
          <span class="stat-val" style="color:#a855f7;">${totalComplianceScore}</span>
        </div>
        <div class="stat-item">
          <div style="display:flex;align-items:center;">
            <div class="stat-icon" style="background:#ccfbf1;">
              <svg width="16" height="16" fill="none" stroke="#2dd4bf" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p style="font-size:12px;font-weight:500;color:#111827;">${t("reportCard.avgQuizScore")}</p>
              <p style="font-size:11px;color:#6b7280;">${t("reportCard.performanceAcrossQuizzes")}</p>
            </div>
          </div>
          <span class="stat-val" style="color:#2dd4bf;">${quizAccuracy.toFixed(0)}%</span>
        </div>
      </div>
      <!-- Module Chart -->
      <div class="chart-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <h3 style="font-size:14px;font-weight:600;color:#1f2937;">${t("reportCard.moduleChart")}</h3>
        </div>
        ${chartData.length > 0 ? svgChart : `<p style="font-size:10px;color:#9ca3af;text-align:center;padding:24px 0;">${t("reportCard.moduleChartDesc")}</p>`}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ─── Main Page ─── */
export function ReportCardPage({ userId }: { userId?: number } = {}) {
  const t = useTranslations("dashboard");
  const { dir, locale } = useI18n();
  const { user } = useAuthStore();

  // Use useUserReportCard if userId is provided, otherwise use useMyReportCard
  const { data: response, isLoading, isError } = userId
    ? useUserReportCard(userId)
    : useMyReportCard();

  const result: any = response?.success ? response.data : undefined;
  const meta = result?.meta_statistics as Record<string, unknown> | undefined;
  const campaigns =
    (result?.campaigns as Array<{
      campaign_name: string;
      completed_modules: ReportCardModuleResult[];
    }>) ?? [];

  const allModules = useMemo(() => {
    const arr: Array<{ module: ReportCardModuleResult; campaign: string }> = [];

    campaigns.forEach((c) =>
      c.completed_modules.forEach((m) => arr.push({ module: m, campaign: c.campaign_name }))
    );

    return arr;
  }, [campaigns]);

  const totalSurveySent = useMemo(
    () => allModules.reduce((s, { module: m }) => s + m.total_attempted_quizzes, 0),
    [allModules]
  );
  const leaderboardRank = (meta?.leaderboard_rank as number | null | undefined) ?? totalSurveySent;
  const modulesCompleted =
    (meta?.total_modules_completed as number | undefined) ?? allModules.length;
  const totalCertificates = (meta?.total_completed_certificates as number | undefined) ?? 0;
  const quizAccuracy = (meta?.quizzes_accuracy_percent as number | undefined) ?? 0;
  const xpLevel = (meta?.user_avatar_level as number | undefined) ?? 0;
  const xpTokens = (meta?.xp_total_tokens as number | undefined) ?? 0;
  const studyTime = (meta?.total_study_time as number | undefined) ?? 0;
  const riskLevel = (meta?.user_risk_level as string | null | undefined) ?? null;
  const riskBadge = getRiskBadge(riskLevel);

  const totalComplianceScore = useMemo(
    () => allModules.reduce((s, { module: m }) => s + (m.achieved_compliance_score || 0), 0),
    [allModules]
  );

  const completionChart = useMemo(() => {
    const allDatedModules = allModules
      .map(({ module }) => ({
        date: parseModuleCompletionDate(module.module_completion_date),
        rawDate: module.module_completion_date,
      }))
      .filter((item): item is { date: Date; rawDate: string } => !!item.date)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningCount = 0;
    const data: number[] = [];
    const labels: string[] = [];
    const dates: Date[] = [];

    // Prepend a starting zero point (one day before first completion) so the line draws from 0
    if (allDatedModules.length > 0) {
      const firstDate = new Date(allDatedModules[0].date);
      firstDate.setDate(firstDate.getDate() - 1);
      data.push(0);
      labels.push("");
      dates.push(new Date(firstDate));
    }

    allDatedModules.forEach((m, idx) => {
      runningCount += 1;
      data.push(runningCount);

      // Only show the date label for the last module of each day to avoid overlap
      const nextM = allDatedModules[idx + 1];
      const isLastForDay = !nextM || nextM.date.getTime() !== m.date.getTime();
      labels.push(isLastForDay ? formatChartDateLabel(m.date) : "");
      dates.push(new Date(m.date));
    });

    return { data, labels, dates };
  }, [allModules]);

  const chartData = completionChart.data;
  const chartLabels = completionChart.labels;
  const chartDates = completionChart.dates;

  const anyUser = user as any;
  const responseUser = (result?.user ?? {}) as Record<string, unknown>;
  const responseFirstName = String(responseUser?.first_name ?? "").trim();
  const responseLastName = String(responseUser?.last_name ?? "").trim();
  const responseFullName = `${responseFirstName} ${responseLastName}`.trim();
  const responseEmail = String(responseUser?.email ?? "").trim();
  const responseDisplayName = String(responseUser?.name ?? responseUser?.username ?? "").trim();
  const fallbackName = String(anyUser?.name ?? anyUser?.username ?? "").trim();
  const fallbackEmail = String(anyUser?.email ?? user?.email ?? "").trim();

  const userName: string = responseFullName || responseDisplayName || fallbackName || responseEmail || fallbackEmail || "User";
  const userEmail: string = responseEmail || fallbackEmail || "";
  const reportOwner: string = userEmail || userName;
  const userAvatarUrl = getContentAssetUrl(
    `/images/avatars/${AVATAR_IMAGE_BY_LEVEL[xpLevel] ?? AVATAR_IMAGE_BY_LEVEL[1]}`
  );

  function handleDownload() {
    const html = buildPrintHTML({
      userName,
      userEmail,
      reportOwner,
      leaderboardRank,
      modulesCompleted,
      certificates: totalCertificates,
      quizAccuracy,
      xpLevel,
      xpTokens,
      studyTime,
      userAvatarUrl,
      riskBadge,
      campaigns,
      chartData,
      chartLabels,
      chartDates,
      totalComplianceScore,
      t,
      dir,
      locale,
    });
    const win = window.open("", "_blank", "width=1000,height=800");

    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    /* Wait for rendering, then print once */
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore if window was closed */
      }
    }, 500);
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <LoadingSkeleton />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  if (isError) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-3 flex items-center justify-center h-64">
            <p className="text-sm text-gray-600">{t("reportCard.loading")}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* ── Page Title ── */}
        <div className="flex flex-col p-3 pb-0 gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">{t("reportCard.pageTitle")}</h3>
          </div>
        </div>

        <div className="p-3 overflow-auto">
          <div className="grid grid-cols-12 gap-2">
            {/* ══ Stat Cards ══ */}
            <div className="col-span-12 md:col-span-8 md:row-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">{t("reportCard.leaderboardRank")}</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{leaderboardRank}</h3>
                    <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">{t("reportCard.modulesCompleted")}</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{modulesCompleted}</h3>
                    <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5">
                  <p className="text-gray-600 text-sm">{t("reportCard.certificates")}</p>
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-3xl font-semibold">{totalCertificates}</h3>
                    <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 14l9-5-9-5-9 5 9 5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ Report Summary Card ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-4 md:col-start-9 md:row-start-1">
              <div className="bg-white rounded-xl p-3 h-full flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                        {t("reportCard.securityAwarenessReport")}
                      </h2>
                      <p className="text-[11px] text-gray-900 mt-0.5">
                        {userName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {userEmail || reportOwner}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5">
                        <svg
                          className="w-3 h-3 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{t("reportCard.generatedOn", { date: formatToday() }).replace("{date}", formatToday())}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-teal-500 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-xs font-medium text-gray-900">
                        {t("reportCard.level")} <span className="font-semibold">{xpLevel}</span>
                      </p>
                    </div>
                    <div className="w-[25px] h-[25px] rounded-full overflow-hidden border border-gray-200 bg-slate-100">
                      <img alt={`Level ${xpLevel}`} className="w-full h-full object-cover" src={userAvatarUrl} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-50 transition w-full text-[11px] border border-gray-200"
                    onClick={() => {
                      if (navigator.share)
                        navigator.share({
                          title: t("reportCard.securityAwarenessReport"),
                          text: t("reportCard.comprehensiveProgressReport", { name: "Me" }).replace("{name}", "Me"),
                        });
                      else alert("Share feature not available on this device.");
                    }}
                  >
                    <span className="font-semibold">0</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-400 text-white font-medium hover:bg-sky-500 transition w-full text-[11px]"
                    onClick={handleDownload}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("reportCard.download")}
                  </button>
                </div>
              </div>
            </div>

            {/* ══ Security Posture Bar ══ */}
            <div className="col-span-12 md:col-span-8 md:col-start-1 md:row-start-3">
              <div className="bg-white rounded-xl p-3 flex items-center gap-4 w-full">
                <div className="relative flex gap-2 items-center flex-shrink-0">
                  <Shield className="w-3 h-3 text-gray-500" />
                  <h3 className="text-xs whitespace-nowrap">{t("reportCard.securityPosture")}</h3>
                  <div className="relative group">
                    <svg
                      className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="absolute left-1/2 top-6 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 pointer-events-none group-hover:pointer-events-auto">
                      <div className="p-4 text-xs text-gray-900 rounded-xl bg-white border border-gray-300 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-4 h-4 text-blue-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <h3 className="font-medium">{t("reportCard.securityPostureInfo")}</h3>
                        </div>
                        <p className="leading-relaxed text-gray-600">
                          {t("reportCard.securityPostureDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex overflow-hidden rounded-lg w-full">
                    {SEG_COLORS.map((c) => (
                      <div key={c} className="h-3 w-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <p
                  className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap text-white"
                  style={{ backgroundColor: riskBadge.bg }}
                >
                  {riskBadge.text}
                </p>
              </div>
            </div>

            {/* ══ Learning Journey Timeline ══ */}
            <div className="col-span-12 md:col-span-8 md:row-span-9 md:row-start-4">
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{t("reportCard.learningJourneyTimeline")}</h2>
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600">
                      {allModules.length} {t("reportCard.task")}
                    </span>
                  </div>
                  <button className="text-xs text-sky-500 hover:underline">{t("reportCard.viewAll")}</button>
                </div>
                {campaigns.length === 0 ? (
                  <NoCompletedModules t={t} />
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.campaign_name}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            {campaign.campaign_name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {campaign.completed_modules.length} {t("reportCard.task")}
                          </span>
                        </div>
                        <div className="relative pl-8">
                          {campaign.completed_modules.length === 0 ? (
                            <NoCompletedModules t={t} />
                          ) : (
                            campaign.completed_modules.map((module, i) => (
                              <TimelineItem
                                key={`${module.module_id}-${i}`}
                                isLast={i === campaign.completed_modules.length - 1}
                                module={module}
                                t={t}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ══ Stats Panel ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-2 md:col-start-9 md:row-start-5">
              <div className="bg-white rounded-2xl p-3 h-full flex flex-col justify-center">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{t("reportCard.xpTokensEarned")}</p>
                        <p className="text-[11px] text-gray-500">{t("reportCard.totalAcrossAllCampaigns")}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-orange-400">{xpTokens.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{t("reportCard.complianceScore")}</p>
                        <p className="text-[11px] text-gray-500">{t("reportCard.totalPointsEarned")}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-purple-400">{totalComplianceScore}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-teal-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{t("reportCard.avgQuizScore")}</p>
                        <p className="text-[11px] text-gray-500">{t("reportCard.performanceAcrossQuizzes")}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-teal-400">
                      {quizAccuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F5F8FB] rounded-xl p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{t("reportCard.totalLearningTime")}</p>
                        <p className="text-[11px] text-gray-500">{t("reportCard.totalXpLearned", { xp: xpTokens }).replace("{xp}", String(xpTokens))}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-blue-400">
                      {formatStudyTime(studyTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ Module Chart ══ */}
            <div className="col-span-12 md:col-span-4 md:row-span-4 md:col-start-9 md:row-start-7">
              <div className="bg-white rounded-xl p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-800">{t("reportCard.moduleChart")}</h3>
                  <button className="text-blue-600 text-xs font-medium hover:underline">
                    {t("reportCard.viewAll")}
                  </button>
                </div>
                {chartData.length > 0 ? (
                  <div className="flex-1 min-h-[120px]">
                    <AreaChart data={chartData} labels={chartLabels} dates={chartDates} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-[10px] text-gray-400 text-center">
                      {t("reportCard.moduleChartDesc")}
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
