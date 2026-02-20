"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

import { useTranslations } from "@/i18n/useTranslations";

interface CampaignFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  dateFilter: string;
  onDateChange: (date: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusCounts?: {
    all: number;
    active: number;
    pending: number;
    completed: number;
  };
}

export function CampaignFilters({
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  searchQuery,
  onSearchChange,
  statusCounts = { all: 0, active: 0, pending: 0, completed: 0 },
}: CampaignFiltersProps) {
  const t = useTranslations("campaigns");
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { id: "all", label: t("filters.all"), count: statusCounts.all, status: "all" },
    { id: "active", label: t("filters.active"), count: statusCounts.active, status: "2" },
    { id: "pending", label: t("filters.pending"), count: statusCounts.pending, status: "20" },
    { id: "completed", label: t("filters.completed"), count: statusCounts.completed, status: "5" },
  ];

  const activeTabIndex = tabs.findIndex((t) => t.status === statusFilter);

  // Update indicator position when active tab changes
  useEffect(() => {
    if (tabsContainerRef.current) {
      const tabButtons = tabsContainerRef.current.querySelectorAll('.tab-btn');
      const activeTab = tabButtons[activeTabIndex] as HTMLElement;

      if (activeTab) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();

        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [activeTabIndex, statusFilter]);

  return (
    <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          .campaign-filters .tab-btn {
            background: transparent !important;
          }
          .campaign-filters .tab-btn.active {
            background: transparent !important;
            color: white !important;
          }
          .campaign-filters .tab-btn:hover:not(.active) {
            background: #f3f4f6 !important;
          }
        `
      }} />

      {/* Tabs with Sliding Indicator */}
      <div ref={tabsContainerRef} className="campaign-filters flex gap-0 bg-white p-0.5 rounded-full relative">
        {/* Sliding background indicator */}
        <div
          className="absolute bg-[#051226] rounded-full transition-all duration-300"
          style={{
            top: "3px",
            height: "calc(100% - 6px)",
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {tabs.map((tab) => {
          const isActive = tab.status === statusFilter;

          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.status)}
              className={clsx(
                `tab-btn ${isActive ? 'active' : ''} px-3 py-0.5 text-xs font-semibold rounded-full transition-colors duration-200`,
                "inline-flex items-center gap-2 relative z-10 whitespace-nowrap",
                isActive ? "text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
              )}
              type="button"
            >
              <span>{tab.label}</span>
              <span
                className={clsx(
                  "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                  isActive ? "bg-white/30 text-white" : "bg-green-100 text-green-400"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Date Filter */}
      <div className="flex gap-2">
        {/* Search with Icon */}
        <div className="relative w-64">
          <Search
            className="absolute text-gray-400 pointer-events-none z-10"
            style={{
              width: 16,
              height: 16,
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            type="text"
            placeholder={t("filters.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-4 py-2.5 text-xs border bg-white border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
        >
          <option value="all">{t("filters.allTime")}</option>
          <option value="7">{t("filters.last7Days")}</option>
          <option value="30">{t("filters.last30Days")}</option>
          <option value="90">{t("filters.last3Months")}</option>
          <option value="180">{t("filters.last6Months")}</option>
          <option value="365">{t("filters.thisYear")}</option>
        </select>
      </div>
    </div>
  );
}
